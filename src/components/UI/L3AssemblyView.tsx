/**
 * L3 Assembly View Component - displays the 4-section convergence assembly
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
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

    // Regex pattern for markdown bold formatting
    const boldPattern = /(\*\*|__)(.*?)\1/g;

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

type L3SectionKey = 'arch' | 'algo' | 'hum' | 'conv';

const sectionProgressKeys: Record<string, L3SectionKey> = {
  archaeologist: 'arch',
  algorithm: 'algo',
  lastHuman: 'hum',
  convergence: 'conv',
};

function getSectionProgressKey(character: string): L3SectionKey {
  const key = sectionProgressKeys[character];
  if (!key) {
    throw new Error(`Unknown L3 section character: ${character}`);
  }
  return key;
}

function getMapReturnTarget(nodeId: string | null): HTMLElement | null {
  const storyMap = document.querySelector<HTMLElement>(
    '[role="region"][aria-label="Archive passage map"]',
  );
  const selectedNode = nodeId
    ? Array.from(storyMap?.querySelectorAll<HTMLElement>('.react-flow__node[data-id]') ?? []).find(
        (element) => element.dataset.id === nodeId,
      )
    : null;

  return (
    selectedNode ??
    storyMap ??
    document.querySelector<HTMLElement>(
      '[role="application"][aria-label="Interactive passage constellation"]',
    )
  );
}

export function L3AssemblyView({ assembly, onClose }: L3AssemblyViewProps): ReactElement | null {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const selectedNode = useStoryStore((state) => state.selectedNode);
  const reduceMotion = useReducedMotionPreference();
  const markL3SectionRead = useStoryStore((state) => state.markL3SectionRead);
  const finalizeActiveVisit = useStoryStore((state) => state.finalizeActiveVisit);
  const l3Progress = useStoryStore(
    (state) => state.progress.l3AssembliesViewed?.[state.progress.l3AssembliesViewed.length - 1],
  );
  const sectionRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => getL3AssemblySections(assembly), [assembly]);
  const currentSection = sections[currentSectionIndex];
  const handleClose = useCallback(() => onClose?.(), [onClose]);
  const restoreMapFocus = useCallback(() => getMapReturnTarget(selectedNode), [selectedNode]);
  const dialogRef = useDialogFocus(true, handleClose, {
    focusKey: selectedNode ?? assembly.arch.variationId,
    initialFocusSelector: '#l3-assembly-title',
    preferFallback: true,
    restoreFocus: restoreMapFocus,
  });

  // Track section reads using IntersectionObserver
  useEffect(() => {
    if (!sectionRef.current || !currentSection || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    let timer: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Section visible - start timer
            timer = setTimeout(() => {
              const sectionKey = getSectionProgressKey(currentSection.character);
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
        const sectionKey = getSectionProgressKey(prevSection.character);
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

  const handleComplete = useCallback(() => {
    const section = sections[currentSectionIndex];
    if (section) {
      markL3SectionRead(getSectionProgressKey(section.character));
    }
    onClose?.();
  }, [currentSectionIndex, markL3SectionRead, onClose, sections]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrevious();
    } else if (['1', '2', '3', '4'].includes(event.key)) {
      event.preventDefault();
      goToSection(Number(event.key) - 1);
    }
  };

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
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/95 p-0 sm:p-4"
      onClick={onClose}
      data-testid="l3-assembly"
    >
      <motion.div
        ref={dialogRef}
        initial={reduceMotion ? false : { scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={reduceMotion ? undefined : { scale: 0.95, opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        className="flex h-full max-h-[100dvh] w-full min-w-0 max-w-4xl flex-col overflow-y-auto bg-black sm:h-auto sm:max-h-[90dvh] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="l3-assembly-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-cyan-500/30 bg-gradient-to-r from-gray-900 to-black p-4 sm:p-6">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="l3-assembly-title"
                tabIndex={-1}
                className="mb-2 break-words font-serif text-2xl text-cyan-100"
              >
                The Convergence
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
                Four recovered voices meet in a single assembled passage.
              </p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 shrink-0 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close convergence"
              >
                Close
              </button>
            )}
          </div>

          {/* Section Navigation */}
          <div
            className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"
            aria-label="Convergence sections"
          >
            {sections.map((section, index) => {
              const isActive = index === currentSectionIndex;
              const sectionKey = getSectionProgressKey(section.character);
              const isRead = l3Progress?.sectionsRead[sectionKey];

              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => goToSection(index)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-controls="l3-current-section"
                  aria-label={`${isActive ? 'Current' : 'Open'} convergence section ${index + 1}: ${section.title}${isRead ? ', read' : ''}`}
                  className={`min-h-11 min-w-0 rounded px-3 py-2 text-left text-xs transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="min-w-0 break-words">{section.title}</span>
                    {isRead && (
                      <span className="text-green-400 text-xs flex-shrink-0" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            Convergence section {currentSectionIndex + 1} of {sections.length}:{' '}
            {currentSection.title}
          </p>
        </div>

        {/* Content */}
        <div
          id="l3-current-section"
          role="region"
          aria-labelledby={`l3-section-title-${currentSectionIndex}`}
          tabIndex={0}
          className={`min-h-48 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-b ${
            characterColors[currentSection.character as keyof typeof characterColors]
          } border-2 ${characterColors[currentSection.character as keyof typeof characterColors]}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSectionIndex}
              ref={sectionRef}
              initial={reduceMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
              className="min-w-0 break-words p-4 [overflow-wrap:anywhere] sm:p-8"
            >
              <h3
                id={`l3-section-title-${currentSectionIndex}`}
                className={`text-xl font-mono mb-4 ${characterTextColors[currentSection.character as keyof typeof characterTextColors]}`}
              >
                {currentSection.title}
              </h3>
              <div className="prose prose-invert prose-cyan max-w-none text-gray-200">
                {parseMarkdown(currentSection.content)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="shrink-0 border-t border-cyan-500/30 bg-gradient-to-r from-black to-gray-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentSectionIndex === 0}
              className={`min-h-11 rounded px-4 py-2 text-sm transition-colors ${
                currentSectionIndex === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30'
              }`}
            >
              ← Previous
            </button>

            <div className="order-first w-full text-center text-sm text-gray-400 sm:order-none sm:w-auto">
              Passage {currentSectionIndex + 1} of {sections.length}
            </div>

            {currentSectionIndex === sections.length - 1 ? (
              <button
                type="button"
                onClick={handleComplete}
                className="min-h-11 rounded border border-green-500/40 px-4 py-2 text-sm text-green-300 hover:bg-green-500/10"
                data-testid="complete-convergence"
              >
                Complete Convergence ✓
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-11 rounded border border-cyan-500/30 px-4 py-2 text-sm text-cyan-400 transition-colors hover:bg-cyan-500/10"
              >
                Next →
              </button>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500 font-mono text-center">
            Use arrow keys to navigate • Press 1-4 to jump to sections • ESC to close
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
