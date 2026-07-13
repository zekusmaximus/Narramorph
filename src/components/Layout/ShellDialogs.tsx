import { AnimatePresence } from 'framer-motion';
import type { ReactElement } from 'react';

import type { ReadingStats, StoryNode, UserPreferences, UserProgress } from '@/types';

import type { LayoutPresentationModel } from './layoutPresentation';
import { ProgressDialog } from './ProgressDialog';
import { SettingsDialog } from './SettingsDialog';

interface ShellDialogsProps {
  activeDialog: 'progress' | 'settings' | null;
  onCloseProgress: () => void;
  onCloseSettings: () => void;
  progress: UserProgress;
  stats: ReadingStats;
  nodes: ReadonlyMap<string, StoryNode>;
  shell: LayoutPresentationModel;
  preferences: UserPreferences;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => void;
  reduceMotion: boolean;
}

export function ShellDialogs({
  activeDialog,
  onCloseProgress,
  onCloseSettings,
  progress,
  stats,
  nodes,
  shell,
  preferences,
  onUpdatePreferences,
  reduceMotion,
}: ShellDialogsProps): ReactElement {
  return (
    <AnimatePresence>
      <ProgressDialog
        key="progress-dialog"
        open={activeDialog === 'progress'}
        onClose={onCloseProgress}
        progress={progress}
        stats={stats}
        nodes={nodes}
        visitedCount={shell.visitedCount}
        totalNodes={shell.totalNodes}
        progressPercent={shell.progressPercent}
        reduceMotion={reduceMotion}
      />
      <SettingsDialog
        key="settings-dialog"
        open={activeDialog === 'settings'}
        onClose={onCloseSettings}
        preferences={preferences}
        onUpdatePreferences={onUpdatePreferences}
        reduceMotion={reduceMotion}
      />
    </AnimatePresence>
  );
}
