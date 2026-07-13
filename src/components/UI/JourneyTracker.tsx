import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactElement } from 'react';

import { ConnectionHeatmap } from './JourneyTracker/ConnectionHeatmap';
import { JourneyMetrics } from './JourneyTracker/JourneyMetrics';
import type { JourneyTrackerPresentationModel } from './JourneyTracker/journeyTrackerPresentation';
import { NavigationPatternInsight } from './JourneyTracker/NavigationPatternInsight';
import { NextUnlockPreview } from './JourneyTracker/NextUnlockPreview';
import { useJourneyTrackerAdapter } from './JourneyTracker/useJourneyTrackerAdapter';

interface JourneyTrackerPanelProps {
  model: JourneyTrackerPresentationModel;
}

export function JourneyTracker(): ReactElement {
  return <JourneyTrackerPanel model={useJourneyTrackerAdapter()} />;
}

export function JourneyTrackerPanel({ model }: JourneyTrackerPanelProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="journey-tracker bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg overflow-hidden">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="journey-tracker-details"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="w-full p-4 text-left hover:bg-cyan-500/10 transition-colors flex items-center justify-between"
      >
        <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-wider">
          Journey Tracking
        </h3>
        <svg
          className={`w-5 h-5 text-cyan-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="journey-tracker-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              <JourneyMetrics progress={model.progress} />
              <ConnectionHeatmap
                rows={model.connectionRows}
                hasFullNetwork={model.hasFullConsciousnessNetwork}
              />
              <NavigationPatternInsight model={model.navigationPattern} />
              <NextUnlockPreview items={model.nextUnlocks} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
