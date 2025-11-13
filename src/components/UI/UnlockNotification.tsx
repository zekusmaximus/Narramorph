/**
 * Unlock Notification System
 *
 * Displays toast notifications when nodes unlock, with animations and navigation
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useStoryStore } from '@/stores/storyStore';

/**
 * Character color mapping for notifications
 */
const CHARACTER_COLORS: Record<string, string> = {
  archaeologist: '#00e5ff',
  algorithm: '#39ff14',
  'last-human': '#d32f2f',
  'multi-perspective': '#9c27b0',
};

/**
 * Notification system for node unlocks
 * Displays toast notifications in bottom-right corner
 */
export function UnlockNotificationSystem() {
  const recentlyUnlockedNodes = useStoryStore((state) => state.recentlyUnlockedNodes);
  const clearUnlockNotifications = useStoryStore((state) => state.clearUnlockNotifications);
  const nodes = useStoryStore((state) => state.nodes);
  const unlockConfigs = useStoryStore((state) => state.unlockConfigs);
  const openStoryView = useStoryStore((state) => state.openStoryView);

  // Auto-clear notifications after showing them
  useEffect(() => {
    if (recentlyUnlockedNodes.length > 0) {
      const timer = setTimeout(() => {
        clearUnlockNotifications();
      }, 5000); // Show for 5 seconds

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [recentlyUnlockedNodes, clearUnlockNotifications]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {recentlyUnlockedNodes.map((nodeId) => {
          const node = nodes.get(nodeId);
          const config = unlockConfigs.get(nodeId);

          if (!node || !config) return null;

          const color = CHARACTER_COLORS[node.character] || '#999999';

          return (
            <motion.div
              key={nodeId}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="pointer-events-auto"
            >
              <div
                className="
                  w-80 p-4 bg-black/95 backdrop-blur-sm border-2 rounded-lg
                  shadow-2xl cursor-pointer hover:scale-105 transition-transform
                "
                style={{
                  borderColor: color,
                  boxShadow: `0 0 30px ${color}40`,
                }}
                onClick={() => openStoryView(nodeId)}
              >
                {/* Header with icon */}
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Sparkles className="w-6 h-6" style={{ color }} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                      Node Unlocked
                    </div>
                    <div className="text-sm font-bold" style={{ color }}>
                      {node.title}
                    </div>
                  </div>
                </div>

                {/* Unlock message */}
                {config.unlockMessage && (
                  <div className="text-sm text-gray-300 mb-3">{config.unlockMessage}</div>
                )}

                {/* Call to action */}
                <div className="text-xs text-gray-400 flex items-center justify-between">
                  <span>Click to explore</span>
                  <span className="text-gray-500">⏱ Auto-dismiss in 5s</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
