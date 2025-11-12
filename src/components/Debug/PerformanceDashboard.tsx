/**
 * Performance Dashboard Component (Development Only)
 *
 * Displays real-time performance metrics for optimization
 * Toggle with Shift+P
 */

import { useState, useEffect } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';

export function PerformanceDashboard() {
  const [stats, setStats] = useState<Record<string, any>>({});
  const [isVisible, setIsVisible] = useState(false);

  // Toggle with Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update stats every second
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const operations = performanceMonitor.getOperations();
      const newStats: Record<string, any> = {};

      for (const op of operations) {
        newStats[op] = performanceMonitor.getStats(op);
      }

      setStats(newStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 w-96 bg-black/95 border border-cyan-500/30 rounded p-4 font-mono text-xs z-50 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-cyan-400 font-bold">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {Object.entries(stats).map(([operation, data]) => (
          <div key={operation} className="border-b border-gray-700 pb-2">
            <div className="text-white font-bold mb-1">{operation}</div>
            <div className="grid grid-cols-2 gap-1 text-gray-400">
              <div>Calls: {data.count}</div>
              <div>Avg: {data.avg.toFixed(2)}ms</div>
              <div>P95: {data.p95.toFixed(2)}ms</div>
              <div>Max: {data.max.toFixed(2)}ms</div>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(stats).length === 0 && (
        <div className="text-gray-500 text-center py-4">
          No performance data yet
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700">
        <button
          onClick={() => performanceMonitor.logSummary()}
          className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white"
        >
          Log Summary to Console
        </button>
      </div>

      <div className="text-gray-500 text-[10px] mt-2 text-center">
        Press Shift+P to toggle
      </div>
    </div>
  );
}
