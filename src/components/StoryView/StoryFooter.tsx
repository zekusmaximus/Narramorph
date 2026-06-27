import type { ReactElement } from 'react';

import type { StoryNode, Theme } from '@/types';

import { formatReadingTime } from './storyPresentation';

interface StoryFooterProps {
  node: StoryNode;
  theme: Theme;
  timeSpent: number;
  onClose: () => void;
}

export function StoryFooter({ node, theme, timeSpent, onClose }: StoryFooterProps): ReactElement {
  return (
    <div
      className={`p-6 border-t ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Act {node.metadata.narrativeAct}
          {node.metadata.criticalPath && (
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
              Critical Path
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Reading: {formatReadingTime(timeSpent)}
          </div>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={onClose}
          >
            Back to Map
          </button>
        </div>
      </div>
    </div>
  );
}
