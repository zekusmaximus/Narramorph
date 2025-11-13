import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GlitchEffectProps {
  active: boolean;
  color: string;
  onComplete?: () => void;
}

/**
 * RGB split glitch effect for transformation transitions
 */
export function GlitchEffect({ active, color, onComplete }: GlitchEffectProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [active, onComplete]);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* RGB split layers */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${color}20 0%, transparent 100%)`,
          mixBlendMode: 'screen',
        }}
        initial={{ x: 0 }}
        animate={{ x: [-10, 10, -5, 5, 0] }}
        transition={{ duration: 0.4, times: [0, 0.25, 0.5, 0.75, 1] }}
      />

      {/* Scanline sweep */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${color}40 2px,
            ${color}40 4px
          )`,
        }}
        initial={{ y: '-100%' }}
        animate={{ y: '100%' }}
        transition={{ duration: 0.6, ease: 'linear' }}
      />

      {/* Noise flash */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.5, 0] }}
        transition={{ duration: 0.3 }}
      />

      {/* Color bars */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1/3"
          style={{
            width: '100%',
            top: `${i * 33.3}%`,
            backgroundColor: color,
            mixBlendMode: 'screen',
          }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{
            x: ['100%', '100%'],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 0.4,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
