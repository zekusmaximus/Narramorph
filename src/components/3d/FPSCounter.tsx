import { useEffect, useState } from 'react';

/**
 * FPS counter component for development mode only
 * Displays current frames per second in the top-right corner
 */
export default function FPSCounter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    // Only run in development mode
    if (!import.meta.env.DEV) return undefined;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const updateFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const delta = currentTime - lastTime;

      // Update FPS every second
      if (delta >= 1000) {
        setFps(Math.round((frameCount * 1000) / delta));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Don't render in production
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed top-4 right-4 z-100 bg-black/70 text-white px-3 py-1.5 rounded-lg font-mono text-sm backdrop-blur-sm pointer-events-none">
      <span className="text-gray-400">FPS:</span>{' '}
      <span
        className={fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}
      >
        {fps}
      </span>
    </div>
  );
}
