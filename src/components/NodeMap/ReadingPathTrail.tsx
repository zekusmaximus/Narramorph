import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useStoryStore } from '@/stores/storyStore';

/**
 * Visualizes the user's reading path as a ghost trail
 */
export function ReadingPathTrail() {
  const readingPath = useStoryStore(state => state.progress.readingPath);
  const nodes = useStoryStore(state => state.nodes);

  // Get positions of last 5 visited nodes
  const pathPositions = useMemo(() => {
    return readingPath
      .slice(-5)
      .map(nodeId => nodes.get(nodeId))
      .filter((node): node is NonNullable<typeof node> => node !== undefined)
      .map((node, index) => ({
        x: node.position.x,
        y: node.position.y,
        character: node.character,
        opacity: 0.1 + (index * 0.1), // Fade from oldest to newest
      }));
  }, [readingPath, nodes]);

  if (pathPositions.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none">
      {/* Draw path line */}
      <motion.path
        d={`M ${pathPositions.map(p => `${p.x},${p.y}`).join(' L ')}`}
        fill="none"
        stroke="#455a64"
        strokeWidth="2"
        strokeDasharray="4,4"
        opacity="0.3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Ghost nodes at previous positions */}
      {pathPositions.map((pos, i) => {
        const colors = {
          archaeologist: '#00e5ff',
          algorithm: '#39ff14',
          human: '#d32f2f',
        };

        return (
          <motion.circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r="30"
            fill={colors[pos.character]}
            opacity={pos.opacity}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: i * 0.1 }}
          />
        );
      })}
    </svg>
  );
}
