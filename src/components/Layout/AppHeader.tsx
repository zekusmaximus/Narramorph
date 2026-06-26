import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

interface AppHeaderProps {
  visitedCount: number;
  onOpenProgress: () => void;
  onOpenSettings: () => void;
}

export function AppHeader({
  visitedCount,
  onOpenProgress,
  onOpenSettings,
}: AppHeaderProps): ReactElement {
  return (
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

            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="px-3 py-1.5 rounded bg-gray-900/50 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider flex items-center space-x-2 relative"
              onClick={onOpenProgress}
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

            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="px-3 py-1.5 rounded bg-gray-900/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800/50 hover:border-gray-600/50 hover:text-gray-300 transition-all text-sm font-mono uppercase tracking-wider flex items-center space-x-2"
              onClick={onOpenSettings}
              title="Preferences and settings"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}
