import { useMemo, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import type { CharacterType } from '@/types';

import { selectSceneNodeGroups } from './sceneNodes';

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

/**
 * A visible, keyboard- and screen-reader-accessible companion to the 3D node map.
 * It lists exactly the nodes the canvas renders (via the shared {@link selectSceneNodeGroups}
 * selector) and activates the same node selection through the interaction adapter, so
 * the WebGL canvas is never the only way to navigate. It is plain DOM — no motion — and
 * therefore works under reduced motion and when WebGL is unavailable.
 */
export default function SceneNodeList(): ReactElement {
  const { nodes: adapterNodes, activate } = useMapInteractionAdapter('3d');

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
    <nav
      aria-label="Story nodes"
      data-testid="scene-node-list"
      className="pointer-events-auto absolute left-3 top-3 z-10 max-h-[calc(100%-1.5rem)] w-60 max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-md border border-slate-500/20 bg-[#0b1016]/85 p-3 text-slate-200 shadow-lg shadow-black/20 backdrop-blur-md"
    >
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-cyan-100/60">
        Node index
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        Select a fragment to open it. This list mirrors the three-dimensional map.
      </p>

      {groups.length === 0 && (
        <p role="status" className="mt-3 text-xs text-slate-500">
          No fragments are open yet.
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
                  ? 'Open'
                  : visited
                    ? 'Visited'
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
