/**
 * Unlock Notification System
 *
 * Displays toast notifications when nodes unlock, with animations and navigation
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
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
export function UnlockNotificationSystem(): ReactElement {
  const recentlyUnlockedNodes = useStoryStore((state) => state.recentlyUnlockedNodes);
  const clearUnlockNotifications = useStoryStore((state) => state.clearUnlockNotifications);
  const nodes = useStoryStore((state) => state.nodes);
  const unlockConfigs = useStoryStore((state) => state.unlockConfigs);
  const storyViewOpen = useStoryStore((state) => state.storyViewOpen);
  const l3AssemblyViewOpen = useStoryStore((state) => state.l3AssemblyViewOpen);
  const selectNode = useStoryStore((state) => state.selectNode);
  const openStoryView = useStoryStore((state) => state.openStoryView);
  const reduceMotion = useReducedMotionPreference();
  const [dismissalPaused, setDismissalPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const panelOpen = storyViewOpen || l3AssemblyViewOpen;
  const pendingAnnouncement = useMemo(() => {
    const titles = recentlyUnlockedNodes
      .map((nodeId) => nodes.get(nodeId)?.title)
      .filter((title): title is string => title !== undefined);
    if (titles.length === 0) {
      return '';
    }
    return `A new passage has surfaced: ${titles.join(', ')}.`;
  }, [nodes, recentlyUnlockedNodes]);

  useEffect(() => {
    if (panelOpen || pendingAnnouncement === '') {
      setAnnouncement('');
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setAnnouncement(pendingAnnouncement);
    });
    return () => cancelAnimationFrame(frame);
  }, [panelOpen, pendingAnnouncement]);

  const openUnlockedNode = (nodeId: string): void => {
    selectNode(nodeId);
    openStoryView(nodeId);
  };

  // Auto-clear notifications after showing them
  useEffect(() => {
    if (recentlyUnlockedNodes.length > 0 && !panelOpen && !dismissalPaused) {
      const timer = setTimeout(() => {
        clearUnlockNotifications();
      }, 5000); // Show for 5 seconds

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [clearUnlockNotifications, dismissalPaused, panelOpen, recentlyUnlockedNodes]);

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {!panelOpen && announcement === pendingAnnouncement ? announcement : ''}
      </p>
      <div
        className={`pointer-events-none fixed inset-x-3 bottom-3 z-50 space-y-2 sm:inset-x-auto sm:bottom-4 sm:right-4 ${panelOpen ? 'invisible' : ''}`}
        onMouseEnter={() => setDismissalPaused(true)}
        onMouseLeave={() => setDismissalPaused(false)}
        onFocusCapture={() => setDismissalPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setDismissalPaused(false);
          }
        }}
        data-testid="unlock-notification-stack"
      >
        <AnimatePresence>
          {recentlyUnlockedNodes.map((nodeId) => {
            const node = nodes.get(nodeId);
            const config = unlockConfigs.get(nodeId);

            if (!node || !config) {
              return null;
            }

            const color = CHARACTER_COLORS[node.character] || '#999999';

            return (
              <motion.div
                key={nodeId}
                initial={reduceMotion ? false : { opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 20, scale: 0.9 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.3, type: 'spring' }}
                className="pointer-events-auto"
              >
                <button
                  type="button"
                  className="
                  w-full max-w-80 p-4 bg-black/95 backdrop-blur-sm border-2 rounded-lg text-left sm:w-80
                  shadow-2xl cursor-pointer hover:scale-105 transition-transform
                "
                  style={{
                    borderColor: color,
                    boxShadow: `0 0 30px ${color}40`,
                  }}
                  onClick={() => openUnlockedNode(nodeId)}
                  aria-label={`Open newly surfaced passage: ${node.title}`}
                  data-testid={`unlock-notification-${nodeId}`}
                >
                  {/* Header with icon */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Sparkles aria-hidden="true" className="w-6 h-6" style={{ color }} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">
                        A passage surfaced
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
                    <span>Open the passage</span>
                    <span className="text-gray-500">Fades after a moment</span>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
