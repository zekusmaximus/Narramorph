import { useMemo, type ReactElement } from 'react';

import { selectSceneNodeGroups } from '@/components/3d/sceneNodes';
import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import type { CharacterType } from '@/types';

import type { MapMode } from './mapAdapters';

const CHARACTER_LABEL: Record<CharacterType, string> = {
  archaeologist: 'The Archaeologist',
  algorithm: 'The Algorithm',
  'last-human': 'The Last Human',
  'multi-perspective': 'The Convergence',
};

function nodeTitle(node: {
  metadata?: { chapterTitle?: string };
  title?: string;
  id: string;
}): string {
  return node.metadata?.chapterTitle ?? node.title ?? node.id;
}

interface PassageListNavProps {
  /** Which map surface this list mirrors and activates (2D or 3D). */
  mode: MapMode;
  /** Classes for the outer <nav> (positioning is the caller's responsibility). */
  className?: string;
  /** One-line description of what the list mirrors. */
  description?: string;
}

/**
 * A visible, keyboard- and screen-reader-accessible linear passage list that mirrors a map
 * surface and activates the same node selection through the shared interaction adapter — so a
 * reader can navigate the story by a non-spatial list rather than the graph, and (in 3D) without
 * WebGL. It is plain DOM with no motion, so it works under reduced motion. Shared by the 3D
 * `SceneNodeList` and the collapsible 2D companion (Phase 7.5).
 */
export function PassageListNav({
  mode,
  className,
  description = 'Select a passage to open it. This list mirrors the story map.',
}: PassageListNavProps): ReactElement {
  const { nodes: adapterNodes, activate } = useMapInteractionAdapter(mode);

  const stateById = useMemo(() => {
    const map = new Map<string, (typeof adapterNodes)[number]>();
    for (const entry of adapterNodes) {
      map.set(entry.node.id, entry);
    }
    return map;
  }, [adapterNodes]);

  const groups = useMemo(
    () => selectSceneNodeGroups(adapterNodes.map((entry) => entry.node)),
    [adapterNodes],
  );

  return (
    <nav aria-label="Passage list" data-testid="passage-list" className={className}>
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-cyan-100/60">
        Passages
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>

      {groups.length === 0 && (
        <p role="status" className="mt-3 text-xs text-slate-500">
          No passages are available yet.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.type} className="mt-3">
          <h3 className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-300">
            {CHARACTER_LABEL[group.type]}
          </h3>
          <ul className="space-y-1">
            {group.nodes.map((node) => {
              const entry = stateById.get(node.id);
              const available = entry?.available ?? false;
              const selected = entry?.selected ?? false;
              const visited = entry?.visited ?? false;
              const status = !available
                ? 'Locked'
                : selected
                  ? 'Reading'
                  : visited
                    ? 'Opened'
                    : 'Available';
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    disabled={!available}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => activate(node.id)}
                    className={`flex w-full min-w-0 items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 ${
                      selected
                        ? 'bg-cyan-200/15 text-cyan-50'
                        : available
                          ? 'text-slate-200 hover:bg-white/10'
                          : 'cursor-not-allowed text-slate-500'
                    }`}
                  >
                    <span className="shrink-0 font-mono text-[0.6rem] text-slate-500">
                      L{node.layer}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{nodeTitle(node)}</span>
                    <span className="shrink-0 text-[0.6rem] uppercase tracking-wide text-slate-500">
                      {status}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
