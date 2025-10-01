import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useStoryStore } from '@/stores/storyStore';

interface Fragment {
  id: string;
  text: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  color: string;
}

/**
 * Floating memory fragments from visited nodes
 */
export function MemoryFragments() {
  const progress = useStoryStore(state => state.progress);
  const nodes = useStoryStore(state => state.nodes);

  // Generate fragments from visited nodes
  const fragments = useMemo(() => {
    const visited = Object.keys(progress.visitedNodes);
    if (visited.length === 0) return [];

    return visited.slice(0, 8).map((nodeId, i) => {
      const node = nodes.get(nodeId);
      if (!node) return null;

      // Extract fragment from content
      const content = node.content.initial || '';
      const words = content.split(' ').filter(w => w.length > 4);
      const randomWord = words[Math.floor(Math.random() * Math.min(words.length, 20))] || 'memory';

      // Character-specific colors
      const colors = {
        archaeologist: '#00e5ff',
        algorithm: '#39ff14',
        human: '#d32f2f',
      };

      return {
        id: `${nodeId}-${i}`,
        text: randomWord.substring(0, 15),
        x: Math.random() * 80 + 10, // 10-90% across screen
        y: Math.random() * 80 + 10, // 10-90% down screen
        delay: i * 2,
        duration: 20 + Math.random() * 10,
        color: colors[node.character] || '#00e5ff',
      };
    }).filter(Boolean) as Fragment[];
  }, [progress.visitedNodes, nodes]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {fragments.map((fragment) => (
        <motion.div
          key={fragment.id}
          className="absolute text-xs font-mono opacity-20"
          style={{
            color: fragment.color,
            textShadow: `0 0 10px ${fragment.color}`,
            left: `${fragment.x}%`,
            top: `${fragment.y}%`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.3, 0.2, 0],
            y: [0, -100, -200],
            x: [0, Math.random() * 20 - 10],
          }}
          transition={{
            duration: fragment.duration,
            delay: fragment.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {fragment.text}...
        </motion.div>
      ))}
    </div>
  );
}
