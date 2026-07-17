import { type ReactElement } from 'react';

import { PassageListNav } from '@/components/map/PassageListNav';

/**
 * The visible, keyboard- and screen-reader-accessible companion to the 3D node map. It renders the
 * shared {@link PassageListNav} bound to the 3D interaction adapter — always visible over the WebGL
 * canvas, so the canvas is never the only way to navigate. Plain DOM, no motion: it works under
 * reduced motion and when WebGL is unavailable.
 */
export default function SceneNodeList(): ReactElement {
  return (
    <PassageListNav
      mode="3d"
      description="Select a passage to open it. This list mirrors the 3D story map."
      className="pointer-events-auto absolute left-3 top-3 z-10 max-h-[calc(100%-1.5rem)] w-60 max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-md border border-slate-500/20 bg-[#0b1016]/85 p-3 text-slate-200 shadow-lg shadow-black/20 backdrop-blur-md"
    />
  );
}
