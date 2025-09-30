import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component providing the application shell
 */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-story-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <h1 className="text-2xl font-bold gradient-text">
                Narramorph Fiction
              </h1>
              <span className="ml-2 text-sm text-story-muted">
                Interactive Narrative Platform
              </span>
            </motion.div>

            {/* Navigation placeholder */}
            <nav className="flex items-center space-x-4" aria-label="Main navigation">
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="btn-ghost"
                type="button"
              >
                Map
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="btn-ghost"
                type="button"
              >
                Progress
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="btn-secondary"
                type="button"
              >
                Settings
              </motion.button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <p className="text-sm text-story-muted">
              © 2025 Narramorph Fiction. Interactive storytelling reimagined.
            </p>
            <div className="flex items-center space-x-4 text-sm text-story-muted">
              <span>Version 1.0.0</span>
              <button
                type="button"
                className="hover:text-story-text transition-colors"
                aria-label="About this project"
              >
                About
              </button>
              <button
                type="button"
                className="hover:text-story-text transition-colors"
                aria-label="Help and documentation"
              >
                Help
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}