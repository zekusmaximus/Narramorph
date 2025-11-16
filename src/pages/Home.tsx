import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';

import FPSCounter from '@/components/3d/FPSCounter';
import LoadingState from '@/components/3d/LoadingState';
import NarromorphCanvas from '@/components/3d/NarromorphCanvas';
import ContentPanel3D from '@/components/ContentPanel3D';
import NodeMap from '@/components/NodeMap';
import StoryView from '@/components/StoryView';
import { JourneyTracker } from '@/components/UI/JourneyTracker';
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
          Your browser or device doesn't support WebGL, which is required for 3D visualization.
        </p>
        <p className="text-sm text-gray-400">Automatically switching to 2D view...</p>
      </div>
    </div>
  );
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

  // Track whether 3D mode should be used
  // Priority: localStorage > environment variable
  const [use3DMode, setUse3DMode] = useState(() => {
    const stored = localStorage.getItem('narramorph-3d-mode');
    if (stored !== null) return stored === 'true';
    return import.meta.env.VITE_ENABLE_3D === 'true';
  });
  const isPositionsLoaded = Object.keys(positions).length > 0;

  // Toggle 3D mode and persist to localStorage
  const toggle3DMode = () => {
    setUse3DMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('narramorph-3d-mode', String(newValue));
      return newValue;
    });
  };

  // Initialize the application
  useEffect(() => {
    // Load saved progress on app start
    loadProgress();

    // Load default story (placeholder for now)
    void loadStory('eternal-return').catch((err) => {
      console.error('[Home] Failed to load story:', err);
    });
  }, [loadStory, loadProgress]);

  // Fallback to 2D mode on WebGL error
  const handleFallbackTo2D = () => {
    setTimeout(() => {
      setUse3DMode(false);
    }, 2000); // Show error message for 2 seconds before switching
  };

  return (
    <div className="h-full flex flex-col">
      {/* Hero section for new users */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Eternal Return of the Digital Self
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Experience a recursive narrative exploring digital consciousness across time. Navigate
            through interconnected nodes to uncover the story of three perspectives: the
            Archaeologist, the Algorithm, and the Human.
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className="bg-blue-500/30 px-3 py-1 rounded-full">Interactive Narrative</span>
            <span className="bg-purple-500/30 px-3 py-1 rounded-full">Non-Linear Story</span>
            <span className="bg-indigo-500/30 px-3 py-1 rounded-full">Multiple Perspectives</span>
          </div>
        </div>
      </motion.div>

      {/* Main content area with node map */}
      <div className="flex-1 relative">
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <WebGLErrorFallback error={error} onFallbackTo2D={handleFallbackTo2D} />
          )}
        >
          {use3DMode ? (
            <>
              <NarromorphCanvas />
              {!isPositionsLoaded && <LoadingState />}
            </>
          ) : (
            <NodeMap className="w-full h-full" />
          )}
        </ErrorBoundary>

        {/* Content panels - different for 2D vs 3D mode */}
        <ErrorBoundary fallbackRender={({ error }) => <ErrorFallback error={error} />}>
          {use3DMode ? <ContentPanel3D /> : <StoryView />}
        </ErrorBoundary>

        {/* Dev-only FPS counter for 3D mode */}
        {use3DMode && <FPSCounter />}

        {/* 3D/2D Mode Toggle (optional UI control) */}
        <button
          type="button"
          onClick={toggle3DMode}
          className="fixed top-4 left-4 z-90 bg-gray-900/80 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/90 transition-colors backdrop-blur-sm border border-gray-700 shadow-lg"
          title={`Switch to ${use3DMode ? '2D' : '3D'} mode`}
        >
          {use3DMode ? '2D Mode' : '3D Mode'}
        </button>

        {/* Journey Tracker - center bottom */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 z-10"
        >
          <ErrorBoundary fallbackRender={({ error }) => <ErrorFallback error={error} />}>
            <JourneyTracker />
          </ErrorBoundary>
        </motion.div>

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
