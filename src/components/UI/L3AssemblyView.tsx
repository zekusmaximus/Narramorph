/**
 * L3 Assembly View Component - displays the 4-section convergence assembly
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';

import { useStoryStore } from '@/stores/storyStore';
import type { L3Assembly } from '@/types';
import { getL3AssemblySections } from '@/utils/l3Assembly';

/**
 * Simple markdown parser for story content
 * Supports bold, italic, and paragraph formatting
 */
function parseMarkdown(content: string): ReactNode {
  // Split into paragraphs
  const paragraphs = content.split('\n\n').filter((p) => p.trim());

  return paragraphs.map((paragraph, pIndex) => {
    const currentText = paragraph;
    let key = 0;

    // Process text with bold and italic formatting
    const processedParts: ReactNode[] = [];

    // Regex patterns for markdown formatting
    const boldPattern = /(\*\*|__)(.*?)\1/g;
    // italicPattern currently unused but kept for future feature
    // @ts-expect-error - Unused but kept for future feature
    const italicPattern = /(\*|_)(.*?)\1/g;

    // First pass: handle bold text
    let match;
    let lastIndex = 0;

    while ((match = boldPattern.exec(currentText)) !== null) {
      // Add text before the match
      if (match.index && match.index > lastIndex) {
        processedParts.push(currentText.slice(lastIndex, match.index));
      }

      // Add bold text
      processedParts.push(<strong key={`bold-${key++}`}>{match[2]}</strong>);

      lastIndex = (match.index || 0) + match[0].length;
    }

    // Add remaining text
    if (lastIndex < currentText.length) {
      processedParts.push(currentText.slice(lastIndex));
    }

    return (
      <p key={`p-${pIndex}`} className="mb-4 leading-relaxed">
        {processedParts.length > 0 ? processedParts : currentText}
      </p>
    );
  });
}

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
  const markL3SectionRead = useStoryStore((state) => state.markL3SectionRead);
  const finalizeActiveVisit = useStoryStore((state) => state.finalizeActiveVisit);
  const l3Progress = useStoryStore(
    (state) => state.progress.l3AssembliesViewed?.[state.progress.l3AssembliesViewed.length - 1],
  );
  const sectionRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => getL3AssemblySections(assembly), [assembly]);
  const currentSection = sections[currentSectionIndex];

  // Track section reads using IntersectionObserver
  useEffect(() => {
    if (!sectionRef.current || !currentSection) {
      return undefined;
    }

    let timer: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Section visible - start timer
            timer = setTimeout(() => {
              const sectionKey = currentSection.character as 'arch' | 'algo' | 'hum' | 'conv';
              markL3SectionRead(sectionKey);
            }, 3000); // Mark as read after 3 seconds
          } else {
            // Section not visible - clear timer
            if (timer) {
              clearTimeout(timer);
            }
          }
        });
      },
      { threshold: 0.5 }, // 50% visible
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [currentSection, markL3SectionRead]);

  // Handle section navigation
  const goToSection = useCallback(
    (index: number) => {
      if (index < 0 || index >= sections.length) {
        return;
      }

      const prevSection = sections[currentSectionIndex];
      if (prevSection) {
        const sectionKey = prevSection.character as 'arch' | 'algo' | 'hum' | 'conv';
        markL3SectionRead(sectionKey);
      }

      setCurrentSectionIndex(index);
    },
    [currentSectionIndex, markL3SectionRead, sections],
  );

  const handleNext = useCallback(() => {
    goToSection(currentSectionIndex + 1);
  }, [currentSectionIndex, goToSection]);

  const handlePrevious = useCallback(() => {
    goToSection(currentSectionIndex - 1);
  }, [currentSectionIndex, goToSection]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        goToSection(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToSection, handleNext, handlePrevious, onClose]);

  // Finalize active visit on unmount
  useEffect(() => {
    return () => {
      // Cleanup: finalize active visit when L3 assembly view unmounts
      finalizeActiveVisit();
    };
  }, [finalizeActiveVisit]);

  // Guard: return null if no current section
  if (!currentSection) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
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
            {sections.map((section, index) => {
              const isActive = index === currentSectionIndex;
              const sectionKey = section.character as 'arch' | 'algo' | 'hum' | 'conv';
              const isRead = l3Progress?.sectionsRead[sectionKey];

              return (
                <button
                  key={index}
                  onClick={() => goToSection(index)}
                  className={`flex-1 px-3 py-2 rounded font-mono text-xs transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{section.title}</span>
                    {isRead && <span className="text-green-400 text-xs flex-shrink-0">✓</span>}
                  </div>
                </button>
              );
            })}
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
              ref={sectionRef}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <h3
                className={`text-xl font-mono mb-4 ${characterTextColors[currentSection.character as keyof typeof characterTextColors]}`}
              >
                {currentSection.title}
              </h3>
              <div className="text-xs text-gray-400 font-mono mb-6">
                {currentSection.wordCount} words
              </div>
              <div className="prose prose-invert prose-cyan max-w-none text-gray-200">
                {parseMarkdown(currentSection.content)}
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
            Use arrow keys to navigate • Press 1-4 to jump to sections • ESC to close
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
