import { useEffect, useState } from 'react';

import { useStoryStore } from '@/stores';
import { isL3Node } from '@/utils/nodeUtils';

const READER_HASH_RE = /^#\/passage\/(.+)$/;

/** The passage id encoded in a hash, or null when the hash is not a reader hash. */
export function parseReaderHash(hash: string): string | null {
  const match = READER_HASH_RE.exec(hash);
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match[1] ?? '');
  } catch {
    return null;
  }
}

function readerHash(nodeId: string): string {
  return `#/passage/${encodeURIComponent(nodeId)}`;
}

function clearReaderHash(): void {
  // Drop the reader hash without adding a history entry, keeping any ?story= query.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

/** A passage is reachable by the flat reader (not the L3 convergence surface). */
function isReaderReachable(nodeId: string): boolean {
  const { canVisitNode } = useStoryStore.getState();
  return canVisitNode(nodeId) && !isL3Node(nodeId);
}

/**
 * Keeps the open passage reflected in the URL hash (`#/passage/:nodeId`) so the
 * reader is **not a modal trap** (Phase 7.2): browser Back closes it and a
 * passage is bookmarkable/deep-linkable. This is a thin History-API sync — no
 * router — and it preserves `useDialogFocus` containment/restoration and exact
 * visit semantics: Back = Close = `finalizeActiveVisit`, and opening from the
 * hash records the same visit a click would. Continuation replaces (not pushes)
 * so Back returns to the map, never re-opening/re-visiting a prior passage.
 */
export function useReaderRoute(): void {
  const storyViewOpen = useStoryStore((state) => state.storyViewOpen);
  const selectedNode = useStoryStore((state) => state.selectedNode);
  const nodesLoaded = useStoryStore((state) => state.nodes.size > 0);
  const [hydrated, setHydrated] = useState(false);

  // Deep-link on first load, once the story is available. Runs before the
  // state→URL sync becomes active (guarded by `hydrated`) so a bookmarked
  // passage is not undone at mount.
  useEffect(() => {
    if (hydrated || !nodesLoaded || typeof window === 'undefined') {
      return;
    }
    const target = parseReaderHash(window.location.hash);
    if (target && isReaderReachable(target)) {
      // A base map entry first, so Back from a bookmarked passage returns to the
      // map instead of leaving the site. Restore (not open) so resuming an
      // interrupted read does not record a spurious extra visit.
      clearReaderHash();
      window.history.pushState(null, '', readerHash(target));
      useStoryStore.getState().restoreStoryView(target);
    } else if (target !== null) {
      // Unknown / locked / L3 deep link → land on the map.
      clearReaderHash();
    }
    setHydrated(true);
  }, [nodesLoaded, hydrated]);

  // State → URL: reflect the reader state into the hash.
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }
    const currentTarget = parseReaderHash(window.location.hash);
    const desired = storyViewOpen && selectedNode ? selectedNode : null;
    if (desired === currentTarget) {
      return;
    }
    if (desired) {
      if (currentTarget === null) {
        // Opened from the map: a new history entry so Back closes the reader.
        window.history.pushState(null, '', readerHash(desired));
      } else {
        // Continuation to another passage: replace, so Back still returns to the map.
        window.history.replaceState(null, '', readerHash(desired));
      }
    } else {
      // Closed via Close/Escape: drop the hash without leaving the site.
      clearReaderHash();
    }
  }, [storyViewOpen, selectedNode, hydrated]);

  // URL → state: Back/Forward (and any hash change) drive open/close.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const onPopState = (): void => {
      const { storyViewOpen: open, selectedNode: node } = useStoryStore.getState();
      const target = parseReaderHash(window.location.hash);
      if (target && isReaderReachable(target)) {
        if (!(open && node === target)) {
          // Browser-history navigation restores the reader; it never records a
          // new visit (only a deliberate click/continuation does).
          useStoryStore.getState().restoreStoryView(target);
        }
      } else {
        if (open) {
          useStoryStore.getState().closeStoryView();
        }
        if (target !== null) {
          clearReaderHash();
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
}
