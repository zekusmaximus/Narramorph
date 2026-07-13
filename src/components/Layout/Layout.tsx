import { useCallback, useState, type ReactElement, type ReactNode } from 'react';

import { useStoryStore } from '@/stores/storyStore';

import { LayoutShell } from './LayoutShell';
import { ShellDialogs } from './ShellDialogs';
import { useLayoutStateAdapter } from './useLayoutStateAdapter';

interface LayoutProps {
  children: ReactNode;
}

type UtilityDialog = 'progress' | 'settings' | null;

export default function Layout({ children }: LayoutProps): ReactElement {
  const [activeDialog, setActiveDialog] = useState<UtilityDialog>(null);
  const layout = useLayoutStateAdapter();
  const updatePreferences = useStoryStore((state) => state.updatePreferences);

  const openProgress = useCallback(() => setActiveDialog('progress'), []);
  const closeProgress = useCallback(() => setActiveDialog(null), []);
  const openSettings = useCallback(() => setActiveDialog('settings'), []);
  const closeSettings = useCallback(() => setActiveDialog(null), []);

  return (
    <LayoutShell
      preferences={layout.preferences}
      reduceMotion={layout.reduceMotion}
      shell={layout.shell}
      onOpenProgress={openProgress}
      onOpenSettings={openSettings}
      dialogs={
        <ShellDialogs
          activeDialog={activeDialog}
          onCloseProgress={closeProgress}
          onCloseSettings={closeSettings}
          progress={layout.progress}
          stats={layout.stats}
          nodes={layout.nodes}
          shell={layout.shell}
          preferences={layout.preferences}
          onUpdatePreferences={updatePreferences}
          reduceMotion={layout.reduceMotion}
        />
      }
    >
      {children}
    </LayoutShell>
  );
}
