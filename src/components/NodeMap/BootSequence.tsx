import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

/**
 * System boot animation when first loading story
 */
export function BootSequence({ onComplete }: BootSequenceProps) {
  const [show, setShow] = useState(true);
  const [currentLine, setCurrentLine] = useState(0);

  const bootLines = [
    'INITIALIZING NARRATIVE SYSTEM...',
    'LOADING MEMORY ARCHIVES...',
    'CONNECTING NEURAL PATHWAYS...',
    'ESTABLISHING TEMPORAL LINKS...',
    'SYSTEM READY',
  ];

  useEffect(() => {
    if (currentLine < bootLines.length - 1) {
      const timer = setTimeout(() => {
        setCurrentLine((prev) => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShow(false);
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentLine, bootLines.length, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center font-mono"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-2 text-cyan-400 text-sm">
            {bootLines.slice(0, currentLine + 1).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-2"
              >
                <span className="text-green-400">{'>'}</span>
                <span>{line}</span>
                {i === currentLine && (
                  <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                    _
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
