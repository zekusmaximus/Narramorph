/**
 * Journey Tracker Component - displays current journey pattern and path philosophy
 */

import { useState } from 'react';
import { useStoryStore } from '@/stores/storyStore';
import type { JourneyPattern, PathPhilosophy } from '@/types';

const journeyPatternLabels: Record<JourneyPattern, string> = {
  'started-stayed': 'Started & Stayed',
  'started-bounced': 'Started & Bounced',
  'shifted-dominant': 'Shifted Dominant',
  'began-lightly': 'Began Lightly',
  'met-later': 'Met Later',
  'unknown': 'Unknown',
};

const philosophyLabels: Record<PathPhilosophy, string> = {
  'accept': 'Acceptance',
  'resist': 'Resistance',
  'invest': 'Investigation',
  'mixed': 'Mixed',
  'unknown': 'Unknown',
};

export function JourneyTracker() {
  const progress = useStoryStore((state) => state.progress);
  const tracking = progress.journeyTracking;
  const [isExpanded, setIsExpanded] = useState(false);

  if (!tracking) {
    return null;
  }

  const { characterVisitPercentages, currentJourneyPattern, dominantPhilosophy, l2Choices } = tracking;

  return (
    <div className="journey-tracker bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-cyan-500/10 transition-colors flex items-center justify-between"
      >
        <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-wider">Journey Tracking</h3>
        <svg
          className={`w-5 h-5 text-cyan-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">

      {/* Journey Pattern */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-mono">JOURNEY PATTERN</div>
        <div className="text-sm text-cyan-300 font-mono">
          {journeyPatternLabels[currentJourneyPattern]}
        </div>
      </div>

      {/* Path Philosophy */}
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

      {/* Character Distribution */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-mono">CHARACTER DISTRIBUTION</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs text-blue-400 font-mono">Arch</div>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${characterVisitPercentages.archaeologist}%` }}
              />
            </div>
            <div className="w-12 text-xs text-gray-400 font-mono text-right">
              {characterVisitPercentages.archaeologist.toFixed(0)}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs text-green-400 font-mono">Algo</div>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-500"
                style={{ width: `${characterVisitPercentages.algorithm}%` }}
              />
            </div>
            <div className="w-12 text-xs text-gray-400 font-mono text-right">
              {characterVisitPercentages.algorithm.toFixed(0)}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs text-red-400 font-mono">Human</div>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${characterVisitPercentages.lastHuman}%` }}
              />
            </div>
            <div className="w-12 text-xs text-gray-400 font-mono text-right">
              {characterVisitPercentages.lastHuman.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Temporal Awareness */}
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

      {/* L3 Assembly Views */}
      {progress.l3AssembliesViewed && progress.l3AssembliesViewed.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-purple-500/30">
          <div className="text-xs text-purple-400 font-mono">
            L3 ASSEMBLIES VIEWED: {progress.l3AssembliesViewed.length}
          </div>
          <div className="space-y-2">
            {progress.l3AssembliesViewed.map((view, index) => {
              const sectionsReadCount = Object.values(view.sectionsRead).filter(Boolean).length;
              return (
                <div key={index} className="text-xs text-gray-400 bg-purple-900/20 p-2 rounded">
                  <div className="font-mono mb-1">
                    {view.journeyPattern} • {view.pathPhilosophy} • {view.synthesisPattern}
                  </div>
                  <div className="flex gap-1">
                    {(['arch', 'algo', 'hum', 'conv'] as const).map(section => (
                      <span
                        key={section}
                        className={`w-4 h-4 rounded text-center leading-4 ${
                          view.sectionsRead[section] ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-400'
                        }`}
                        title={`${section} ${view.sectionsRead[section] ? '✓' : '○'}`}
                      >
                        {view.sectionsRead[section] ? '✓' : '○'}
                      </span>
                    ))}
                    <span className="ml-2 text-gray-500">
                      {sectionsReadCount}/4 sections read
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
