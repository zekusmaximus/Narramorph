#!/usr/bin/env node

/**
 * Scope-gate guard for the client-only v1 architecture (ADR 0006).
 *
 * Narramorph v1 ships as a static, client-side product with local persistence and
 * makes no network calls of its own (ADR 0001 §7). This check scans `src/` for the
 * network primitives a backend/telemetry egress would introduce and fails if one
 * appears, so the client-only decision cannot be re-opened silently — a deliberate,
 * reviewed egress must be recorded in ALLOWLIST below (which shows up in the diff).
 *
 * It is a tripwire, not a security boundary: the real boundary is code review. Third-
 * party transports (e.g. a future error-monitoring SDK in Batch 8.3) live in
 * `node_modules` and are not scanned here; only first-party `src/` code is.
 *
 * Run: `npm run scope:check`. Enforced in the test suite via
 * `src/scope/noBackendNetwork.test.ts`.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const scanRoot = path.join(root, 'src');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);

// Files that legitimately reference these primitives without introducing an egress
// (tests, type declarations, mocks) are excluded from the scan.
const isExcludedFile = (relativePath) =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(relativePath) ||
  /\.d\.ts$/.test(relativePath) ||
  relativePath.includes('/__tests__/') ||
  relativePath.includes('/__mocks__/');

// The network primitives that would signal a backend/telemetry egress in first-party code.
const PRIMITIVES = [
  { id: 'fetch', label: 'fetch(', pattern: /\bfetch\s*\(/ },
  { id: 'axios', label: 'axios', pattern: /\baxios\b/ },
  { id: 'xmlHttpRequest', label: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { id: 'webSocket', label: 'WebSocket', pattern: /\bWebSocket\b/ },
  { id: 'sendBeacon', label: 'navigator.sendBeacon', pattern: /\bsendBeacon\b/ },
  { id: 'eventSource', label: 'EventSource', pattern: /\bEventSource\b/ },
];

/**
 * Deliberate, reviewed exceptions. Each entry is a first-party egress that passed
 * privacy/consent/redaction review (e.g. a monitoring transport). Keep it empty
 * unless an owner-approved batch adds one, and record the reason inline.
 *
 * Shape: { file: '<posix path under repo root>', primitive: '<PRIMITIVES id>', reason: '...' }
 */
const ALLOWLIST = [];

const isAllowlisted = (relativePath, primitiveId) =>
  ALLOWLIST.some((entry) => entry.file === relativePath && entry.primitive === primitiveId);

const collectSourceFiles = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) {
      files.push(...collectSourceFiles(absolute));
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry))) {
      files.push(absolute);
    }
  }
  return files;
};

const toPosixRelative = (absolute) => path.relative(root, absolute).split(path.sep).join('/');

const violations = [];
const sourceFiles = collectSourceFiles(scanRoot);
let scannedCount = 0;

for (const absolute of sourceFiles) {
  const relativePath = toPosixRelative(absolute);
  if (isExcludedFile(relativePath)) {
    continue;
  }
  scannedCount += 1;
  const lines = readFileSync(absolute, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const primitive of PRIMITIVES) {
      if (primitive.pattern.test(line) && !isAllowlisted(relativePath, primitive.id)) {
        violations.push({
          file: relativePath,
          line: index + 1,
          primitive: primitive.label,
          text: line.trim(),
        });
      }
    }
  });
}

if (violations.length > 0) {
  const detail = violations
    .map(
      (violation) =>
        `  ${violation.file}:${violation.line}  [${violation.primitive}]  ${violation.text}`,
    )
    .join('\n');
  process.stderr.write(
    `scope gate: FAIL — ${violations.length} network primitive(s) in src/ (client-only v1, ADR 0006).\n` +
      `A first-party network egress must pass privacy/consent/redaction review and be recorded in the\n` +
      `ALLOWLIST in scripts/check-no-network.mjs (or removed).\n${detail}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `scope gate: OK — scanned ${scannedCount} first-party source file(s) in src/; ` +
      `0 network primitives (client-only v1, ADR 0006).\n`,
  );
}
