import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useCallback, useState, type ReactElement, type ReactNode } from 'react';

import { useStoryStore } from '@/stores/storyStore';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { ProgressDialog } from './ProgressDialog';
import { SettingsDialog } from './SettingsDialog';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): ReactElement {
  const [showProgress, setShowProgress] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const progress = useStoryStore((state) => state.progress);
  const nodes = useStoryStore((state) => state.nodes);
  const stats = useStoryStore((state) => state.getReadingStats());
  const preferences = useStoryStore((state) => state.preferences);

  const visitedCount = Object.keys(progress.visitedNodes).length;
  const totalNodes = nodes.size;
  const progressPercent = totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;
  const openProgress = useCallback(() => setShowProgress(true), []);
  const closeProgress = useCallback(() => setShowProgress(false), []);
  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  return (
    <MotionConfig reducedMotion={preferences.reduceMotion ? 'always' : 'user'}>
      <div
        className="archive-shell flex h-dvh min-h-dvh min-w-0 flex-col overflow-hidden"
        data-reading-theme={preferences.theme}
        data-text-size={preferences.textSize}
        data-reduced-motion={preferences.reduceMotion}
      >
        <AppHeader
          visitedCount={visitedCount}
          onOpenProgress={openProgress}
          onOpenSettings={openSettings}
        />

        <AnimatePresence>
          <ProgressDialog
            key="progress-dialog"
            open={showProgress}
            onClose={closeProgress}
            progress={progress}
            stats={stats}
            nodes={nodes}
            visitedCount={visitedCount}
            totalNodes={totalNodes}
            progressPercent={progressPercent}
          />
          <SettingsDialog key="settings-dialog" open={showSettings} onClose={closeSettings} />
        </AnimatePresence>

        <main id="main-content" className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h-full min-h-0 min-w-0"
          >
            {children}
          </motion.div>
        </main>

        <AppFooter
          visitedCount={visitedCount}
          totalNodes={totalNodes}
          progressPercent={progressPercent}
        />
      </div>
    </MotionConfig>
  );
}
