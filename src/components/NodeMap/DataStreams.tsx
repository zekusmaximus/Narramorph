import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useStoryStore } from '@/stores/storyStore';

/**
 * Animated data packets flowing along connection lines
 */
export function DataStreams() {
  const nodes = useStoryStore(state => state.nodes);
  const selectedNode = useStoryStore(state => state.selectedNode);

  // Get connections from selected node
  const activeConnections = useMemo(() => {
    if (!selectedNode) return [];

    const node = nodes.get(selectedNode);
    if (!node || !node.connections) return [];

    return node.connections.map(conn => {
      const targetNode = nodes.get(conn.targetId);
      if (!targetNode) return null;

      return {
        from: node.position,
        to: targetNode.position,
        type: conn.type,
      };
    }).filter(Boolean);
  }, [selectedNode, nodes]);

  if (activeConnections.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none">
      <defs>
        <filter id="dataGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {activeConnections.map((conn, i) => {
        if (!conn) return null;

        const colors = {
          temporal: '#00e5ff',
          consciousness: '#7c4dff',
          recursive: '#39ff14',
          hidden: '#455a64',
        };
        const color = colors[conn.type] || '#00e5ff';

        return (
          <g key={i}>
            {/* Multiple particles along path */}
            {[...Array(3)].map((_, j) => (
              <motion.g key={j}>
                {/* Main particle */}
                <motion.circle
                  r="4"
                  fill={color}
                  filter="url(#dataGlow)"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: j * 0.6,
                    repeat: Infinity,
                    repeatDelay: 0.2,
                  }}
                >
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    begin={`${j * 0.6}s`}
                    path={`M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`}
                  />
                </motion.circle>

                {/* Trail effect */}
                <motion.circle
                  r="2"
                  fill={color}
                  opacity="0.5"
                  filter="url(#dataGlow)"
                >
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    begin={`${j * 0.6 + 0.1}s`}
                    path={`M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`}
                  />
                </motion.circle>
              </motion.g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
