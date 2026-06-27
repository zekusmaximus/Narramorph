import type { ReactElement } from 'react';

import { useStoryStore } from '@/stores';

export function NextUnlockPreview(): ReactElement | null {
  const unlockConfigs = useStoryStore((state) => state.unlockConfigs);
  const getUnlockProgress = useStoryStore((state) => state.getUnlockProgress);
  const nodes = useStoryStore((state) => state.nodes);
  const topThree = Array.from(unlockConfigs.values())
    .map((config) => ({
      config,
      progress: getUnlockProgress(config.nodeId),
      node: nodes.get(config.nodeId),
    }))
    .filter((item) => item.progress?.locked && item.node)
    .sort((left, right) => (right.progress?.progress ?? 0) - (left.progress?.progress ?? 0))
    .slice(0, 3);

  if (topThree.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-cyan-400 font-mono text-xs uppercase tracking-wider">Next Unlocks</h4>
      <div className="space-y-2">
        {topThree.map(({ config, progress, node }) => (
          <div
            key={config.nodeId}
            className="bg-black/40 border border-cyan-500/20 rounded p-2 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-white text-xs font-medium truncate">
                {node?.metadata.chapterTitle || config.nodeId}
              </span>
              <span className="text-cyan-400 text-xs font-mono">
                {Math.round(progress?.progress ?? 0)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress?.progress ?? 0}%` }}
              />
            </div>
            {progress?.nextConditionHint && (
              <p className="text-gray-400 text-xs italic">{progress.nextConditionHint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
