#!/usr/bin/env node

/**
 * Owner-run security-header verifier for a DEPLOYED or PREVIEW URL (Batch 8.2).
 *
 * The `_headers` file is applied by Cloudflare Pages at the edge, so the header set
 * can only be verified against a served URL — not the offline build. This is an
 * operations tool, not part of the offline gate battery. It lives in scripts/ (not
 * src/), so its use of fetch is outside the first-party scope-gate (ADR 0006).
 *
 * Usage: node scripts/check-security-headers.mjs https://your-site.example
 *        npm run headers:check -- https://your-site.example
 */

import process from 'node:process';

const url = process.argv[2];
if (!url) {
  process.stderr.write('Usage: node scripts/check-security-headers.mjs <url>\n');
  process.exitCode = 2;
  process.exit();
}

// Required headers and a predicate over the received value. Predicates check the
// security-relevant substance, not exact byte-equality, so cosmetic edits don't
// cause false failures.
const CHECKS = [
  {
    name: 'content-security-policy',
    ok: (v) =>
      /(^|;)\s*default-src\s+'self'/.test(v) &&
      /(^|;)\s*script-src\s+'self'/.test(v) &&
      !/script-src[^;]*'unsafe-inline'/.test(v) &&
      !/script-src[^;]*'unsafe-eval'/.test(v) &&
      /(^|;)\s*object-src\s+'none'/.test(v) &&
      /(^|;)\s*frame-ancestors\s+'none'/.test(v),
    describe:
      "default-src 'self'; strict script-src 'self'; object-src 'none'; frame-ancestors 'none'",
  },
  {
    name: 'strict-transport-security',
    ok: (v) => /max-age=\d{7,}/.test(v) && /includeSubDomains/i.test(v) && /preload/i.test(v),
    describe: 'max-age ≥ 1e7, includeSubDomains, preload',
  },
  {
    name: 'x-content-type-options',
    ok: (v) => /^nosniff$/i.test(v.trim()),
    describe: 'nosniff',
  },
  {
    name: 'referrer-policy',
    ok: (v) => /strict-origin-when-cross-origin|no-referrer/i.test(v),
    describe: 'strict-origin-when-cross-origin (or stricter)',
  },
  {
    name: 'permissions-policy',
    ok: (v) => /camera=\(\)/.test(v) && /geolocation=\(\)/.test(v) && /microphone=\(\)/.test(v),
    describe: 'powerful features disabled (camera/geolocation/microphone=())',
  },
  {
    name: 'x-frame-options',
    ok: (v) => /^deny$/i.test(v.trim()),
    describe: 'DENY',
  },
  {
    name: 'cross-origin-opener-policy',
    ok: (v) => /same-origin/i.test(v),
    describe: 'same-origin',
  },
  {
    name: 'cross-origin-resource-policy',
    ok: (v) => /same-origin/i.test(v),
    describe: 'same-origin',
  },
];

const response = await fetch(url, { redirect: 'manual' });
const rows = [];
let failures = 0;

for (const check of CHECKS) {
  const value = response.headers.get(check.name);
  const present = value !== null;
  const passed = present && check.ok(value);
  if (!passed) {
    failures += 1;
  }
  rows.push(
    `| ${check.name} | ${passed ? 'pass' : 'FAIL'} | ${check.describe} | ${
      present ? value : '(absent)'
    } |`,
  );
}

process.stdout.write(
  [
    `# Security header check — ${url}`,
    `HTTP status: ${response.status}`,
    '',
    '| Header | Result | Expected | Received |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n') + '\n',
);

if (failures > 0) {
  process.stderr.write(`\n${failures} security header check(s) FAILED.\n`);
  process.exitCode = 1;
}
