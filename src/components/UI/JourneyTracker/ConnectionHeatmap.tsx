import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import type { ConnectionHeatmapRow } from './journeyTrackerPresentation';

interface ConnectionHeatmapProps {
  rows: ConnectionHeatmapRow[];
  hasFullNetwork: boolean;
}

export function ConnectionHeatmap({ rows, hasFullNetwork }: ConnectionHeatmapProps): ReactElement {
  return (
    <div className="mt-4 p-3 bg-gray-900/40 border border-cyan-500/20 rounded">
      <div className="text-xs text-cyan-400 mb-3 font-mono uppercase tracking-wider">
        Cross-Character Connections
      </div>
      <div className="space-y-2">
        {rows.map((connection) => (
          <div key={`${connection.from}-${connection.to}`} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-gray-400">
                {connection.from} ↔ {connection.to}
              </span>
              <span className="text-gray-300 font-bold">{connection.count}×</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${connection.widthPercent}%`,
                }}
                transition={{ duration: 0.5 }}
                className={`h-full bg-gradient-to-r ${connection.color}`}
              />
            </div>
          </div>
        ))}
      </div>
      {hasFullNetwork && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 pt-3 border-t border-cyan-500/20"
        >
          <div className="flex items-center space-x-2 text-cyan-400 text-xs">
            <span className="text-lg">✦</span>
            <span>Full consciousness network achieved</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
