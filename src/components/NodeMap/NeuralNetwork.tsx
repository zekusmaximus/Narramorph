import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { useStoryStore } from '@/stores/storyStore';

/**
 * Draws neural connections between algorithm nodes
 */
export function NeuralNetwork() {
  const nodes = useStoryStore((state) => state.nodes);
  const progress = useStoryStore((state) => state.progress);

  // Find algorithm nodes that have been visited
  const algorithmNodes = useMemo(() => {
    return Array.from(nodes.values()).filter(
      (node) => node.character === 'algorithm' && progress.visitedNodes[node.id],
    );
  }, [nodes, progress.visitedNodes]);

  if (algorithmNodes.length < 2) {
    return null;
  }

  return (
    <svg className="absolute inset-0 pointer-events-none">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Draw neural connections between all algorithm nodes */}
      {algorithmNodes.map((node1, i) =>
        algorithmNodes.slice(i + 1).map((node2, j) => {
          // Create a curved path
          const midX = (node1.position.x + node2.position.x) / 2;
          const midY = (node1.position.y + node2.position.y) / 2;
          const offset = 50;

          return (
            <g key={`${node1.id}-${node2.id}`}>
              {/* Main connection line */}
              <motion.path
                d={`M ${node1.position.x} ${node1.position.y} Q ${midX} ${midY - offset} ${node2.position.x} ${node2.position.y}`}
                fill="none"
                stroke="#39ff14"
                strokeWidth="1"
                opacity="0.2"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: j * 0.2 }}
              />

              {/* Pulse traveling along path */}
              <circle r="3" fill="#39ff14" filter="url(#glow)">
                <animateMotion
                  dur={`${3 + j}s`}
                  repeatCount="indefinite"
                  path={`M ${node1.position.x} ${node1.position.y} Q ${midX} ${midY - offset} ${node2.position.x} ${node2.position.y}`}
                />
              </circle>
            </g>
          );
        }),
      )}

      {/* Neural nodes at positions */}
      {algorithmNodes.map((node, i) => (
        <motion.circle
          key={node.id}
          cx={node.position.x}
          cy={node.position.y}
          r={4}
          fill="#39ff14"
          opacity={0.4}
          filter="url(#glow)"
          initial={{
            r: 4,
            opacity: 0.4,
          }}
          animate={{
            r: [4, 6, 4],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </svg>
  );
}
