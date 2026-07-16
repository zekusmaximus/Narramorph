import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  checkVariation,
  runCanonValidation,
  validateCanonRules,
  validateCanonWaivers,
  type CanonRules,
  type CanonWaiver,
} from '../lib/canon-validator';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

async function loadRules(): Promise<CanonRules> {
  return validateCanonRules(
    JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'story-packages/concordance/canon-rules.v1.json'),
        'utf8',
      ),
    ),
  );
}

const singleVoiceL1 = { voiceIds: ['last-human'], layer: 1 };
const noWaivers: CanonWaiver[] = [];
const none = new Set<string>();

function check(
  content: string,
  rules: CanonRules,
  context = singleVoiceL1,
  waivers = noWaivers,
  expired = none,
) {
  return checkVariation(
    { variationId: 'test-fam-001', family: 'test-fam', content },
    context,
    rules,
    waivers,
    expired,
  );
}

describe('canon validator (manuscript rules ported at 6720e76)', () => {
  it('fails a deliberately flattened "same person" reading (Four Shackles gate)', async () => {
    const rules = await loadRules();
    const flattened = [
      'The three of them were the same person all along.',
      "We're not three separate examinations. We're single consciousness distributed across temporal positions.",
      'He recognized himself in the Algorithm.',
    ].join('\n');

    const findings = check(flattened, rules);
    const shackleErrors = findings.filter(
      (finding) => finding.ruleId.startsWith('shackles.') && finding.severity === 'error',
    );
    expect(shackleErrors.length).toBeGreaterThanOrEqual(3);
    expect(shackleErrors.map((finding) => finding.ruleId)).toContain('shackles.identity');
  });

  it('flags forbidden narrative moves: transmission, planning, transcendence', async () => {
    const rules = await loadRules();
    const findings = check(
      [
        'She sent the protocols back through the closing loop.',
        'The Algorithm planned for this contingency across centuries.',
        'At last he transcended the human, free from the constraints of time.',
      ].join('\n'),
      rules,
    );
    const ruleIds = findings.map((finding) => finding.ruleId);
    expect(ruleIds).toContain('forbidden-moves.transmission');
    expect(ruleIds).toContain('forbidden-moves.goal-planning');
    expect(ruleIds).toContain('forbidden-moves.transcendence');
  });

  it('reports renamed entities and absolute dates as owner-demoted warnings with decision refs', async () => {
    const rules = await loadRules();
    const findings = check(
      'Seventeen years into the Upload Era, in 2151, the Great Aggregation began.',
      rules,
    );
    const demoted = findings.filter(
      (finding) =>
        finding.ruleId.startsWith('terminology.') || finding.ruleId === 'chronology.absolute-date',
    );
    const ruleIds = demoted.map((finding) => finding.ruleId);
    expect(ruleIds).toContain('terminology.upload-era');
    expect(ruleIds).toContain('terminology.great-aggregation');
    expect(ruleIds).toContain('chronology.absolute-date');
    // Owner decisions D1/D2 (CTR-005/CTR-006 accepted-as-is) demote these to visible warnings.
    expect(demoted.every((finding) => finding.severity === 'warning')).toBe(true);
    expect(demoted.every((finding) => finding.note.includes('CTR-00'))).toBe(true);

    const clean = check('Decades from now, the Integration Era shapes every contract.', rules);
    expect(clean.filter((finding) => finding.severity === 'error')).toHaveLength(0);
  });

  it('warns on cross-voice contamination at L1/L2 but licenses dissolution-era content', async () => {
    const rules = await loadRules();
    const contaminated =
      'I process the ruins. 94.7% structural coherence in her neural mapping. The interface hums.';

    const atL1 = check(contaminated, rules, { voiceIds: ['last-human'], layer: 1 });
    const contamination = atL1.filter((finding) =>
      finding.ruleId.startsWith('voice.contamination.'),
    );
    expect(contamination.length).toBeGreaterThan(0);
    expect(contamination.every((finding) => finding.severity === 'warning')).toBe(true);

    const atL3 = check(contaminated, rules, { voiceIds: ['last-human'], layer: 3 });
    expect(atL3.filter((finding) => finding.ruleId.startsWith('voice.'))).toHaveLength(0);

    const multiVoice = check(contaminated, rules, {
      voiceIds: ['algorithm', 'archaeologist', 'last-human'],
      layer: 2,
    });
    expect(multiVoice.filter((finding) => finding.ruleId.startsWith('voice.'))).toHaveLength(0);
  });

  it('never reports designed repetition', async () => {
    const rules = await loadRules();
    const findings = check(
      'The form is what makes self-observation possible. I find myself found.',
      rules,
      { voiceIds: ['archaeologist'], layer: 1 },
    );
    const nonSignature = findings.filter((finding) => finding.ruleId !== 'voice.signature');
    expect(nonSignature).toHaveLength(0);
  });

  it('honors unexpired waivers without disabling the rule, and rejects expired ones', async () => {
    const rules = await loadRules();
    const waiver: CanonWaiver = {
      id: 'WVR-001',
      ruleId: 'terminology.upload-era',
      scope: { family: 'test-fam' },
      rationale: 'Owner-approved interactive deviation pending prose revision.',
      approvedBy: 'zekusmaximus',
      expires: '2027-01-01',
      recordedAt: '2026-07-16',
    };
    const findings = check(
      'Deep in the Upload Era, in the Upload Era still.',
      rules,
      singleVoiceL1,
      [waiver],
    );
    const termFindings = findings.filter((finding) => finding.ruleId === 'terminology.upload-era');
    expect(termFindings.length).toBeGreaterThan(0);
    expect(termFindings.every((finding) => finding.waived && finding.waiverId === 'WVR-001')).toBe(
      true,
    );

    const { expired } = validateCanonWaivers(
      {
        schemaVersion: '1.0.0',
        storyId: 'eternal-return',
        description: 'test',
        waivers: [{ ...waiver, expires: '2026-01-01' }],
      },
      '2026-07-16T00:00:00Z',
    );
    expect(expired.map((item) => item.id)).toEqual(['WVR-001']);

    expect(() =>
      validateCanonWaivers(
        {
          schemaVersion: '1.0.0',
          storyId: 'eternal-return',
          description: 'test',
          waivers: [{ ...waiver, rationale: '' }],
        },
        '2026-07-16T00:00:00Z',
      ),
    ).toThrow('rationale');
  });

  it('runs over the full shipped corpus and surfaces the registered contradiction patterns', async () => {
    const report = await runCanonValidation(repositoryRoot, '2026-07-16T00:00:00Z');

    expect(report.corpus.variations).toBe(1014);
    expect(report.corpus.families).toBe(19);
    // After the Phase 5.3 triage (owner decisions D1-D9) every error is fixed or waived:
    // strict mode gates CI on zero unwaived errors.
    expect(report.summary.errors).toBe(0);
    expect(report.summary.waived).toBeGreaterThan(0);
    expect(report.summary.byRule['terminology.upload-era']).toBeGreaterThan(0);
    expect(report.summary.byRule['chronology.absolute-date']).toBeGreaterThan(0);
    expect(report.summary.expiredWaivers).toBe(0);
  }, 60_000);
});
