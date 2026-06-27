import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import type { StoryNode } from '@/types';

import { DataStreams } from './DataStreams';
import { DiscoveryOverlay } from './DiscoveryOverlay';
import { MemoryFragments } from './MemoryFragments';
import { NeuralNetwork } from './NeuralNetwork';
import { ParallaxBackground } from './ParallaxBackground';
import { ReadingPathTrail } from './ReadingPathTrail';
import { TemporalDistortion } from './TemporalDistortion';

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
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
      <ParallaxBackground
        mouseX={reduceMotion ? 0 : mousePosition.x}
        mouseY={reduceMotion ? 0 : mousePosition.y}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(10, 14, 18, 0.8) 100%)',
        }}
      />
      {showFogOfWar && <DiscoveryOverlay />}

      <div className="absolute inset-0 pointer-events-none">
        {Array.from(storyNodes.values()).map((node) => (
          <motion.div
            key={`zone-${node.id}`}
            className="absolute rounded-full"
            style={{
              width: 400,
              height: 400,
              left: node.position.x - 200,
              top: node.position.y - 200,
              background: `radial-gradient(circle, ${ZONE_COLORS[node.character]} 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          />
        ))}
      </div>

      {!reduceMotion && <MemoryFragments />}
      {showTrail && <ReadingPathTrail />}
      {viewportZoom > 0.3 && <NeuralNetwork />}
      {viewportZoom > 0.5 && <TemporalDistortion />}
      <DataStreams />

      {!reduceMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 15 }, (_, index) => (
            <motion.div
              key={index}
              className="absolute w-0.5 h-0.5 rounded-full bg-cyan-400/20"
              style={{
                left: `${(index * 37) % 100}%`,
                top: `${(index * 61) % 100}%`,
              }}
              animate={{ y: [0, -800], opacity: [0, 0.3, 0] }}
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
