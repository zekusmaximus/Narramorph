/**
 * Journey Tracker Component - displays current journey pattern and path philosophy
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/stores/storyStore';
import type { JourneyPattern, PathPhilosophy } from '@/types';

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

/**
 * Connection Heatmap - Visual representation of cross-character exploration
 */
function ConnectionHeatmap() {
  const tracking = useStoryStore((state) => state.progress.journeyTracking);
  const { crossCharacterConnections } = tracking;
  const maxConnections = Math.max(
    ...Object.values(crossCharacterConnections),
    1, // Avoid division by zero
  );

  const connections = [
    {
      from: 'Archaeologist',
      to: 'Algorithm',
      count: crossCharacterConnections.arch_algo,
      color: 'from-blue-500 to-green-500',
    },
    {
      from: 'Archaeologist',
      to: 'Last Human',
      count: crossCharacterConnections.arch_hum,
      color: 'from-blue-500 to-red-500',
    },
    {
      from: 'Algorithm',
      to: 'Last Human',
      count: crossCharacterConnections.algo_hum,
      color: 'from-green-500 to-red-500',
    },
  ];

  return (
    <div className="mt-4 p-3 bg-gray-900/40 border border-cyan-500/20 rounded">
      <div className="text-xs text-cyan-400 mb-3 font-mono uppercase tracking-wider">
        Cross-Character Connections
      </div>

      <div className="space-y-2">
        {connections.map((conn) => {
          const intensity = (conn.count / maxConnections) * 100;

          return (
            <div key={`${conn.from}-${conn.to}`} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400">
                  {conn.from} ↔ {conn.to}
                </span>
                <span className="text-gray-300 font-bold">{conn.count}×</span>
              </div>

              {/* Connection strength bar */}
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${intensity}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full bg-gradient-to-r ${conn.color}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Synthesis indicator */}
      {Object.values(crossCharacterConnections).every((count) => count > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 pt-3 border-t border-cyan-500/20"
        >
          <div className="flex items-center space-x-2 text-cyan-400 text-xs">
            <span className="text-lg">✦</span>
            <span>Full consciousness network achieved</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Navigation Pattern Display
 */
function NavigationPatternInsight() {
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

  return (
    <div className="mt-4 p-3 bg-gray-900/40 border border-cyan-500/20 rounded">
      <div className="text-xs text-cyan-400 mb-3 font-mono uppercase tracking-wider">
        Navigation Pattern
      </div>

      {/* Pattern badge */}
      <div
        className={`
        inline-flex items-center space-x-2 px-3 py-2 rounded border
        font-mono text-sm
        ${patternColors[navigationPattern]}
      `}
      >
        <span className="text-lg">
          {navigationPattern === 'linear' && '→'}
          {navigationPattern === 'exploratory' && '⊹'}
          {navigationPattern === 'recursive' && '⥁'}
          {navigationPattern === 'undetermined' && '◇'}
        </span>
        <span className="font-bold">{patternLabels[navigationPattern]}</span>
      </div>

      <p className="text-xs text-gray-400 mt-2">{patternDescriptions[navigationPattern]}</p>

      {/* Metrics breakdown */}
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

/**
 * Next Unlock Preview
 * Shows the closest locked nodes and their unlock progress
 */
function NextUnlockPreview() {
  const unlockConfigs = useStoryStore((state) => state.unlockConfigs);
  const progress = useStoryStore((state) => state.progress);
  const getUnlockProgress = useStoryStore((state) => state.getUnlockProgress);
  const nodes = useStoryStore((state) => state.nodes);

  // Get all locked nodes with their progress
  const lockedNodesWithProgress = Array.from(unlockConfigs.values())
    .map((config) => {
      const unlockProg = getUnlockProgress(config.nodeId);
      const node = nodes.get(config.nodeId);
      return {
        config,
        progress: unlockProg,
        node,
      };
    })
    .filter((item) => item.progress?.locked && item.node) // Only locked nodes
    .sort((a, b) => (b.progress?.progress || 0) - (a.progress?.progress || 0)); // Sort by progress desc

  // Show top 3 closest to unlocking
  const topThree = lockedNodesWithProgress.slice(0, 3);

  if (topThree.length === 0) {
    return null; // No locked nodes to display
  }

  return (
    <div className="space-y-2">
      <h4 className="text-cyan-400 font-mono text-xs uppercase tracking-wider">
        Next Unlocks
      </h4>
      <div className="space-y-2">
        {topThree.map(({ config, progress, node }) => (
          <div
            key={config.nodeId}
            className="bg-black/40 border border-cyan-500/20 rounded p-2 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-white text-xs font-medium truncate">
                {node?.metadata?.chapterTitle || config.nodeId}
              </span>
              <span className="text-cyan-400 text-xs font-mono">
                {Math.round(progress?.progress || 0)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress?.progress || 0}%` }}
              />
            </div>
            {progress?.nextConditionHint && (
              <p className="text-gray-400 text-xs italic">
                {progress.nextConditionHint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function JourneyTracker() {
  const progress = useStoryStore((state) => state.progress);
  const tracking = progress.journeyTracking;
  const [isExpanded, setIsExpanded] = useState(false);

  const { characterVisitPercentages, currentJourneyPattern, dominantPhilosophy, l2Choices } =
    tracking;

  return (
    <div className="journey-tracker bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-cyan-500/10 transition-colors flex items-center justify-between"
      >
        <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-wider">
          Journey Tracking
        </h3>
        <svg
          className={`w-5 h-5 text-cyan-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
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

              {/* NEW: Connection heatmap */}
              <ConnectionHeatmap />

              {/* NEW: Navigation pattern insights */}
              <NavigationPatternInsight />

              {/* L3 Assembly Views */}
              {progress.l3AssembliesViewed && progress.l3AssembliesViewed.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-purple-500/30">
                  <div className="text-xs text-purple-400 font-mono">
                    L3 ASSEMBLIES VIEWED: {progress.l3AssembliesViewed.length}
                  </div>
                  <div className="space-y-2">
                    {progress.l3AssembliesViewed.map((view, index) => {
                      const sectionsReadCount = Object.values(view.sectionsRead).filter(
                        Boolean,
                      ).length;
                      return (
                        <div
                          key={index}
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

              {/* NEW: Next unlock preview */}
              <NextUnlockPreview />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
