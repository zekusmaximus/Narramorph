import { useEffect } from 'react';

import { disableErrorReporting, enableErrorReporting } from '@/utils/errorReporting';

/**
 * Syncs the reader's persisted opt-in consent with the lazy error reporter (Batch 8.3):
 * a truthy consent loads + initialises the Sentry SDK; a falsy/absent consent makes it
 * inert. Handles both a value restored from a prior session and in-session changes.
 * Mount once near the app root.
 */
export function useErrorReportingConsent(consent: boolean | undefined): void {
  useEffect(() => {
    if (consent) {
      void enableErrorReporting();
    } else {
      disableErrorReporting();
    }
  }, [consent]);
}
