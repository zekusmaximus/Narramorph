import type { ReactElement } from 'react';

import type { StoryNode, Theme } from '@/types';

interface StoryFooterProps {
  theme: Theme;
  continuationNodes: StoryNode[];
  onContinue: (nodeId: string) => void;
  onClose: () => void;
}

export function StoryFooter({
  theme,
  continuationNodes,
  onContinue,
  onClose,
}: StoryFooterProps): ReactElement {
  const hasChoices = continuationNodes.length > 1;
  return (
    <footer
      className={`min-w-0 shrink-0 overflow-x-hidden border-t px-4 py-4 sm:px-7 ${
        theme === 'dark' ? 'border-white/10 bg-[#080c10]' : 'border-black/10 bg-white/85'
      }`}
    >
      <div className="mx-auto flex max-w-[52rem] flex-col gap-3">
        {continuationNodes.length > 0 && (
          <div>
            <p
              className={`mb-2 text-[0.65rem] uppercase tracking-[0.2em] ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              }`}
            >
              {hasChoices ? 'The archive branches' : 'The thread continues'}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {continuationNodes.map((continuationNode) => (
                <button
                  key={continuationNode.id}
                  type="button"
                  className={`min-h-11 min-w-0 break-words rounded-md border px-4 py-2.5 text-left font-serif text-sm transition-colors [overflow-wrap:anywhere] sm:text-base ${
                    theme === 'dark'
                      ? 'border-cyan-800/60 bg-cyan-950/30 text-cyan-100 hover:border-cyan-600 hover:bg-cyan-950/60'
                      : 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                  onClick={() => onContinue(continuationNode.id)}
                >
                  <span className="block break-words text-[0.6rem] font-sans uppercase tracking-[0.18em] opacity-60 [overflow-wrap:anywhere]">
                    {hasChoices ? 'Follow' : 'Continue'}
                  </span>
                  {continuationNode.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className={`min-h-11 w-full rounded-md px-4 py-2 text-sm transition-colors sm:ml-auto sm:w-auto ${
              theme === 'dark'
                ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            onClick={onClose}
          >
            Return to map
          </button>
        </div>
      </div>
    </footer>
  );
}
