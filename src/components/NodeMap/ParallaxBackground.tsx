import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface ParallaxBackgroundProps {
  mouseX: number;
  mouseY: number;
}

/**
 * Multi-layered parallax background that responds to mouse movement
 */
export function ParallaxBackground({ mouseX, mouseY }: ParallaxBackgroundProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    x.set(mouseX);
    y.set(mouseY);
  }, [mouseX, mouseY, x, y]);

  // Different layers move at different speeds
  const layer1X = useTransform(x, [0, window.innerWidth], [-10, 10]);
  const layer1Y = useTransform(y, [0, window.innerHeight], [-10, 10]);

  const layer2X = useTransform(x, [0, window.innerWidth], [-20, 20]);
  const layer2Y = useTransform(y, [0, window.innerHeight], [-20, 20]);

  const layer3X = useTransform(x, [0, window.innerWidth], [-30, 30]);
  const layer3Y = useTransform(y, [0, window.innerHeight], [-30, 30]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep background layer - slowest movement */}
      <motion.div
        className="absolute inset-0"
        style={{
          x: layer1X,
          y: layer1Y,
          background: `radial-gradient(circle at 20% 30%, rgba(0, 229, 255, 0.02) 0%, transparent 50%),
                       radial-gradient(circle at 80% 70%, rgba(57, 255, 20, 0.02) 0%, transparent 50%),
                       radial-gradient(circle at 50% 90%, rgba(211, 47, 47, 0.02) 0%, transparent 50%)`,
        }}
      />

      {/* Middle layer - medium movement */}
      <motion.div className="absolute inset-0" style={{ x: layer2X, y: layer2Y }}>
        {/* Floating hexagons */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 30) % 100}%`,
              top: `${(i * 37) % 100}%`,
              width: 40,
              height: 40,
            }}
            animate={{
              rotate: [0, 360],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon
                points="50 5, 95 27.5, 95 72.5, 50 95, 5 72.5, 5 27.5"
                fill="none"
                stroke="#00e5ff"
                strokeWidth="1"
                opacity="0.15"
              />
            </svg>
          </motion.div>
        ))}
      </motion.div>

      {/* Foreground layer - fastest movement */}
      <motion.div className="absolute inset-0" style={{ x: layer3X, y: layer3Y }}>
        {/* Scanning lines */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
            style={{
              width: '100%',
              top: `${i * 20}%`,
            }}
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
