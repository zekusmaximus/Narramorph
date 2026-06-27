import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import { CorruptionMeter } from './CorruptionMeter';
import { GlitchEffect } from './GlitchEffect';
import { NodeTooltip } from './NodeTooltip';

interface NodeMapHudProps {
  totalNodes: number;
  visitedCount: number;
  glitchActive: boolean;
  glitchColor: string;
  hoveredNodeId: string | null;
  tooltipPosition: { x: number; y: number };
}

export function NodeMapHud({
  totalNodes,
  visitedCount,
  glitchActive,
  glitchColor,
  hoveredNodeId,
  tooltipPosition,
}: NodeMapHudProps): ReactElement {
  return (
    <>
      <motion.div
        className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm px-4 py-3 rounded border border-cyan-500/30 shadow-lg shadow-cyan-500/20 font-mono max-w-xs pointer-events-none"
        animate={{
          boxShadow: [
            '0 0 20px rgba(0, 229, 255, 0.2)',
            '0 0 30px rgba(0, 229, 255, 0.3)',
            '0 0 20px rgba(0, 229, 255, 0.2)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="text-xs text-cyan-400 mb-2 tracking-wider border-b border-cyan-500/30 pb-2"
          animate={{ opacity: [1, 0.8, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          STORY.EXE
        </motion.div>
        <div className="text-xs text-gray-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">NODES:</span>
            <motion.span
              className="text-cyan-400 font-semibold"
              key={visitedCount}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              [{visitedCount.toString().padStart(2, '0')}/{totalNodes.toString().padStart(2, '0')}]
            </motion.span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">LOADED:</span>
            <span className="text-green-400 font-semibold">
              {totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">STATE:</span>
            <span className="text-purple-400 font-semibold text-[10px]">
              {visitedCount === 0 ? 'INITIAL' : 'ACTIVE'}
            </span>
          </div>
        </div>
        <div className="text-xs text-cyan-400 mt-2 pt-2 border-t border-cyan-500/30">
          └────────────────────────┘
        </div>
      </motion.div>

      <CorruptionMeter />
      <div className="absolute bottom-20 left-4 bg-black/90 backdrop-blur-sm px-4 py-3 rounded border border-gray-700/50 shadow-lg font-mono pointer-events-none">
        <div className="text-xs font-semibold text-gray-400 mb-2 tracking-wider uppercase">
          Characters
        </div>
        <div className="space-y-1.5 text-xs">
          {[
            {
              label: 'Archaeologist 🔍',
              className: 'from-cyan-400 to-teal-700',
              glow: '#00e5ff',
            },
            {
              label: 'Algorithm 🧠',
              className: 'from-green-400 to-purple-600',
              glow: '#39ff14',
            },
            {
              label: 'Human 👤',
              className: 'from-red-600 to-red-900',
              glow: '#d32f2f',
            },
          ].map(({ label, className, glow }) => (
            <div key={label} className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full bg-gradient-to-br ${className}`}
                style={{ boxShadow: `0 0 8px ${glow}` }}
              />
              <span className="text-gray-300">{label}</span>
            </div>
          ))}
        </div>
        <div className="text-xs font-semibold text-gray-400 mb-2 mt-3 tracking-wider uppercase">
          Connections
        </div>
        <div className="space-y-1.5 text-xs">
          {[
            { label: 'Temporal', color: '#00e5ff', dashed: false },
            { label: 'Consciousness', color: '#7c4dff', dashed: false },
            { label: 'Recursive', color: '#39ff14', dashed: true },
          ].map(({ label, color, dashed }) => (
            <div key={label} className="flex items-center space-x-2">
              <div
                className="w-4 h-0.5"
                style={{
                  background: dashed
                    ? `repeating-linear-gradient(to right, ${color} 0, ${color} 3px, transparent 3px, transparent 8px)`
                    : color,
                  boxShadow: `0 0 4px ${color}`,
                }}
              />
              <span className="text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <GlitchEffect active={glitchActive} color={glitchColor} />
      <NodeTooltip nodeId={hoveredNodeId} position={tooltipPosition} />
    </>
  );
}
