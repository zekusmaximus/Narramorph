import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import type { DiscoveryPoint } from './atmospherePresentation';

export function DiscoveryOverlay({
  points,
  reduceMotion,
}: {
  points: DiscoveryPoint[];
  reduceMotion: boolean;
}): ReactElement {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-black/40" />
      <svg className="absolute inset-0" style={{ mixBlendMode: 'normal' }}>
        <defs>
          <radialGradient id="reveal">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="60%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="1" />
          </radialGradient>
          <mask id="revealMask">
            <rect width="100%" height="100%" fill="white" />
            {points.map((area) => (
              <motion.circle
                key={area.key}
                cx={area.x}
                cy={area.y}
                r={reduceMotion ? 200 : 0}
                fill="black"
                initial={{ r: reduceMotion ? 200 : 0 }}
                animate={{ r: 200 }}
                transition={{ duration: reduceMotion ? 0 : 1, ease: 'easeOut' }}
              />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="transparent" mask="url(#revealMask)" />
      </svg>
    </div>
  );
}
