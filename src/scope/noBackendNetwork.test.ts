import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

/**
 * Scope gate (ADR 0006): Narramorph v1 ships client-only, with no backend and no
 * first-party network egress. This test runs the same scanner as `npm run scope:check`
 * so the client-only decision is enforced in the gate battery (`test:run`) and cannot
 * be re-opened silently. A deliberate, reviewed egress is recorded in the ALLOWLIST in
 * scripts/check-no-network.mjs.
 */
describe('scope gate: v1 ships client-only (no backend)', () => {
  it('has no disallowed network primitive in first-party src/ code', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'check-no-network.mjs');

    let output: string;
    try {
      output = execFileSync(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string };
      throw new Error(
        'scope-gate scan found a network primitive in src/. Client-only is the v1 architecture ' +
          '(ADR 0006); a deliberate first-party egress must pass privacy/consent/redaction review and ' +
          'be recorded in the ALLOWLIST in scripts/check-no-network.mjs.\n' +
          `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
      );
    }

    expect(output).toContain('scope gate: OK');
  });
});
