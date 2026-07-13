import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import type { ReadingPathPoint } from './atmospherePresentation';

const COLORS = {
  archaeologist: '#00e5ff',
  algorithm: '#39ff14',
  'last-human': '#d32f2f',
  'multi-perspective': '#9c27b0',
} as const;

export function ReadingPathTrail({ points }: { points: ReadingPathPoint[] }): ReactElement | null {
  if (points.length === 0) {
    return null;
  }
  return (
    <svg className="absolute inset-0 pointer-events-none">
      <motion.path
        d={`M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`}
        fill="none"
        stroke="#455a64"
        strokeWidth="2"
        strokeDasharray="4,4"
        opacity="0.3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      {points.map((pos, i) => (
        <motion.circle
          key={pos.key}
          cx={pos.x}
          cy={pos.y}
          r="30"
          fill={COLORS[pos.character]}
          opacity={pos.opacity}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
    </svg>
  );
}
