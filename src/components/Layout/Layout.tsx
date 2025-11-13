import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/stores/storyStore';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component providing the application shell
 */
export default function Layout({ children }: LayoutProps) {
  const [showProgress, setShowProgress] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Get stats from store
  const progress = useStoryStore((state) => state.progress);
  const nodes = useStoryStore((state) => state.nodes);
  const stats = useStoryStore((state) => state.getReadingStats());

  const visitedCount = Object.keys(progress.visitedNodes).length;
  const totalNodes = nodes.size;
  const progressPercent = totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-story-background">
      {/* Header */}
      <header className="bg-[#0a0e12] border-b border-cyan-500/20 shadow-lg shadow-cyan-500/10 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xl font-bold text-cyan-400 tracking-wide font-mono"
              >
                <span className="text-cyan-400">� 2025 NARRAMORPH FICTION</span>
              </motion.h1>
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                Interactive Narrative Platform
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Map button - disabled (current view) */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="px-3 py-1.5 rounded bg-gray-900/50 border border-gray-700/50 text-gray-500 text-sm font-mono uppercase tracking-wider cursor-not-allowed flex items-center space-x-2"
                disabled
                title="Currently viewing map"
              >
                <span>🗺️</span>
                <span>Map</span>
              </motion.button>

              {/* Progress button */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="px-3 py-1.5 rounded bg-gray-900/50 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider flex items-center space-x-2 relative"
                onClick={() => setShowProgress(!showProgress)}
                title="View reading progress"
              >
                <span>📊</span>
                <span>Progress</span>
                {visitedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/50">
                    {visitedCount}
                  </span>
                )}
              </motion.button>

              {/* Settings button */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="px-3 py-1.5 rounded bg-gray-900/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800/50 hover:border-gray-600/50 hover:text-gray-300 transition-all text-sm font-mono uppercase tracking-wider flex items-center space-x-2"
                onClick={() => setShowSettings(!showSettings)}
                title="Preferences and settings"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Modal */}
      <AnimatePresence>
        {showProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProgress(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0e12] rounded-lg shadow-2xl shadow-cyan-500/20 border border-cyan-500/30 max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-cyan-400 font-mono uppercase tracking-wider">
                  Reading Progress
                </h2>
                <button
                  onClick={() => setShowProgress(false)}
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-xl"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Progress stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">
                      Nodes Visited
                    </div>
                    <div className="text-3xl font-bold text-cyan-400 font-mono">
                      {visitedCount}/{totalNodes}
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">
                      Story Progress
                    </div>
                    <div className="text-3xl font-bold text-green-400 font-mono">
                      {progressPercent}%
                    </div>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">
                      Critical Path
                    </div>
                    <div className="text-3xl font-bold text-purple-400 font-mono">
                      {stats.criticalPathNodesVisited}/{stats.criticalPathNodesTotal}
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">
                      Explored
                    </div>
                    <div className="text-3xl font-bold text-amber-400 font-mono">
                      {stats.percentageExplored.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Reading path */}
                {progress.readingPath.length > 0 && (
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                      Reading Path
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {progress.readingPath.slice(-10).map((nodeId, idx) => (
                        <span
                          key={`${nodeId}-${idx}`}
                          className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-xs text-cyan-400 font-mono"
                        >
                          {nodeId}
                        </span>
                      ))}
                    </div>
                    {progress.readingPath.length > 10 && (
                      <div className="text-xs text-gray-500 mt-2 font-mono">
                        Showing last 10 of {progress.readingPath.length} nodes
                      </div>
                    )}
                  </div>
                )}

                {/* Character breakdown */}
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-400 mb-3 font-mono uppercase tracking-wider">
                    By Character
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-400" />
                        <span className="text-sm text-gray-300 font-mono">Archaeologist</span>
                      </div>
                      <span className="text-sm font-semibold text-cyan-400 font-mono">
                        {stats.characterBreakdown.archaeologist.visited}/
                        {stats.characterBreakdown.archaeologist.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="text-sm text-gray-300 font-mono">Algorithm</span>
                      </div>
                      <span className="text-sm font-semibold text-green-400 font-mono">
                        {stats.characterBreakdown.algorithm.visited}/
                        {stats.characterBreakdown.algorithm.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="text-sm text-gray-300 font-mono">Human</span>
                      </div>
                      <span className="text-sm font-semibold text-red-400 font-mono">
                        {stats.characterBreakdown.lastHuman.visited}/
                        {stats.characterBreakdown.lastHuman.total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0e12] rounded-lg shadow-2xl shadow-cyan-500/20 border border-cyan-500/30 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-cyan-400 font-mono uppercase tracking-wider">
                  Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-xl"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">⚙️</div>
                  <div className="text-sm font-mono uppercase tracking-wider">
                    Settings panel coming soon
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-mono">
                    Theme, text size, and preferences
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <main className="flex-1 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0a0e12] border-t border-cyan-500/20 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
            <div className="flex items-center space-x-4">
              <span className="text-cyan-400">© 2025 NARRAMORPH FICTION</span>
              <span className="text-gray-700">�</span>
              <button
                className="hover:text-cyan-400 transition-colors uppercase tracking-wider"
                onClick={() =>
                  alert(
                    'About: Narramorph Fiction - An interactive narrative platform exploring digital consciousness through transforming story nodes.',
                  )
                }
              >
                About
              </button>
              <button
                className="hover:text-cyan-400 transition-colors uppercase tracking-wider"
                onClick={() =>
                  alert(
                    'Help: Click nodes to read, revisit nodes to see content transform, follow connections to navigate the story.',
                  )
                }
              >
                Help
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <span>
                NODES: <span className="text-cyan-400">{visitedCount}</span>/{totalNodes}
              </span>
              <span className="text-gray-700">•</span>
              <span>
                <span className="text-green-400">{progressPercent}%</span> COMPLETE
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
