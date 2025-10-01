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
  const progressPercent =
    totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-story-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <h1 className="text-2xl font-bold gradient-text">Narramorph Fiction</h1>
              <span className="ml-2 text-sm text-story-muted">
                Interactive Narrative Platform
              </span>
            </motion.div>

            {/* Navigation buttons */}
            <nav className="flex items-center space-x-2" aria-label="Main navigation">
              {/* Map button - currently viewing map */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="btn-secondary opacity-50 cursor-not-allowed"
                type="button"
                disabled
                title="Currently viewing map"
              >
                <span className="mr-1">🗺️</span>
                Map
              </motion.button>

              {/* Progress button */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="btn-secondary relative"
                type="button"
                onClick={() => setShowProgress(!showProgress)}
                title="View reading progress"
              >
                <span className="mr-1">📊</span>
                Progress
                {visitedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {visitedCount}
                  </span>
                )}
              </motion.button>

              {/* Settings button */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="btn-secondary"
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                title="Preferences and settings"
              >
                <span className="mr-1">⚙️</span>
                Settings
              </motion.button>
            </nav>
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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProgress(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Reading Progress</h2>
                <button
                  onClick={() => setShowProgress(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Progress stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Nodes Visited</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {visitedCount}/{totalNodes}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Story Progress</div>
                    <div className="text-3xl font-bold text-green-600">{progressPercent}%</div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Critical Path</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.criticalPathNodesVisited}/{stats.criticalPathNodesTotal}
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Completion</div>
                    <div className="text-3xl font-bold text-yellow-600">
                      {stats.percentageExplored.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Reading path */}
                {progress.readingPath.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Reading Path
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {progress.readingPath.slice(-10).map((nodeId, idx) => (
                        <span
                          key={`${nodeId}-${idx}`}
                          className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200"
                        >
                          {nodeId}
                        </span>
                      ))}
                    </div>
                    {progress.readingPath.length > 10 && (
                      <div className="text-xs text-gray-500 mt-2">
                        Showing last 10 of {progress.readingPath.length} nodes
                      </div>
                    )}
                  </div>
                )}

                {/* Character breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">
                    By Character
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-archaeologist-500" />
                        <span className="text-sm text-gray-700">Archaeologist</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.characterBreakdown.archaeologist.visited}/
                        {stats.characterBreakdown.archaeologist.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-algorithm-500" />
                        <span className="text-sm text-gray-700">Algorithm</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.characterBreakdown.algorithm.visited}/
                        {stats.characterBreakdown.algorithm.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-human-500" />
                        <span className="text-sm text-gray-700">Human</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.characterBreakdown.human.visited}/
                        {stats.characterBreakdown.human.total}
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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-center text-gray-600 py-8">
                  <div className="text-4xl mb-2">⚙️</div>
                  <div className="text-sm">Settings panel coming soon</div>
                  <div className="text-xs text-gray-500 mt-1">
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
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-4 text-sm text-story-muted">
              <span>© 2025 Narramorph Fiction</span>
              <span>•</span>
              <button
                type="button"
                className="hover:text-story-text transition-colors"
                onClick={() =>
                  alert(
                    'About: Narramorph Fiction - An interactive narrative platform exploring digital consciousness through transforming story nodes.'
                  )
                }
                aria-label="About this project"
              >
                About
              </button>
              <button
                type="button"
                className="hover:text-story-text transition-colors"
                onClick={() =>
                  alert(
                    'Help: Click nodes to read, revisit nodes to see content transform, follow connections to navigate the story.'
                  )
                }
                aria-label="Help and documentation"
              >
                Help
              </button>
            </div>

            <div className="flex items-center space-x-4 text-sm text-story-muted">
              <span>
                Nodes: {visitedCount}/{totalNodes}
              </span>
              <span>•</span>
              <span>{progressPercent}% Complete</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
