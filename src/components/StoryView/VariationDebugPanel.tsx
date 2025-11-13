/**
 * Debug panel for variation selection system
 * Toggle with Shift+D keyboard shortcut
 */

import { useEffect, useState } from 'react';
import { useStoryStore } from '@/stores/storyStore';
import { getAwarenessLevel } from '@/utils/conditionEvaluator';
import type { VariationMetadata } from '@/types';

interface VariationDebugPanelProps {
  nodeId: string | null;
  variationId: string | null;
  variationMetadata: VariationMetadata | null;
  usedFallback: boolean;
}

/**
 * Development-only debug panel showing variation selection state in real-time
 */
export function VariationDebugPanel({
  nodeId,
  variationId,
  variationMetadata,
  usedFallback,
}: VariationDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const getConditionContext = useStoryStore((state) => state.getConditionContext);

  // Toggle visibility with Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible || !nodeId) return null;

  const context = getConditionContext(nodeId);
  const awarenessLevel = getAwarenessLevel(context.awareness);

  const handleCopy = () => {
    const debugInfo = JSON.stringify({ nodeId, variationId, context, variationMetadata }, null, 2);
    navigator.clipboard.writeText(debugInfo);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-xl max-w-md text-xs font-mono z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Variation Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
          aria-label="Close debug panel"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {/* Node Info */}
        <div className="border-b border-gray-700 pb-2">
          <div className="text-gray-400">Node ID:</div>
          <div className="text-green-400">{nodeId}</div>
        </div>

        {/* Variation Info */}
        <div className="border-b border-gray-700 pb-2">
          <div className="text-gray-400">Variation ID:</div>
          <div className={variationId ? 'text-green-400' : 'text-red-400'}>
            {variationId || 'NO VARIATION SELECTED'}
          </div>
          {usedFallback && <div className="text-yellow-400 mt-1">⚠ Using Fallback</div>}
        </div>

        {/* Condition Context */}
        <div className="border-b border-gray-700 pb-2">
          <div className="text-gray-400">Condition Context:</div>
          <div className="pl-2 space-y-1">
            <div>
              <span className="text-gray-400">Awareness:</span>{' '}
              <span className="text-blue-400">{context.awareness}</span>{' '}
              <span className="text-gray-500">({awarenessLevel})</span>
            </div>
            <div>
              <span className="text-gray-400">Journey:</span>{' '}
              <span className="text-purple-400">{context.journeyPattern}</span>
            </div>
            <div>
              <span className="text-gray-400">Philosophy:</span>{' '}
              <span className="text-indigo-400">{context.pathPhilosophy}</span>
            </div>
            <div>
              <span className="text-gray-400">Visit Count:</span>{' '}
              <span className="text-orange-400">{context.visitCount}</span>
            </div>
          </div>
        </div>

        {/* Variation Metadata */}
        {variationMetadata && (
          <div className="border-b border-gray-700 pb-2">
            <div className="text-gray-400">Variation Metadata:</div>
            <div className="pl-2 space-y-1">
              <div>
                <span className="text-gray-400">Awareness Range:</span>{' '}
                <span className="text-blue-400">
                  {variationMetadata.awarenessRange[0]}-{variationMetadata.awarenessRange[1]}
                </span>
              </div>
              {variationMetadata.journeyPattern &&
                variationMetadata.journeyPattern !== 'unknown' && (
                  <div>
                    <span className="text-gray-400">Required Journey:</span>{' '}
                    <span className="text-purple-400">{variationMetadata.journeyPattern}</span>
                  </div>
                )}
              {variationMetadata.philosophyDominant &&
                variationMetadata.philosophyDominant !== 'unknown' && (
                  <div>
                    <span className="text-gray-400">Required Philosophy:</span>{' '}
                    <span className="text-indigo-400">{variationMetadata.philosophyDominant}</span>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Character Visit Percentages */}
        <div>
          <div className="text-gray-400">Character Visits:</div>
          <div className="pl-2 space-y-1">
            {Object.entries(context.characterVisitPercentages).map(([char, pct]) => (
              <div key={char}>
                <span className="text-gray-400">{char}:</span>{' '}
                <span className="text-cyan-400">{pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full mt-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-center"
        >
          Copy Debug Info
        </button>
      </div>

      <div className="text-gray-500 text-center mt-2">Press Shift+D to toggle</div>
    </div>
  );
}
