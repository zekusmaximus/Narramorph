import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NodeMap from '@/components/NodeMap';
import StoryView from '@/components/StoryView';
import { JourneyTracker } from '@/components/UI/JourneyTracker';
import { L3AssemblyView } from '@/components/UI/L3AssemblyView';
import { useStoryStore } from '@/stores';
import type { L3Assembly } from '@/types';

/**
 * Main home page component that displays the node map and story view
 */
export default function Home() {
  const { loadStory, loadProgress, buildL3Assembly, progress } = useStoryStore();
  const [showL3Assembly, setShowL3Assembly] = useState(false);
  const [l3Assembly, setL3Assembly] = useState<L3Assembly | null>(null);

  // Initialize the application
  useEffect(() => {
    // Load saved progress on app start
    loadProgress();

    // Load default story (placeholder for now)
    loadStory('eternal-return');
  }, [loadStory, loadProgress]);

  // Handle L3 assembly view
  const handleViewL3Assembly = () => {
    const assembly = buildL3Assembly();
    if (assembly) {
      setL3Assembly(assembly);
      setShowL3Assembly(true);
    } else {
      console.warn('Could not build L3 assembly');
    }
  };

  // Check if user has sufficient progress to view L3 assembly
  const canViewL3 = progress.temporalAwarenessLevel >= 50 ||
                    Object.values(progress.visitedNodes).length >= 10;

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
        <NodeMap className="w-full h-full" />

        {/* Overlay story view */}
        <StoryView />

        {/* Journey Tracker - center bottom */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 z-10"
        >
          <JourneyTracker />
        </motion.div>


        {/* L3 Assembly View Modal */}
        <AnimatePresence>
          {showL3Assembly && l3Assembly && (
            <L3AssemblyView
              assembly={l3Assembly}
              onClose={() => setShowL3Assembly(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}