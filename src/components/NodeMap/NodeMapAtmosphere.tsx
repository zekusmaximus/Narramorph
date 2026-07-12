import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import type { StoryNode } from '@/types';

import { DiscoveryOverlay } from './DiscoveryOverlay';
import { NeuralNetwork } from './NeuralNetwork';
import { ParallaxBackground } from './ParallaxBackground';
import { ReadingPathTrail } from './ReadingPathTrail';

const ZONE_COLORS = {
  archaeologist: 'rgba(0, 229, 255, 0.03)',
  algorithm: 'rgba(57, 255, 20, 0.03)',
  'last-human': 'rgba(211, 47, 47, 0.03)',
  'multi-perspective': 'rgba(156, 39, 176, 0.03)',
} as const;

interface NodeMapAtmosphereProps {
  storyNodes: Map<string, StoryNode>;
  mousePosition: { x: number; y: number };
  viewportZoom: number;
  showFogOfWar: boolean;
  showTrail: boolean;
}

export function NodeMapAtmosphere({
  storyNodes,
  mousePosition,
  viewportZoom,
  showFogOfWar,
  showTrail,
}: NodeMapAtmosphereProps): ReactElement {
  const reduceMotion = useReducedMotionPreference();

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
      {!reduceMotion && (
        <div className="hidden md:block">
          <ParallaxBackground mouseX={mousePosition.x} mouseY={mousePosition.y} />
        </div>
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(10, 14, 18, 0.8) 100%)',
        }}
      />
      {showFogOfWar && <DiscoveryOverlay />}

      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {Array.from(storyNodes.values()).map((node) => (
            <motion.div
              key={`zone-${node.id}`}
              className="absolute rounded-full"
              style={{
                width: 320,
                height: 320,
                left: node.position.x - 160,
                top: node.position.y - 160,
                background: `radial-gradient(circle, ${ZONE_COLORS[node.character]} 0%, transparent 72%)`,
                filter: 'blur(48px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 1.2 }}
            />
          ))}
        </div>
      )}

      {!reduceMotion && showTrail && (
        <div className="hidden lg:block">
          <ReadingPathTrail />
        </div>
      )}
      {!reduceMotion && viewportZoom > 0.55 && (
        <div className="hidden xl:block">
          <NeuralNetwork />
        </div>
      )}

      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 hidden xl:block">
          {Array.from({ length: 6 }, (_, index) => (
            <motion.div
              key={index}
              className="absolute w-0.5 h-0.5 rounded-full bg-cyan-400/20"
              style={{
                left: `${(index * 37) % 100}%`,
                top: `${(index * 61) % 100}%`,
              }}
              animate={{ y: [0, -600], opacity: [0, 0.18, 0] }}
              transition={{
                duration: 10 + (index % 5),
                repeat: Infinity,
                delay: index * 0.5,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
