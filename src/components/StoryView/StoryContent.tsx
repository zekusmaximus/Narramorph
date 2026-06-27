import { AnimatePresence, motion } from 'framer-motion';
import type { ReactElement } from 'react';

import type { TextSize, Theme, TransformationState } from '@/types';

import { MarkdownContent } from './MarkdownContent';

interface StoryContentProps {
  content: string;
  transformationState: TransformationState;
  textSize: TextSize;
  theme: Theme;
}

export function StoryContent({
  content,
  transformationState,
  textSize,
  theme,
}: StoryContentProps): ReactElement {
  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className={`p-8 max-w-3xl mx-auto
          ${textSize === 'small' ? 'text-sm' : ''}
          ${textSize === 'medium' ? 'text-base' : ''}
          ${textSize === 'large' ? 'text-lg' : ''}
          ${theme === 'sepia' ? 'bg-amber-50 text-amber-900' : ''}
          ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : ''}
          ${theme === 'light' ? 'bg-white text-gray-900' : ''}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={transformationState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="prose prose-gray max-w-none leading-loose"
          >
            <MarkdownContent content={content} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
