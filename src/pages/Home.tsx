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

        {/* Getting started guide overlay (for new users) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute top-6 left-6 max-w-sm"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              🗺️ Getting Started
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Click on nodes to explore the story. Each character offers a unique perspective
              on the narrative.
            </p>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-archaeologist-500"></div>
                <span>Archaeologist</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-algorithm-500"></div>
                <span>Algorithm</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-human-500"></div>
                <span>Human</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="absolute top-6 right-6"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">
              📊 Progress
            </h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Nodes Visited:</span>
                <span className="font-medium">0/0</span>
              </div>
              <div className="flex justify-between">
                <span>Story Progress:</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}