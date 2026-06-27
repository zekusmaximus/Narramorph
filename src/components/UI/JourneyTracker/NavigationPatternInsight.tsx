import type { ReactElement } from 'react';

import { useStoryStore } from '@/stores';

export function NavigationPatternInsight(): ReactElement {
  const tracking = useStoryStore((state) => state.progress.journeyTracking);
  const { navigationPattern, explorationMetrics, revisitFrequency } = tracking;
  const patternLabels = {
    linear: 'Linear Explorer',
    exploratory: 'Breadth-First Explorer',
    recursive: 'Depth-First Investigator',
    undetermined: 'Early Exploration',
  };
  const patternDescriptions = {
    linear: 'Sequential progression through narrative threads',
    exploratory: 'Wide sampling across multiple perspectives',
    recursive: 'Deep engagement with core nodes',
    undetermined: 'Establishing navigation patterns',
  };
  const patternColors = {
    linear: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    exploratory: 'text-green-400 border-green-500/30 bg-green-500/10',
    recursive: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    undetermined: 'text-gray-400 border-gray-500/30 bg-gray-500/10',
  };
  const patternGlyphs = {
    linear: '→',
    exploratory: '⊹',
    recursive: '⥁',
    undetermined: '◇',
  };

  return (
    <div className="mt-4 p-3 bg-gray-900/40 border border-cyan-500/20 rounded">
      <div className="text-xs text-cyan-400 mb-3 font-mono uppercase tracking-wider">
        Navigation Pattern
      </div>
      <div
        className={`inline-flex items-center space-x-2 px-3 py-2 rounded border font-mono text-sm ${patternColors[navigationPattern]}`}
      >
        <span className="text-lg">{patternGlyphs[navigationPattern]}</span>
        <span className="font-bold">{patternLabels[navigationPattern]}</span>
      </div>
      <p className="text-xs text-gray-400 mt-2">{patternDescriptions[navigationPattern]}</p>
      <div className="mt-3 space-y-2 text-[10px] font-mono">
        <div className="flex justify-between">
          <span className="text-gray-400">Breadth:</span>
          <span className="text-gray-300">{explorationMetrics.breadth.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Depth:</span>
          <span className="text-gray-300">{explorationMetrics.depth.toFixed(2)}× avg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Revisits:</span>
          <span className="text-gray-300">{revisitFrequency.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
