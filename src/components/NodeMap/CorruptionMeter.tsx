import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { useStoryStore } from '@/stores/storyStore';

/**
 * Visual indicator of story recursion/corruption level
 */
export function CorruptionMeter() {
  const stats = useStoryStore((state) => state.getReadingStats());

  // Calculate corruption based on transformations experienced
  const corruptionLevel = useMemo(() => {
    // Using transformationsAvailable as a proxy for corruption
    return Math.min(Math.round((stats.transformationsAvailable / 20) * 100), 100);
  }, [stats]);

  const corruptionColor = useMemo(() => {
    if (corruptionLevel < 30) {
      return '#00e5ff';
    } // Low - cyan
    if (corruptionLevel < 70) {
      return '#ffa726';
    } // Medium - amber
    return '#d32f2f'; // High - red
  }, [corruptionLevel]);

  return (
    <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm px-4 py-3 rounded border border-gray-700/50 shadow-lg font-mono">
      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">System Integrity</div>

      {/* Corruption bar */}
      <div className="w-40 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div
          className="h-full"
          style={{
            background: `linear-gradient(90deg, ${corruptionColor}, ${corruptionColor}80)`,
            boxShadow: `0 0 10px ${corruptionColor}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${100 - corruptionLevel}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-gray-500">CORRUPTION</span>
        <motion.span
          style={{ color: corruptionColor }}
          animate={{
            opacity: corruptionLevel > 70 ? [1, 0.5, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: corruptionLevel > 70 ? Infinity : 0,
          }}
        >
          {corruptionLevel}%
        </motion.span>
      </div>

      {/* Warning message at high corruption */}
      {corruptionLevel > 70 && (
        <motion.div
          className="mt-2 text-[10px] text-red-400 border-t border-red-900/30 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ⚠ MEMORY DEGRADATION DETECTED
        </motion.div>
      )}
    </div>
  );
}
