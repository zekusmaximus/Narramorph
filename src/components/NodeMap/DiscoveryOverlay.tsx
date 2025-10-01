import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useStoryStore } from '@/stores/storyStore';

/**
 * Gradually reveals map as nodes are discovered
 */
export function DiscoveryOverlay() {
  const nodes = useStoryStore(state => state.nodes);
  const progress = useStoryStore(state => state.progress);

  // Create revealed areas around visited nodes
  const revealedAreas = useMemo(() => {
    return Object.keys(progress.visitedNodes).map(nodeId => {
      const node = nodes.get(nodeId);
      if (!node) return null;

      return {
        x: node.position.x,
        y: node.position.y,
        character: node.character,
      };
    }).filter(Boolean);
  }, [progress.visitedNodes, nodes]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Revealed circles around visited nodes */}
      <svg className="absolute inset-0" style={{ mixBlendMode: 'normal' }}>
        <defs>
          <radialGradient id="reveal">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="60%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="1" />
          </radialGradient>
          <mask id="revealMask">
            <rect width="100%" height="100%" fill="white" />
            {revealedAreas.map((area, i) => {
              if (!area) return null;
              return (
                <motion.circle
                  key={i}
                  cx={area.x}
                  cy={area.y}
                  r="0"
                  fill="black"
                  initial={{ r: 0 }}
                  animate={{ r: 200 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              );
            })}
          </mask>
        </defs>

        <rect width="100%" height="100%" fill="transparent" mask="url(#revealMask)" />
      </svg>
    </div>
  );
}
