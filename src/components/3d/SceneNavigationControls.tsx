import { Crosshair, RotateCcw } from 'lucide-react';
import { useState, type ReactElement } from 'react';

interface SceneNavigationControlsProps {
  selectedLabel: string | null;
  onFocusSelected: () => void;
  onReset: () => void;
}

function StateMark({
  kind,
}: {
  kind: 'available' | 'opened' | 'selected' | 'locked';
}): ReactElement {
  const shared = 'inline-block h-3 w-3 shrink-0 rounded-full';
  if (kind === 'locked') {
    return (
      <span aria-hidden="true" className={`${shared} border border-dashed border-slate-300`} />
    );
  }
  if (kind === 'opened') {
    return (
      <span aria-hidden="true" className={`${shared} border-2 border-cyan-100 bg-cyan-100/30`} />
    );
  }
  if (kind === 'selected') {
    return (
      <span
        aria-hidden="true"
        className={`${shared} border-2 border-cyan-50 ring-2 ring-cyan-200/70 ring-offset-1 ring-offset-[#0b1016]`}
      />
    );
  }
  return <span aria-hidden="true" className={`${shared} bg-cyan-100`} />;
}

/**
 * Plain-DOM camera controls and legend remain usable independently of WebGL
 * picking and explain every structural state cue.
 */
export default function SceneNavigationControls({
  selectedLabel,
  onFocusSelected,
  onReset,
}: SceneNavigationControlsProps): ReactElement {
  const [status, setStatus] = useState('');

  return (
    <aside
      aria-label="3D navigation controls"
      className="pointer-events-auto absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2"
    >
      <div className="flex gap-2 rounded-lg border border-slate-500/20 bg-[#0b1016]/90 p-2 shadow-lg shadow-black/20 backdrop-blur-md">
        <button
          type="button"
          aria-label="Reset 3D view"
          title="Reset 3D view"
          onClick={() => {
            onReset();
            setStatus('Three-dimensional view reset to the overview.');
          }}
          className="flex min-h-11 min-w-11 items-center justify-center rounded border border-white/15 text-slate-200 hover:border-cyan-100/40 hover:text-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
        >
          <RotateCcw aria-hidden="true" size={18} />
        </button>
        <button
          type="button"
          aria-label="Focus selected passage"
          title="Focus selected passage"
          disabled={!selectedLabel}
          onClick={() => {
            onFocusSelected();
            setStatus(`Focused the three-dimensional view on ${selectedLabel ?? 'the passage'}.`);
          }}
          className="flex min-h-11 min-w-11 items-center justify-center rounded border border-white/15 text-slate-200 hover:border-cyan-100/40 hover:text-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Crosshair aria-hidden="true" size={18} />
        </button>
      </div>

      <details className="w-auto max-w-[calc(100vw-1.5rem)] rounded-lg border border-slate-500/20 bg-[#0b1016]/90 text-xs text-slate-300 shadow-lg shadow-black/20 backdrop-blur-md [&[open]]:w-52">
        <summary className="min-h-11 cursor-pointer content-center px-3 font-medium uppercase tracking-[0.14em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100">
          3D legend
        </summary>
        <div aria-label="3D map legend" className="space-y-3 border-t border-white/10 p-3">
          <p className="leading-relaxed text-slate-400">
            Past, present, and future occupy successive depth layers. Arrowheads point toward the
            next passage.
          </p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <StateMark kind="available" /> Solid sphere: available
            </li>
            <li className="flex items-center gap-2">
              <StateMark kind="opened" /> One ring: opened
            </li>
            <li className="flex items-center gap-2">
              <StateMark kind="selected" /> Two rings: selected
            </li>
            <li className="flex items-center gap-2">
              <StateMark kind="locked" /> Wireframe: locked
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="w-8 border-t border-cyan-100" /> Solid route:
              available
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="w-8 border-t border-dashed border-slate-300" />{' '}
              Dashed route: locked
            </li>
          </ul>
        </div>
      </details>

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </aside>
  );
}
