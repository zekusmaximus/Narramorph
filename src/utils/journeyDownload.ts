/**
 * Browser-only helpers for delivering a journey export to the reader. Kept separate from the pure
 * export builders so those stay deterministic and unit-testable; these perform the DOM side effects
 * and are always invoked from a user gesture (a button click).
 */

/** Triggers a client-side download of a text file. No data leaves the device. */
export function downloadTextFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Opens a self-contained HTML document in a new tab as a print-friendly view. Falls back to a
 * download when the browser blocks the new tab, so the reader always receives the document.
 */
export function openHtmlDocument(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
  // Revoke on the next tick so the opened tab has time to load the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
