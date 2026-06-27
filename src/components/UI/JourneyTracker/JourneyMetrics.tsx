import type { ReactElement } from 'react';

import type { JourneyPattern, PathPhilosophy, UserProgress } from '@/types';

const journeyPatternLabels: Record<JourneyPattern, string> = {
  'started-stayed': 'Started & Stayed',
  'started-bounced': 'Started & Bounced',
  'shifted-dominant': 'Shifted Dominant',
  'began-lightly': 'Began Lightly',
  'met-later': 'Met Later',
  unknown: 'Unknown',
};

const philosophyLabels: Record<PathPhilosophy, string> = {
  accept: 'Acceptance',
  resist: 'Resistance',
  invest: 'Investigation',
  mixed: 'Mixed',
  unknown: 'Unknown',
};

interface JourneyMetricsProps {
  progress: UserProgress;
}

export function JourneyMetrics({ progress }: JourneyMetricsProps): ReactElement {
  const { characterVisitPercentages, currentJourneyPattern, dominantPhilosophy, l2Choices } =
    progress.journeyTracking;
  const characterRows = [
    {
      label: 'Arch',
      value: characterVisitPercentages.archaeologist,
      labelClass: 'text-blue-400',
      barClass: 'bg-blue-500',
    },
    {
      label: 'Algo',
      value: characterVisitPercentages.algorithm,
      labelClass: 'text-green-400',
      barClass: 'bg-green-500',
    },
    {
      label: 'Human',
      value: characterVisitPercentages.lastHuman,
      labelClass: 'text-red-400',
      barClass: 'bg-red-500',
    },
  ];

  return (
    <>
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-mono">JOURNEY PATTERN</div>
        <div className="text-sm text-cyan-300 font-mono">
          {journeyPatternLabels[currentJourneyPattern]}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-mono">PATH PHILOSOPHY</div>
        <div className="text-sm text-cyan-300 font-mono">
          {philosophyLabels[dominantPhilosophy]}
        </div>
        {(l2Choices.accept > 0 || l2Choices.resist > 0 || l2Choices.invest > 0) && (
          <div className="flex gap-2 text-xs text-gray-500 font-mono">
            <span>Accept: {l2Choices.accept}</span>
            <span>Resist: {l2Choices.resist}</span>
            <span>Invest: {l2Choices.invest}</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-mono">CHARACTER DISTRIBUTION</div>
        <div className="space-y-1">
          {characterRows.map(({ label, value, labelClass, barClass }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-20 text-xs font-mono ${labelClass}`}>{label}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`${barClass} h-full transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <div className="w-12 text-xs text-gray-400 font-mono text-right">
                {value.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-mono">TEMPORAL AWARENESS</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-500"
              style={{ width: `${progress.temporalAwarenessLevel}%` }}
            />
          </div>
          <div className="w-12 text-xs text-cyan-400 font-mono text-right">
            {progress.temporalAwarenessLevel.toFixed(0)}%
          </div>
        </div>
      </div>
      {progress.l3AssembliesViewed && progress.l3AssembliesViewed.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-purple-500/30">
          <div className="text-xs text-purple-400 font-mono">
            L3 ASSEMBLIES VIEWED: {progress.l3AssembliesViewed.length}
          </div>
          <div className="space-y-2">
            {progress.l3AssembliesViewed.map((view, index) => {
              const sectionsReadCount = Object.values(view.sectionsRead).filter(Boolean).length;
              return (
                <div
                  key={`${view.viewedAt}-${index}`}
                  className="text-xs text-gray-400 bg-purple-900/20 p-2 rounded"
                >
                  <div className="font-mono mb-1">
                    {view.journeyPattern} • {view.pathPhilosophy} • {view.synthesisPattern}
                  </div>
                  <div className="flex gap-1">
                    {(['arch', 'algo', 'hum', 'conv'] as const).map((section) => (
                      <span
                        key={section}
                        className={`w-4 h-4 rounded text-center leading-4 ${
                          view.sectionsRead[section]
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-600 text-gray-400'
                        }`}
                        title={`${section} ${view.sectionsRead[section] ? '✓' : '○'}`}
                      >
                        {view.sectionsRead[section] ? '✓' : '○'}
                      </span>
                    ))}
                    <span className="ml-2 text-gray-500">{sectionsReadCount}/4 sections read</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
