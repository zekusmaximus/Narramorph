import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import NodeMap from '@/components/NodeMap';
import StoryView from '@/components/StoryView';
import { JourneyTracker } from '@/components/UI/JourneyTracker';
import { L3AssemblyView } from '@/components/UI/L3AssemblyView';
import { UnlockNotificationSystem } from '@/components/UI/UnlockNotification';
import { useStoryStore } from '@/stores';

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
 * Main home page component that displays the node map and story view
 */
export default function Home() {
  const loadStory = useStoryStore(state => state.loadStory);
  const loadProgress = useStoryStore(state => state.loadProgress);
  const l3AssemblyViewOpen = useStoryStore(state => state.l3AssemblyViewOpen);
  const currentL3Assembly = useStoryStore(state => state.currentL3Assembly);
  const closeL3AssemblyView = useStoryStore(state => state.closeL3AssemblyView);

  // Initialize the application
  useEffect(() => {
    // Load saved progress on app start
    loadProgress();

    // Load default story (placeholder for now)
    loadStory('eternal-return');
  }, [loadStory, loadProgress]);

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
            Experience a recursive narrative exploring digital consciousness across time.
            Navigate through interconnected nodes to uncover the story of three perspectives:
            the Archaeologist, the Algorithm, and the Human.
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className="bg-blue-500/30 px-3 py-1 rounded-full">
              Interactive Narrative
            </span>
            <span className="bg-purple-500/30 px-3 py-1 rounded-full">
              Non-Linear Story
            </span>
            <span className="bg-indigo-500/30 px-3 py-1 rounded-full">
              Multiple Perspectives
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main content area with node map */}
      <div className="flex-1 relative">
        <ErrorBoundary fallbackRender={({ error }) => <ErrorFallback error={error} />}>
          <NodeMap className="w-full h-full" />
        </ErrorBoundary>

        {/* Overlay story view */}
        <ErrorBoundary fallbackRender={({ error }) => <ErrorFallback error={error} />}>
          <StoryView />
        </ErrorBoundary>

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
              <L3AssemblyView
                assembly={currentL3Assembly}
                onClose={closeL3AssemblyView}
              />
            </ErrorBoundary>
          )}
        </AnimatePresence>

        {/* Unlock Notification System */}
        <UnlockNotificationSystem />
      </div>
    </div>
  );
}