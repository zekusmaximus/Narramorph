import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import FPSCounter from '@/components/3d/FPSCounter';
import LoadingState from '@/components/3d/LoadingState';
import NarromorphCanvas from '@/components/3d/NarromorphCanvas';
import ContentPanel3D from '@/components/ContentPanel3D';
import NodeMap from '@/components/NodeMap';
import { OpeningExperience } from '@/components/OpeningExperience';
import StoryView from '@/components/StoryView';
import { L3AssemblyView } from '@/components/UI/L3AssemblyView';
import { UnlockNotificationSystem } from '@/components/UI/UnlockNotification';
import { useStoryStore } from '@/stores';
import { useSpatialStore } from '@/stores/spatialStore';

/**
 * Error fallback component for ErrorBoundary
 */
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-red-800 font-semibold mb-2">Something went wrong</h2>
      <pre className="text-sm text-red-600">{error.message}</pre>
    </div>
  );
}

/**
 * WebGL error fallback component
 * Automatically switches to 2D mode when WebGL fails
 */
function WebGLErrorFallback({
  error: _error,
  onFallbackTo2D,
}: {
  error: Error;
  onFallbackTo2D: () => void;
}) {
  useEffect(() => {
    // Automatically switch to 2D mode
    onFallbackTo2D();
  }, [onFallbackTo2D]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 z-30">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">WebGL Not Supported</h2>
        <p className="text-gray-300 mb-4">
          Your browser or device doesn&apos;t support WebGL, which is required for 3D visualization.
        </p>
        <p className="text-sm text-gray-400">Automatically switching to 2D view...</p>
      </div>
    </div>
  );
}

function getRequested3DMode(): boolean {
  const stored = localStorage.getItem('narramorph-3d-mode');
  return stored !== null ? stored === 'true' : import.meta.env.VITE_ENABLE_3D === 'true';
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Main home page component that displays the node map and story view
 */
export default function Home() {
  const loadStory = useStoryStore((state) => state.loadStory);
  const loadProgress = useStoryStore((state) => state.loadProgress);
  const l3AssemblyViewOpen = useStoryStore((state) => state.l3AssemblyViewOpen);
  const currentL3Assembly = useStoryStore((state) => state.currentL3Assembly);
  const closeL3AssemblyView = useStoryStore((state) => state.closeL3AssemblyView);
  const positions = useSpatialStore((state) => state.positions);
  const [storyId] = useState(
    () => new URLSearchParams(window.location.search).get('story') || 'eternal-return',
  );
  const [storyError, setStoryError] = useState<string | null>(null);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  const [webGLFallbackMessage, setWebGLFallbackMessage] = useState<string | null>(() =>
    getRequested3DMode() && !supportsWebGL()
      ? '3D view is unavailable in this browser. The 2D story map is ready instead.'
      : null,
  );

  // Track whether 3D mode should be used
  // Priority: localStorage > environment variable
  const [use3DMode, setUse3DMode] = useState(() => {
    return getRequested3DMode() && supportsWebGL();
  });
  const isPositionsLoaded = Object.keys(positions).length > 0;

  // Toggle 3D mode and persist to localStorage
  const toggle3DMode = () => {
    setUse3DMode((prev) => {
      const newValue = !prev;
      if (newValue && !supportsWebGL()) {
        setWebGLFallbackMessage(
          '3D view is unavailable in this browser. The 2D story map is ready instead.',
        );
        localStorage.setItem('narramorph-3d-mode', 'false');
        return false;
      }
      setWebGLFallbackMessage(null);
      localStorage.setItem('narramorph-3d-mode', String(newValue));
      return newValue;
    });
  };

  const initializeStory = useCallback(
    async (force = false) => {
      if (!force && initializationPromiseRef.current) {
        return initializationPromiseRef.current;
      }

      setStoryError(null);
      const task = (async () => {
        try {
          await loadStory(storyId);
          loadProgress();
        } catch (error) {
          console.error('Failed to load story:', error);
          setStoryError(error instanceof Error ? error.message : 'The story could not be loaded.');
        }
      })();
      initializationPromiseRef.current = task;

      try {
        await task;
      } finally {
        if (initializationPromiseRef.current === task) {
          initializationPromiseRef.current = null;
        }
      }
    },
    [loadProgress, loadStory, storyId],
  );

  // Initialize the application
  useEffect(() => {
    void initializeStory();
  }, [initializeStory]);

  // Fallback to 2D mode on WebGL error
  const handleFallbackTo2D = useCallback(() => {
    setWebGLFallbackMessage(
      '3D view encountered a graphics error. The 2D story map is ready instead.',
    );
    localStorage.setItem('narramorph-3d-mode', 'false');
    setUse3DMode(false);
  }, []);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <OpeningExperience />

      {/* Main content area with node map */}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <WebGLErrorFallback error={error} onFallbackTo2D={handleFallbackTo2D} />
          )}
        >
          {storyError ? (
            <div
              role="alert"
              className="absolute inset-0 flex items-center justify-center bg-gray-950 text-white p-8"
              data-testid="story-load-error"
            >
              <div className="max-w-md text-center">
                <h2 className="text-2xl font-bold mb-3">Story unavailable</h2>
                <p className="text-gray-300 mb-2">
                  We couldn&apos;t open this story. Your saved progress has not been changed.
                </p>
                <p className="text-sm text-gray-500 mb-6">{storyError}</p>
                <button
                  type="button"
                  onClick={() => void initializeStory(true)}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : use3DMode ? (
            <>
              <NarromorphCanvas />
              {!isPositionsLoaded && <LoadingState />}
            </>
          ) : (
            <NodeMap className="w-full h-full" />
          )}
        </ErrorBoundary>

        {webGLFallbackMessage && (
          <div
            role="status"
            data-testid="webgl-fallback-status"
            className="absolute right-3 top-14 z-40 max-w-[calc(100%_-_1.5rem)] rounded-lg border border-amber-200/30 bg-[#11191e]/95 px-4 py-3 text-sm text-amber-50 shadow-xl backdrop-blur sm:max-w-sm"
          >
            {webGLFallbackMessage}
          </div>
        )}

        {/* Content panels - different for 2D vs 3D mode */}
        <ErrorBoundary fallbackRender={({ error }) => <ErrorFallback error={error} />}>
          {use3DMode ? <ContentPanel3D /> : <StoryView />}
        </ErrorBoundary>

        {/* Dev-only FPS counter for 3D mode */}
        {use3DMode && <FPSCounter />}

        {/* The existing 3D implementation remains available as an experimental secondary view. */}
        <button
          type="button"
          onClick={toggle3DMode}
          aria-pressed={use3DMode}
          className="absolute right-3 top-3 z-40 rounded-full border border-white/15 bg-[#11191e]/90 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-slate-300 shadow-lg backdrop-blur-sm transition-colors hover:border-cyan-100/35 hover:text-cyan-50"
          title={`Switch to ${use3DMode ? '2D' : '3D'} mode`}
        >
          {use3DMode ? 'Return to 2D archive' : 'Experimental 3D'}
        </button>

        {/* L3 Assembly View Modal */}
        <AnimatePresence>
          {l3AssemblyViewOpen && currentL3Assembly && (
            <ErrorBoundary fallbackRender={({ error }) => <ErrorFallback error={error} />}>
              <L3AssemblyView assembly={currentL3Assembly} onClose={closeL3AssemblyView} />
            </ErrorBoundary>
          )}
        </AnimatePresence>

        {/* Unlock Notification System */}
        <UnlockNotificationSystem />
      </div>
    </div>
  );
}
