import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useStoryStore } from '@/stores/storyStore';

/**
 * Creates temporal distortion around meta-aware nodes
 */
export function TemporalDistortion() {
  const nodes = useStoryStore(state => state.nodes);
  const getNodeState = useStoryStore(state => state.getNodeState);

  // Find meta-aware nodes
  const metaAwareNodes = useMemo(() => {
    return Array.from(nodes.values())
      .map(node => ({
        node,
        state: getNodeState(node.id),
      }))
      .filter(({ state }) => state.currentState === 'metaAware');
  }, [nodes, getNodeState]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {metaAwareNodes.map(({ node }) => {
        const colors = {
          archaeologist: '#00e5ff',
          algorithm: '#39ff14',
          human: '#d32f2f',
        };
        const color = colors[node.character];

        return (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: node.position.x,
              top: node.position.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Concentric time ripples */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border"
                style={{
                  borderColor: color,
                  opacity: 0.2,
                }}
                animate={{
                  width: [100, 200, 300],
                  height: [100, 200, 300],
                  opacity: [0.3, 0.1, 0],
                  borderWidth: [2, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.75,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Time fragments orbiting */}
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60) * Math.PI / 180;
              const radius = 80;

              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-4"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                  animate={{
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    rotate: [0, 360],
                    opacity: [0.6, 0.3, 0.6],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: i * 0.1,
                  }}
                />
              );
            })}

            {/* Clock digits */}
            <motion.div
              className="absolute font-mono text-xs"
              style={{
                color: color,
                textShadow: `0 0 10px ${color}`,
                top: -60,
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              {['T+∞', 'T-∞', 'T=0'][Math.floor(Math.random() * 3)]}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
