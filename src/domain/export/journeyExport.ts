import type { SelectionRecord, StoryPackageIdentity, VisitEvent } from '@/types';

import { renderSelectionReason } from '../variation/selectionReason';

/**
 * Accessible journey export (Phase 4.4).
 *
 * Export reads the immutable `visitEvents` log (ADR 0004) and renders the exact resolved prose the
 * reader saw, in experienced order. It never re-runs selection and never reads current story
 * content, so a saved journey exports byte-identically even after later content updates. Output is
 * deterministic: the export timestamp is an explicit input, never `Date.now()`.
 *
 * Reader-facing output carries no internal identifiers (node/variation/beat/bridge IDs, hashes)
 * unless the caller opts into a diagnostic export. Passage headings can be enriched with the
 * reader-safe titles recorded on the aligned selection ledger.
 */

export interface JourneyExportMetadata {
  /** Reader-facing story title for the title page. */
  storyTitle: string;
  /** Reader-facing author credit. */
  author?: string;
  /** Exact story package that produced the journey. */
  storyPackage: StoryPackageIdentity;
  /** Application version that wrote the journey. */
  appVersion: string;
  /** Save-schema version of the journey. */
  saveVersion: string;
  /** ISO-8601 export timestamp, supplied by the caller for deterministic output. */
  exportedAt: string;
}

export interface JourneyExportOptions {
  /** Include the reader-safe adaptation note under each passage (default true). */
  includeAdaptationNotes?: boolean;
  /**
   * Include internal identifiers (node/variation/beat/bridge IDs and the resolved-text hash).
   * Off by default so a normal export contains no internal IDs.
   */
  diagnostic?: boolean;
  /**
   * Reader-safe passage titles keyed by `encounterKey`, from the aligned selection ledger. When a
   * title is present it enriches the passage heading; otherwise an ordinal label is used.
   */
  titles?: ReadonlyMap<string, string>;
}

/**
 * Concise content-license notice embedded in every export. Condensed from CONTENT_LICENSE.md, which
 * names reader-generated journey exports as reserved content.
 */
export const JOURNEY_EXPORT_LICENSE_NOTICE =
  'Narramorph narrative content © 2026 zekusmaximus. All rights reserved. This journey export may be ' +
  'viewed but not published, redistributed, sublicensed, sold, or used to train a model. See ' +
  'CONTENT_LICENSE.md.';

/** Stable key identifying one experienced encounter; matches the visit-event/ledger idempotency key. */
export function encounterKey(event: Pick<VisitEvent, 'sequence' | 'nodeId' | 'selection'>): string {
  return `${event.sequence}|${event.nodeId}|${event.selection.fragmentLabel ?? ''}`;
}

/** Builds a reader-safe title lookup from the selection ledger, keyed by `encounterKey`. */
export function buildJourneyTitleMap(records: readonly SelectionRecord[]): Map<string, string> {
  const titles = new Map<string, string>();
  for (const record of records) {
    const key = `${record.sequence}|${record.nodeId}|${record.fragmentLabel ?? ''}`;
    titles.set(key, record.passageTitle);
  }
  return titles;
}

/** Returns the experienced-order events (stable sort by sequence; array order breaks ties). */
export function orderedVisitEvents(events: readonly VisitEvent[]): VisitEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => a.event.sequence - b.event.sequence || a.index - b.index)
    .map((entry) => entry.event);
}

/** Reader-safe adaptation note for one event, or null when it carried no adaptive reason. */
export function adaptationNote(event: VisitEvent): string | null {
  return event.reason ? renderSelectionReason(event.reason) : null;
}

/** Endings reached in the journey, in order, from recorded reader choices. */
export function endingsReached(events: readonly VisitEvent[]): string[] {
  const endings: string[] = [];
  for (const event of orderedVisitEvents(events)) {
    if (event.readerChoice?.kind === 'ending' && !endings.includes(event.readerChoice.value)) {
      endings.push(event.readerChoice.value);
    }
  }
  return endings;
}

/** Mirrors MarkdownContent's leading-frontmatter strip so exports match what the reader saw. */
function stripDisplayFrontmatter(content: string): string {
  return content.replace(/^---[\s\S]*?\n---\n+/, '');
}

function passageHeading(
  event: VisitEvent,
  position: number,
  titles?: ReadonlyMap<string, string>,
): string {
  const title = titles?.get(encounterKey(event));
  return title ? `${position + 1}. ${title}` : `Passage ${position + 1}`;
}

function shortHash(hash: string): string {
  return hash.slice(0, 12);
}

/**
 * Filesystem-safe, deterministic export filename, e.g. `eternal-return-journey-2026-07-16.md`.
 * `exportedAt` is an ISO timestamp; only its date is used so the name is stable within a day.
 */
export function journeyExportFilename(
  storyTitle: string,
  exportedAt: string,
  extension: 'md' | 'html' = 'md',
): string {
  const slug =
    storyTitle
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'journey';
  const date = exportedAt.slice(0, 10).replace(/[^0-9-]/g, '') || 'undated';
  return `${slug}-journey-${date}.${extension}`;
}

function metadataLines(
  events: readonly VisitEvent[],
  metadata: JourneyExportMetadata,
  diagnostic: boolean,
): string[] {
  const ordered = orderedVisitEvents(events);
  const endings = endingsReached(events);
  const lines = [`Passages experienced: ${ordered.length}`];
  if (metadata.author) {
    lines.push(`Author: ${metadata.author}`);
  }
  if (endings.length > 0) {
    lines.push(`Ending${endings.length > 1 ? 's' : ''} reached: ${endings.join('; ')}`);
  }
  lines.push(
    `Story package: ${metadata.storyPackage.storyId}@${metadata.storyPackage.storyVersion}`,
  );
  lines.push(`Content schema: ${metadata.storyPackage.schemaVersion}`);
  lines.push(`Narramorph app version: ${metadata.appVersion}`);
  lines.push(`Save format: ${metadata.saveVersion}`);
  lines.push(`Exported: ${metadata.exportedAt}`);
  if (diagnostic) {
    lines.push(`Content hash: ${metadata.storyPackage.contentHash}`);
  }
  return lines;
}

const EMPTY_JOURNEY_NOTICE =
  'This saved journey has no recorded passages with exact snapshots, so its prose cannot be ' +
  'reproduced here. (Journeys saved before this version have no snapshots for their earlier visits.)';

const PARTIAL_JOURNEY_NOTICE =
  'Some earlier passages were read before this version began recording exact snapshots, or aged out ' +
  'of the local history limit, and cannot be reproduced. They are not included below, and passages ' +
  'are renumbered from the first one that was captured.';

/**
 * True when the first captured event is not the reader's first encounter — i.e. earlier passages
 * exist in the journey but have no snapshot (a pre-1.3.0 migration, or oldest events trimmed by the
 * log-size limit). `sequence` is the reading-path length at capture time, so a first event with a
 * non-zero sequence means earlier encounters were not captured.
 */
function hasEarlierUncapturedPassages(ordered: readonly VisitEvent[]): boolean {
  const first = ordered[0];
  return first !== undefined && first.sequence > 0;
}

/**
 * Builds the deterministic Markdown export of a journey: a title page, the experienced passages in
 * order with optional adaptation notes, and the content-license notice.
 */
export function buildJourneyMarkdown(
  events: readonly VisitEvent[],
  metadata: JourneyExportMetadata,
  options: JourneyExportOptions = {},
): string {
  const includeNotes = options.includeAdaptationNotes ?? true;
  const diagnostic = options.diagnostic ?? false;
  const ordered = orderedVisitEvents(events);

  const lines: string[] = [];
  lines.push(`# ${metadata.storyTitle} — your journey`);
  lines.push('');
  for (const item of metadataLines(events, metadata, diagnostic)) {
    lines.push(`- ${item}`);
  }
  lines.push('');

  if (ordered.length === 0) {
    lines.push(`_${EMPTY_JOURNEY_NOTICE}_`);
    lines.push('');
  } else if (hasEarlierUncapturedPassages(ordered)) {
    lines.push(`_${PARTIAL_JOURNEY_NOTICE}_`);
    lines.push('');
  }

  ordered.forEach((event, position) => {
    lines.push('---');
    lines.push('');
    lines.push(`## ${passageHeading(event, position, options.titles)}`);
    lines.push('');
    if (includeNotes) {
      const note = adaptationNote(event);
      if (note) {
        lines.push(`> ${note}`);
        lines.push('');
      }
    }
    if (diagnostic) {
      const beats = event.selection.beatIds.length
        ? ` beats=${event.selection.beatIds.join(',')}`
        : '';
      const bridge = event.bridgeId ? ` bridge=${event.bridgeId}` : '';
      lines.push(
        `<!-- node=${event.nodeId} variation=${event.selection.variationId ?? 'none'}${beats}${bridge} ` +
          `visit=${event.visitNumber} hash=${shortHash(event.resolvedText.hash)} -->`,
      );
      lines.push('');
    }
    lines.push(stripDisplayFrontmatter(event.resolvedText.content));
    lines.push('');
  });

  lines.push('---');
  lines.push('');
  lines.push(JOURNEY_EXPORT_LICENSE_NOTICE);
  lines.push('');

  return lines.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts one passage's resolved Markdown to HTML, mirroring MarkdownContent exactly: strip
 * leading frontmatter, split paragraphs on blank lines (single-newline fallback), apply the same
 * bold-then-italic passes (italic only on non-bold segments), and HTML-escape every emitted text
 * segment. It intentionally supports only paragraphs, `**bold**`/`__bold__`, and `*italic*`/
 * `_italic_`, so a print export renders identically to what the reader saw on screen.
 */
export function markdownToHtml(content: string): string {
  const stripped = stripDisplayFrontmatter(content);
  let paragraphs = stripped.split('\n\n').filter((paragraph) => paragraph.trim());
  if (paragraphs.length === 1) {
    paragraphs = stripped.split('\n').filter((paragraph) => paragraph.trim());
  }
  return paragraphs.map((paragraph) => `<p>${inlineMarkupToHtml(paragraph)}</p>`).join('\n');
}

function inlineMarkupToHtml(paragraph: string): string {
  type Part = { bold: false; value: string } | { bold: true; value: string };
  const parts: Part[] = [];
  const boldPattern = /(\*\*|__)(.*?)\1/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = boldPattern.exec(paragraph)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ bold: false, value: paragraph.slice(lastIndex, match.index) });
    }
    parts.push({ bold: true, value: match[2] ?? '' });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < paragraph.length) {
    parts.push({ bold: false, value: paragraph.slice(lastIndex) });
  }

  const out: string[] = [];
  for (const part of parts) {
    if (part.bold) {
      out.push(`<strong>${escapeHtml(part.value)}</strong>`);
      continue;
    }
    const italicPattern = /(\*|_)(.*?)\1/g;
    let stringLastIndex = 0;
    for (const italicMatch of part.value.matchAll(italicPattern)) {
      const matchIndex = italicMatch.index ?? 0;
      if (matchIndex > stringLastIndex) {
        out.push(escapeHtml(part.value.slice(stringLastIndex, matchIndex)));
      }
      out.push(`<em>${escapeHtml(italicMatch[2] ?? '')}</em>`);
      stringLastIndex = matchIndex + italicMatch[0].length;
    }
    if (stringLastIndex < part.value.length) {
      out.push(escapeHtml(part.value.slice(stringLastIndex)));
    }
  }
  return out.join('');
}

const PRINT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ffffff; color: #1a1a1a;
    font-family: Georgia, 'Iowan Old Style', 'Times New Roman', serif; line-height: 1.85; }
  main { max-width: 44rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
  h1 { font-size: 1.9rem; line-height: 1.25; margin: 0 0 1rem; }
  h2 { font-size: 1.2rem; margin: 2.5rem 0 0.75rem; }
  .journey-meta { list-style: none; padding: 0; margin: 0 0 1.5rem; font-size: 0.9rem; color: #444; }
  .journey-meta li { margin: 0.15rem 0; }
  .adaptation-note { border-left: 3px solid #8a8a8a; margin: 0 0 1rem; padding: 0.35rem 0 0.35rem 1rem;
    font-style: italic; color: #444; }
  .passage p { margin: 0 0 1rem; }
  hr { border: 0; border-top: 1px solid #d8d8d8; margin: 2.5rem 0 0; }
  .journey-license { margin-top: 2.5rem; font-size: 0.8rem; color: #555; }
  .empty-journey { font-style: italic; color: #555; }
  @media print {
    body { background: #ffffff; color: #000000; }
    main { max-width: none; padding: 0 0 1cm; }
    .passage { break-inside: avoid-page; }
    h2 { break-after: avoid-page; }
  }
`;

/**
 * Builds a self-contained, print-friendly HTML document for a journey. It is fully offline (inline
 * styles, no external references, no scripts), accessible (document language, semantic headings,
 * high-contrast print colors), and contains no internal IDs unless a diagnostic export is
 * requested. Passage prose is escaped and rendered by `markdownToHtml`, matching the on-screen view.
 */
export function buildJourneyPrintHtml(
  events: readonly VisitEvent[],
  metadata: JourneyExportMetadata,
  options: JourneyExportOptions = {},
): string {
  const includeNotes = options.includeAdaptationNotes ?? true;
  const diagnostic = options.diagnostic ?? false;
  const ordered = orderedVisitEvents(events);
  const title = `${metadata.storyTitle} — your journey`;

  const body: string[] = [];
  body.push(`<h1>${escapeHtml(title)}</h1>`);
  body.push('<ul class="journey-meta">');
  for (const item of metadataLines(events, metadata, diagnostic)) {
    body.push(`<li>${escapeHtml(item)}</li>`);
  }
  body.push('</ul>');

  if (ordered.length === 0) {
    body.push(`<p class="empty-journey">${escapeHtml(EMPTY_JOURNEY_NOTICE)}</p>`);
  } else if (hasEarlierUncapturedPassages(ordered)) {
    body.push(`<p class="empty-journey">${escapeHtml(PARTIAL_JOURNEY_NOTICE)}</p>`);
  }

  ordered.forEach((event, position) => {
    const heading = passageHeading(event, position, options.titles);
    body.push('<hr />');
    // An <article> per passage (not a labelled <section>) keeps each passage a heading-navigable
    // unit without proliferating region landmarks across a long journey.
    body.push('<article class="passage">');
    body.push(`<h2>${escapeHtml(heading)}</h2>`);
    if (includeNotes) {
      const note = adaptationNote(event);
      if (note) {
        body.push(`<p class="adaptation-note">${escapeHtml(note)}</p>`);
      }
    }
    if (diagnostic) {
      const beats = event.selection.beatIds.length
        ? ` beats=${event.selection.beatIds.join(',')}`
        : '';
      const bridge = event.bridgeId ? ` bridge=${event.bridgeId}` : '';
      body.push(
        `<!-- node=${escapeHtml(event.nodeId)} variation=${escapeHtml(
          event.selection.variationId ?? 'none',
        )}${escapeHtml(beats)}${escapeHtml(bridge)} visit=${event.visitNumber} hash=${escapeHtml(
          shortHash(event.resolvedText.hash),
        )} -->`,
      );
    }
    body.push(markdownToHtml(event.resolvedText.content));
    body.push('</article>');
  });

  body.push('<hr />');
  body.push(`<p class="journey-license">${escapeHtml(JOURNEY_EXPORT_LICENSE_NOTICE)}</p>`);

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${PRINT_STYLES}</style>`,
    '</head>',
    '<body>',
    '<main>',
    body.join('\n'),
    '</main>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
