import { describe, expect, it } from 'vitest';

import { DANGEROUS_KEYS, MAX_SAVE_IMPORT_CHARS, safeParseSaveJson } from './importSanitization';

describe('safeParseSaveJson — save-import sanitization (Batch 8.2)', () => {
  it('parses a valid save and returns the value', () => {
    const result = safeParseSaveJson('{"version":"1.3.0","progress":{}}');
    expect(result).toEqual({ ok: true, value: { version: '1.3.0', progress: {} } });
  });

  it('rejects malformed JSON as a parse failure (never throws)', () => {
    expect(safeParseSaveJson('{not valid json')).toEqual({ ok: false, reason: 'parse' });
    expect(safeParseSaveJson('')).toEqual({ ok: false, reason: 'parse' });
  });

  it('rejects oversized input without parsing it', () => {
    const oversized = `"${'a'.repeat(MAX_SAVE_IMPORT_CHARS)}"`;
    expect(oversized.length).toBeGreaterThan(MAX_SAVE_IMPORT_CHARS);
    expect(safeParseSaveJson(oversized)).toEqual({ ok: false, reason: 'oversize' });
  });

  it('drops prototype-pollution keys during parse and never pollutes Object.prototype', () => {
    const payload =
      '{"a":1,"__proto__":{"polluted":1},"nested":{"constructor":{"x":2},"prototype":{"y":3},"keep":4}}';

    const result = safeParseSaveJson(payload);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const value = result.value as Record<string, unknown>;
    expect(Object.getOwnPropertyNames(value).sort()).toEqual(['a', 'nested']);
    const nested = value.nested as Record<string, unknown>;
    expect(Object.getOwnPropertyNames(nested)).toEqual(['keep']);

    // The global object prototype is untouched by the hostile payload.
    const probe = {} as Record<string, unknown>;
    expect(probe.polluted).toBeUndefined();
    expect(probe.x).toBeUndefined();
    expect(probe.y).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('preserves a legitimate save-shaped object (no false positives)', () => {
    const raw =
      '{"version":"1.3.0","appVersion":"0.1.0","progress":{"visitedNodes":{"arch-L1":{"visits":1}}},"preferences":{"theme":"dark"}}';
    const result = safeParseSaveJson(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const value = result.value as { preferences: { theme: string }; progress: unknown };
    expect(value.preferences.theme).toBe('dark');
    expect(value.progress).toEqual({ visitedNodes: { 'arch-L1': { visits: 1 } } });
  });

  it('documents the exact key set it strips', () => {
    expect([...DANGEROUS_KEYS].sort()).toEqual(['__proto__', 'constructor', 'prototype']);
  });
});
