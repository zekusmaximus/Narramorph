import type { SelectionRecord } from '@/types';

const DEFAULT_EXCERPT_LENGTH = 180;

/** Converts rendered Markdown into a compact, reader-safe ledger excerpt. */
export function createSelectionExcerpt(
  content: string,
  maximumLength = DEFAULT_EXCERPT_LENGTH,
): string {
  const plainText = content
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (maximumLength <= 0 || plainText.length <= maximumLength) {
    return maximumLength <= 0 ? '' : plainText;
  }

  const candidate = plainText.slice(0, Math.max(1, maximumLength - 1)).trimEnd();
  const lastSpace = candidate.lastIndexOf(' ');
  const clipped =
    lastSpace >= Math.floor(candidate.length * 0.6) ? candidate.slice(0, lastSpace) : candidate;
  return `${clipped.trimEnd()}…`;
}

/**
 * Appends a historical selection once. The visit sequence and fragment label
 * form the idempotency boundary used by React Strict Mode and remounts.
 */
export function appendSelectionRecord(
  records: SelectionRecord[],
  nextRecord: SelectionRecord,
): SelectionRecord[] {
  const alreadyRecorded = records.some(
    (record) =>
      record.sequence === nextRecord.sequence &&
      record.nodeId === nextRecord.nodeId &&
      (record.fragmentLabel ?? null) === (nextRecord.fragmentLabel ?? null),
  );

  return alreadyRecorded ? records : [...records, nextRecord];
}
