/**
 * Device-local, session-scoped scroll memory for the reader (Phase 7.2).
 *
 * A passage's scroll offset is remembered by `nodeId` so an interrupted read
 * resumes where it left off — even across a reload. Restoration is applied only
 * when the reader is re-opened by restoring a URL (Back/Forward/reload/deep-link,
 * see `lastReaderOpenWasRestore`); a deliberate click/continuation starts at the
 * top. Keying by node (not variation) keeps resume robust even though a restored
 * read may re-select a different variation than was first shown.
 *
 * It uses `sessionStorage` so it survives an in-tab reload but not a new
 * session, and it is deliberately **off the save schema and out of exported
 * journeys** — where a reader paused scrolling is a UI convenience, not journey
 * content. Fails silently when storage is unavailable (private mode).
 */

const KEY_PREFIX = 'narramorph-scroll:';

export function saveScrollPosition(scrollKey: string, top: number): void {
  try {
    window.sessionStorage.setItem(KEY_PREFIX + scrollKey, String(Math.max(0, Math.round(top))));
  } catch {
    // Storage unavailable: resumption simply falls back to the top. Acceptable.
  }
}

export function loadScrollPosition(scrollKey: string): number | null {
  try {
    const raw = window.sessionStorage.getItem(KEY_PREFIX + scrollKey);
    if (raw === null) {
      return null;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}
