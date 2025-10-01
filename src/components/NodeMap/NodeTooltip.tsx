import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/stores/storyStore';

interface NodeTooltipProps {
  nodeId: string | null;
  position: { x: number; y: number };
}

/**
 * Shows detailed node info on hover
 */
export function NodeTooltip({ nodeId, position }: NodeTooltipProps) {
  const nodes = useStoryStore(state => state.nodes);
  const getNodeState = useStoryStore(state => state.getNodeState);

  if (!nodeId) return null;

  const node = nodes.get(nodeId);
  if (!node) return null;

  const state = getNodeState(nodeId);

  const colors = {
    archaeologist: '#00e5ff',
    algorithm: '#39ff14',
    human: '#d32f2f',
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed pointer-events-none z-50"
        style={{
          left: position.x + 20,
          top: position.y + 20,
        }}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        <div
          className="bg-black/95 backdrop-blur-sm px-4 py-3 rounded border shadow-lg font-mono text-xs max-w-xs"
          style={{
            borderColor: `${colors[node.character]}40`,
            boxShadow: `0 0 20px ${colors[node.character]}20`,
          }}
        >
          <div
            className="font-semibold mb-2 uppercase tracking-wider"
            style={{ color: colors[node.character] }}
          >
            {node.title}
          </div>

          <div className="space-y-1 text-gray-400">
            <div className="flex justify-between">
              <span>Character:</span>
              <span className="text-gray-300">{node.character}</span>
            </div>
            <div className="flex justify-between">
              <span>State:</span>
              <span className="text-gray-300">{state.currentState}</span>
            </div>
            <div className="flex justify-between">
              <span>Visits:</span>
              <span className="text-gray-300">{state.visitCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Read Time:</span>
              <span className="text-gray-300">{node.metadata.estimatedReadTime}m</span>
            </div>
            {node.metadata.criticalPath && (
              <div className="text-yellow-400 text-[10px] mt-2 pt-2 border-t border-yellow-900/30">
                ⚠ CRITICAL PATH NODE
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
