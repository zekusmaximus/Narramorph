import type { SelectionReason, SelectionReasonTemplateKey, SelectionRecord } from '@/types';

import { renderSelectionReason } from './selectionReason';

export type ExplanationAuditCode =
  | 'missing-explanation'
  | 'internal-id'
  | 'raw-condition-data'
  | 'contradiction'
  | 'spoiler-leak';

export interface ExplanationAuditFinding {
  code: ExplanationAuditCode;
  field: string;
  message: string;
}

export interface ExplanationAuditOptions {
  /** Story-specific future terms that reader-visible explanations must not reveal. */
  forbiddenTerms?: readonly string[];
}

const INTERNAL_ID =
  /(?:\b(?:arch|algo|hum|conv)-L[1-4](?:-[a-z0-9_-]+)?\b|\bfinal-(?:preserve|transform|release)\b|\bspv1_[a-z0-9_-]+\b|\b[a-z]+-L[1-4]-internal-[a-z0-9_-]+\b)/i;
const RAW_CONDITION_DATA =
  /(?:\{[^}]*:[^}]*\}|"(?:kind|actual|expected|passageIds?|conditions|comparison)"\s*:|\b(?:historyStartsWith|historyEndsWith|orderSeen|visitedImmediatelyAfter|withinSteps|visitedCountAcross|fallback-tier|variationId|nodeId)\b)/i;

const REQUIRED_PARAMETERS: Readonly<Record<SelectionReasonTemplateKey, readonly string[]>> = {
  'selection.first_visit': [],
  'selection.return_visit': ['visitCount'],
  'selection.started_with': ['perspective'],
  'selection.journey_pattern': ['journey'],
  'selection.philosophy': ['philosophy'],
  'selection.awareness': ['awareness'],
  'selection.combined': ['journey', 'philosophy'],
  'selection.l3_assembly': ['journey', 'philosophy'],
  'selection.ending_choice': ['ending'],
  'selection.fallback': [],
};

function inspectVisibleText(
  field: string,
  value: string,
  options: ExplanationAuditOptions,
): ExplanationAuditFinding[] {
  const findings: ExplanationAuditFinding[] = [];
  if (!value.trim()) {
    findings.push({
      code: 'missing-explanation',
      field,
      message: `${field} is empty.`,
    });
    return findings;
  }
  if (INTERNAL_ID.test(value)) {
    findings.push({
      code: 'internal-id',
      field,
      message: `${field} exposes an internal passage or variation identifier.`,
    });
  }
  if (RAW_CONDITION_DATA.test(value)) {
    findings.push({
      code: 'raw-condition-data',
      field,
      message: `${field} exposes raw condition or diagnostic data.`,
    });
  }
  const spoiler = options.forbiddenTerms?.find(
    (term) => term.trim() && value.toLocaleLowerCase().includes(term.toLocaleLowerCase()),
  );
  if (spoiler) {
    findings.push({
      code: 'spoiler-leak',
      field,
      message: `${field} exposes forbidden future content.`,
    });
  }
  return findings;
}

function contradiction(reason: SelectionReason): string | null {
  const template = reason.templateKey;
  const visitCount = reason.parameters.visitCount;

  if (template === 'selection.ending_choice') {
    return reason.selectionKind === 'ending' && reason.outcome === 'fixed'
      ? null
      : 'An ending explanation must describe a fixed ending selection.';
  }
  if (template === 'selection.l3_assembly') {
    return reason.selectionKind === 'l3-section' && reason.outcome !== 'fallback'
      ? null
      : 'An L3 explanation must describe a non-fallback L3 section.';
  }
  if (template === 'selection.fallback') {
    return reason.outcome === 'fallback'
      ? null
      : 'The fallback template must describe a fallback outcome.';
  }
  if (reason.selectionKind !== 'passage-variation') {
    return 'A passage template must describe a passage variation.';
  }
  if (template === 'selection.first_visit' && typeof visitCount === 'number' && visitCount > 1) {
    return 'A first-visit explanation cannot describe a later visit.';
  }
  if (template === 'selection.return_visit' && (typeof visitCount !== 'number' || visitCount < 2)) {
    return 'A return-visit explanation requires visit two or later.';
  }
  return null;
}

/** Audits one reason's closed rendering; machine evidence remains available but invisible. */
export function auditSelectionReason(
  reason: SelectionReason,
  options: ExplanationAuditOptions = {},
): ExplanationAuditFinding[] {
  const findings: ExplanationAuditFinding[] = [];
  const missingParameter = REQUIRED_PARAMETERS[reason.templateKey].find((key) => {
    const value = reason.parameters[key];
    return value === undefined || value === null || String(value).trim() === '';
  });
  if (missingParameter) {
    findings.push({
      code: 'missing-explanation',
      field: `reason.parameters.${missingParameter}`,
      message: `Required reader-facing parameter ${missingParameter} is missing.`,
    });
  }

  const rendered = renderSelectionReason(reason);
  findings.push(...inspectVisibleText('reason.rendered', rendered, options));

  const conflict = contradiction(reason);
  if (conflict) {
    findings.push({ code: 'contradiction', field: 'reason', message: conflict });
  }
  return findings;
}

/** Audits the immutable reader-visible snapshot stored in the adaptation ledger. */
export function auditSelectionRecord(
  record: SelectionRecord,
  options: ExplanationAuditOptions = {},
): ExplanationAuditFinding[] {
  return [
    ...auditSelectionReason(record.reason, options),
    ...inspectVisibleText('record.passageTitle', record.passageTitle, options),
    ...inspectVisibleText('record.excerpt', record.excerpt, options),
    ...inspectVisibleText('record.explanation', record.explanation, options),
  ];
}
