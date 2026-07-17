/**
 * Trust-boundary sanitization for untrusted save JSON (Batch 8.2).
 *
 * The save-file import and the stored-save load are the only runtime paths that
 * ingest untrusted bytes (client-only v1; ADR 0006). This module bounds the input
 * size and strips prototype-pollution keys (`__proto__` / `constructor` /
 * `prototype`) during parse, before the value reaches migration/validation or any
 * later merge. It is defense-in-depth: the current apply path uses spread and
 * reference assignment (not `Object.assign` of untrusted keys), but sanitizing at
 * the boundary keeps a future refactor — or a deep merge — safe, and removes dirty
 * keys from persisted data.
 */

/** Keys that can escalate to prototype pollution; dropped during parse. */
export const DANGEROUS_KEYS: readonly string[] = ['__proto__', 'constructor', 'prototype'];

/**
 * Upper bound on an imported/stored save string (UTF-16 code units). A complete
 * journey — including the capped visit-event prose log (`VISIT_EVENT_LOG_LIMITS`,
 * on the order of 2 MB) — is far smaller; this rejects absurd/hostile payloads
 * without truncating a legitimate save.
 */
export const MAX_SAVE_IMPORT_CHARS = 8 * 1024 * 1024;

export type SafeParseResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: 'oversize' | 'parse' };

const dangerous = new Set<string>(DANGEROUS_KEYS);

function dropDangerousKeys(key: string, value: unknown): unknown {
  return dangerous.has(key) ? undefined : value;
}

/**
 * Size-bounds and parses an untrusted save string, dropping prototype-pollution
 * keys during parse. Returns a discriminated result rather than throwing, so
 * callers keep their non-blocking recovery paths (quarantine / user notice)
 * instead of crashing on hostile input.
 */
export function safeParseSaveJson(raw: string): SafeParseResult {
  if (raw.length > MAX_SAVE_IMPORT_CHARS) {
    return { ok: false, reason: 'oversize' };
  }

  try {
    return { ok: true, value: JSON.parse(raw, dropDangerousKeys) };
  } catch {
    return { ok: false, reason: 'parse' };
  }
}
