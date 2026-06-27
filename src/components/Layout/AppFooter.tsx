import type { ReactElement } from 'react';

interface AppFooterProps {
  visitedCount: number;
  totalNodes: number;
  progressPercent: number;
}

export function AppFooter({
  visitedCount,
  totalNodes,
  progressPercent,
}: AppFooterProps): ReactElement {
  return (
    <footer className="bg-[#0a0e12] border-t border-cyan-500/20 py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <div className="flex items-center space-x-4">
            <span className="text-cyan-400">© 2025 NARRAMORPH FICTION</span>
            <span className="text-gray-700">�</span>
            <button
              className="hover:text-cyan-400 transition-colors uppercase tracking-wider"
              onClick={() =>
                alert(
                  'About: Narramorph Fiction - An interactive narrative platform exploring digital consciousness through transforming story nodes.',
                )
              }
            >
              About
            </button>
            <button
              className="hover:text-cyan-400 transition-colors uppercase tracking-wider"
              onClick={() =>
                alert(
                  'Help: Click nodes to read, revisit nodes to see content transform, follow connections to navigate the story.',
                )
              }
            >
              Help
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span>
              NODES: <span className="text-cyan-400">{visitedCount}</span>/{totalNodes}
            </span>
            <span className="text-gray-700">•</span>
            <span>
              <span className="text-green-400">{progressPercent}%</span> COMPLETE
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
