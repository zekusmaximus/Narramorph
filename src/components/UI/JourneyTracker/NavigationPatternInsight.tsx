import type { ReactElement } from 'react';

import type { NavigationPatternModel } from './journeyTrackerPresentation';

interface NavigationPatternInsightProps {
  model: NavigationPatternModel;
}

export function NavigationPatternInsight({ model }: NavigationPatternInsightProps): ReactElement {
  return (
    <div className="mt-4 p-3 bg-gray-900/40 border border-cyan-500/20 rounded">
      <div className="text-xs text-cyan-400 mb-3 font-mono uppercase tracking-wider">
        Navigation Pattern
      </div>
      <div
        className={`inline-flex items-center space-x-2 px-3 py-2 rounded border font-mono text-sm ${model.colorClass}`}
      >
        <span className="text-lg">{model.glyph}</span>
        <span className="font-bold">{model.label}</span>
      </div>
      <p className="text-xs text-gray-400 mt-2">{model.description}</p>
      <div className="mt-3 space-y-2 text-[10px] font-mono">
        <div className="flex justify-between">
          <span className="text-gray-400">Breadth:</span>
          <span className="text-gray-300">{model.breadth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Depth:</span>
          <span className="text-gray-300">{model.depth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Revisits:</span>
          <span className="text-gray-300">{model.revisits}</span>
        </div>
      </div>
    </div>
  );
}
