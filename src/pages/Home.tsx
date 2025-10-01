import { useEffect } from 'react';
import { motion } from 'framer-motion';
import NodeMap from '@/components/NodeMap';
import StoryView from '@/components/StoryView';
import { useStoryStore } from '@/stores';

/**
 * Main home page component that displays the node map and story view
 */
export default function Home() {
  const { loadStory, loadProgress } = useStoryStore();

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
        <NodeMap className="w-full h-full" />

        {/* Overlay story view */}
        <StoryView />
      </div>
    </div>
  );
}