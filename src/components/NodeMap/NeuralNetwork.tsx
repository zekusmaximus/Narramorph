import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import type { NeuralNetworkPoint } from './atmospherePresentation';

export function NeuralNetwork({
  points,
  reduceMotion,
}: {
  points: NeuralNetworkPoint[];
  reduceMotion: boolean;
}): ReactElement | null {
  if (points.length < 2) {
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
      {points.map((node1, i) =>
        points.slice(i + 1).map((node2, j) => {
          const midX = (node1.x + node2.x) / 2;
          const midY = (node1.y + node2.y) / 2;
          const path = `M ${node1.x} ${node1.y} Q ${midX} ${midY - 50} ${node2.x} ${node2.y}`;
          return (
            <g key={`${node1.id}-${node2.id}`}>
              <motion.path
                d={path}
                fill="none"
                stroke="#39ff14"
                strokeWidth="1"
                opacity="0.2"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: j * 0.2 }}
              />
              {!reduceMotion && (
                <circle r="3" fill="#39ff14" filter="url(#glow)">
                  <animateMotion dur={`${3 + j}s`} repeatCount="indefinite" path={path} />
                </circle>
              )}
            </g>
          );
        }),
      )}
      {points.map((node, i) => (
        <motion.circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r={4}
          fill="#39ff14"
          opacity={0.4}
          filter="url(#glow)"
          initial={{ r: 4, opacity: 0.4 }}
          animate={
            reduceMotion ? { r: 4, opacity: 0.4 } : { r: [4, 6, 4], opacity: [0.4, 0.7, 0.4] }
          }
          transition={{
            duration: reduceMotion ? 0 : 2,
            repeat: reduceMotion ? 0 : Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </svg>
  );
}
