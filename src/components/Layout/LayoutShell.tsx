import { MotionConfig, motion } from 'framer-motion';
import type { ReactElement, ReactNode } from 'react';

import type { UserPreferences } from '@/types';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import type { LayoutPresentationModel } from './layoutPresentation';

interface LayoutShellProps {
  children: ReactNode;
  preferences: UserPreferences;
  reduceMotion: boolean;
  shell: LayoutPresentationModel;
  onOpenProgress: () => void;
  onOpenSettings: () => void;
  dialogs: ReactNode;
}

export function LayoutShell({
  children,
  preferences,
  reduceMotion,
  shell,
  onOpenProgress,
  onOpenSettings,
  dialogs,
}: LayoutShellProps): ReactElement {
  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
      <div
        className="archive-shell flex h-dvh min-h-dvh min-w-0 flex-col overflow-hidden"
        data-reading-theme={preferences.theme}
        data-text-size={preferences.textSize}
        data-reduced-motion={reduceMotion}
      >
        <AppHeader
          visitedCount={shell.visitedCount}
          onOpenProgress={onOpenProgress}
          onOpenSettings={onOpenSettings}
        />
        {dialogs}
        <main
          id="main-content"
          tabIndex={-1}
          className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.2 }}
            className="h-full min-h-0 min-w-0"
          >
            {children}
          </motion.div>
        </main>
        <AppFooter
          visitedCount={shell.visitedCount}
          totalNodes={shell.totalNodes}
          progressPercent={shell.progressPercent}
        />
      </div>
    </MotionConfig>
  );
}
