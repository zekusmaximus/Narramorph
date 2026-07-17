import type { ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

/**
 * Loading state component for 3D visualization
 * Displays while spatial positions are being computed
 */
export default function LoadingState(): ReactElement {
  const reduceMotion = useReducedMotionPreference();

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-40"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div
          className={`mb-4 inline-block h-12 w-12 rounded-full border-b-2 border-white ${
            reduceMotion ? '' : 'animate-spin'
          }`}
          data-testid="loading-indicator"
          aria-hidden="true"
        />
        <p className="text-xl font-medium text-white">Opening the three-dimensional archive…</p>
      </div>
    </div>
  );
}
