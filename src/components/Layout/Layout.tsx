import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useState, type ReactElement, type ReactNode } from 'react';

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
  const reduceMotion = useStoryStore((state) => state.preferences.reduceMotion);

  const visitedCount = Object.keys(progress.visitedNodes).length;
  const totalNodes = nodes.size;
  const progressPercent = totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <div className="flex flex-col h-screen bg-story-background">
        <AppHeader
          visitedCount={visitedCount}
          onOpenProgress={() => setShowProgress(true)}
          onOpenSettings={() => setShowSettings(true)}
        />

        <AnimatePresence>
          <ProgressDialog
            key="progress-dialog"
            open={showProgress}
            onClose={() => setShowProgress(false)}
            progress={progress}
            stats={stats}
            visitedCount={visitedCount}
            totalNodes={totalNodes}
            progressPercent={progressPercent}
          />
          <SettingsDialog
            key="settings-dialog"
            open={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </AnimatePresence>

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

        <AppFooter
          visitedCount={visitedCount}
          totalNodes={totalNodes}
          progressPercent={progressPercent}
        />
      </div>
    </MotionConfig>
  );
}
