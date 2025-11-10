/**
 * L3 Assembly View Component - displays the 4-section convergence assembly
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { L3Assembly } from '@/types';
import { getL3AssemblySections } from '@/utils/l3Assembly';

interface L3AssemblyViewProps {
  assembly: L3Assembly;
  onClose?: () => void;
}

const characterColors = {
  archaeologist: 'from-blue-600/20 to-blue-900/20 border-blue-500/30',
  algorithm: 'from-green-600/20 to-green-900/20 border-green-500/30',
  lastHuman: 'from-red-600/20 to-red-900/20 border-red-500/30',
  convergence: 'from-purple-600/20 to-purple-900/20 border-purple-500/30',
};

const characterTextColors = {
  archaeologist: 'text-blue-400',
  algorithm: 'text-green-400',
  lastHuman: 'text-red-400',
  convergence: 'text-purple-400',
};

export function L3AssemblyView({ assembly, onClose }: L3AssemblyViewProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const sections = getL3AssemblySections(assembly);
  const currentSection = sections[currentSectionIndex];

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' && currentSectionIndex < sections.length - 1) {
      handleNext();
    } else if (e.key === 'ArrowLeft' && currentSectionIndex > 0) {
      handlePrevious();
    } else if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black border-b border-cyan-500/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-mono text-cyan-400 mb-2">Layer 3: Convergence</h2>
              <div className="space-y-1 text-sm font-mono text-gray-400">
                <div>Journey: {assembly.metadata.journeyPattern}</div>
                <div>Philosophy: {assembly.metadata.pathPhilosophy}</div>
                <div>Awareness: {assembly.metadata.awarenessLevel}</div>
                <div>Synthesis: {assembly.metadata.synthesisPattern}</div>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors font-mono text-sm"
              >
                [ESC]
              </button>
            )}
          </div>

          {/* Section Navigation */}
          <div className="mt-6 flex gap-2">
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => setCurrentSectionIndex(index)}
                className={`flex-1 px-3 py-2 rounded font-mono text-xs transition-all ${
                  index === currentSectionIndex
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-gray-300'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto bg-gradient-to-b ${
            characterColors[currentSection.character as keyof typeof characterColors]
          } border-2 ${characterColors[currentSection.character as keyof typeof characterColors]}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSectionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <h3
                className={`text-xl font-mono mb-4 ${
                  characterTextColors[currentSection.character as keyof typeof characterTextColors]
                }`}
              >
                {currentSection.title}
              </h3>
              <div className="text-xs text-gray-400 font-mono mb-6">
                {currentSection.wordCount} words
              </div>
              <div className="prose prose-invert prose-cyan max-w-none">
                <ReactMarkdown>{currentSection.content}</ReactMarkdown>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="bg-gradient-to-r from-black to-gray-900 border-t border-cyan-500/30 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentSectionIndex === 0}
              className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                currentSectionIndex === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30'
              }`}
            >
              ← Previous
            </button>

            <div className="text-sm font-mono text-gray-400">
              Section {currentSectionIndex + 1} of {sections.length}
            </div>

            <button
              onClick={handleNext}
              disabled={currentSectionIndex === sections.length - 1}
              className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                currentSectionIndex === sections.length - 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30'
              }`}
            >
              Next →
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 font-mono text-center">
            Use arrow keys to navigate • ESC to close
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
