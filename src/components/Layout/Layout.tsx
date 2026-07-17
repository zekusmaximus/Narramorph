import { AnimatePresence } from 'framer-motion';
import { useCallback, useState, type ReactElement, type ReactNode } from 'react';

import {
  IntroDialog,
  markIntroSeen,
  shouldShowIntro,
  type IntroOrigin,
} from '@/components/Onboarding';
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
  // The introduction auto-opens the first time this browser reaches an
  // onboarding version it has not completed; otherwise it opens only on demand
  // from the Help entry. Reading storage once at mount avoids a flash.
  const [introOrigin, setIntroOrigin] = useState<IntroOrigin | null>(() =>
    shouldShowIntro() ? 'first-run' : null,
  );
  const layout = useLayoutStateAdapter();
  const updatePreferences = useStoryStore((state) => state.updatePreferences);

  const openProgress = useCallback(() => setActiveDialog('progress'), []);
  const closeProgress = useCallback(() => setActiveDialog(null), []);
  const openSettings = useCallback(() => setActiveDialog('settings'), []);
  const closeSettings = useCallback(() => setActiveDialog(null), []);
  const openHelp = useCallback(() => setIntroOrigin('help'), []);
  const closeIntro = useCallback(() => {
    // Any dismissal (begin, skip, or close) records that this browser has seen
    // the current intro version, so it stops auto-opening.
    markIntroSeen();
    setIntroOrigin(null);
  }, []);

  return (
    <LayoutShell
      preferences={layout.preferences}
      reduceMotion={layout.reduceMotion}
      shell={layout.shell}
      onOpenProgress={openProgress}
      onOpenSettings={openSettings}
      onOpenHelp={openHelp}
      dialogs={
        <>
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
          <AnimatePresence>
            <IntroDialog
              key="intro-dialog"
              open={introOrigin !== null}
              origin={introOrigin ?? 'first-run'}
              onClose={closeIntro}
              reduceMotion={layout.reduceMotion}
            />
          </AnimatePresence>
        </>
      }
    >
      {children}
    </LayoutShell>
  );
}
