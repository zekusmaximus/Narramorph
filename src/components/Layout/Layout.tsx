import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { IntroDialog, markIntroSeen, type IntroOrigin } from '@/components/Onboarding';
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
  // The orientation guide never auto-opens: the opening picker
  // (OpeningExperience) is the onboarding, so the intro would be a second one.
  // It opens only on demand from the Help entry, but arriving at the map still
  // marks the current intro version as seen (below) to keep the version gate
  // consistent for any code that reads it.
  const [introOrigin, setIntroOrigin] = useState<IntroOrigin | null>(null);
  const layout = useLayoutStateAdapter();
  const updatePreferences = useStoryStore((state) => state.updatePreferences);

  // "Seen = true on first map arrival." Record the current intro version once on
  // mount so the version gate stays satisfied without ever auto-opening the guide.
  useEffect(() => {
    markIntroSeen();
  }, []);

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
      activePanel={introOrigin !== null ? 'guide' : activeDialog}
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
