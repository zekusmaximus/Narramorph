import type { ReactElement } from 'react';

import type { NextUnlockPreviewItem } from './journeyTrackerPresentation';

interface NextUnlockPreviewProps {
  items: NextUnlockPreviewItem[];
}

export function NextUnlockPreview({ items }: NextUnlockPreviewProps): ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-cyan-400 font-mono text-xs uppercase tracking-wider">Next Unlocks</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.nodeId}
            className="bg-black/40 border border-cyan-500/20 rounded p-2 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-white text-xs font-medium truncate">{item.title}</span>
              <span className="text-cyan-400 text-xs font-mono">{item.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${item.progressWidthPercent}%` }}
              />
            </div>
            {item.nextConditionHint && (
              <p className="text-gray-400 text-xs italic">{item.nextConditionHint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
