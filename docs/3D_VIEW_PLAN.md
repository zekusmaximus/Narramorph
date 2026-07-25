# Experimental 3D view: stabilization and enhancement plan

The 3D view remains an optional enhancement. The 2D map and shared passage list remain the reliable, non-WebGL navigation paths while this plan is executed.

## Current failure and immediate repair

`PlaneGuide` renders labels with Drei's `Text`, which delegates glyph work to Troika. Troika creates a blob-backed worker and rehydrates additional modules with `importScripts(blob:...)`. The production policy already permitted the outer worker through `worker-src blob:`, but the nested imports are governed by `script-src`; consequently they were blocked and initialization ended with `init did not return a callable function`.

The production policy now permits `blob:` in both `worker-src` and `script-src`. It continues to exclude remote script origins, inline script, and eval. The deployed-header checker asserts both blob requirements so a future security edit cannot silently break the 3D labels again.

## Delivery sequence

### 1. Stabilize and observe

- Add a browser test that enters 3D, waits for the scene and labels, and fails on CSP, worker, unhandled-promise, or WebGL-context errors.
- Exercise Chromium, Firefox, and WebKit plus one representative mobile device on a real GPU; retain the current error boundary and one-click return to 2D.
- Record time-to-first-scene, frame rate, memory, and context-loss recovery before optimizing.

**Exit:** the view opens without console errors, its passage list remains usable, and an induced WebGL context loss returns the reader to a useful recovery path.

### 2. Make navigation legible

- Draw story connections and distinguish available, visited, selected, and locked states without relying on color alone.
- Add reset/focus controls and a small orientation legend; preserve keyboard selection through the shared map adapter and synchronize canvas focus with the passage list.
- Replace remaining magic camera/layout values with named, tested configuration and ensure every label remains readable at supported zoom levels.

**Exit:** a keyboard-only user can locate, focus, and open any available passage, and user testing confirms that the spatial grouping and connection direction are understandable.

### 3. Harden performance and device behavior

- Use measurements to choose among instancing, lower sphere segments, label distance culling, and adaptive DPR; do not add effects until the baseline budgets pass.
- Pause animation when hidden, honor reduced motion throughout, handle resize/orientation changes, and test pointer/touch gestures without trapping page navigation.
- Define budgets by device tier for first-scene latency, steady-state FPS, memory, and bundle size.

**Exit:** agreed budgets pass on the real-device matrix with no regression to the lazy-loaded 2D startup bundle.

### 4. Enhance deliberately

- Evaluate narrative edges and restrained depth cues first; gate bloom, particles, shaders, and cinematic camera moves behind performance and reduced-motion checks.
- Run accessibility, usability, and narrative-comprehension review before removing the `Experimental` label. Keep the passage list even if the canvas graduates.

## Verification matrix

| Area | Automated gate | Manual / hardware gate |
| --- | --- | --- |
| Security | Header checker requires `script-src blob:` and `worker-src blob:` while rejecting inline/eval | Production console has no CSP violations |
| Function | 3D smoke journey, keyboard navigation, fallback/context-loss tests | Orbit, zoom, focus, open, close, return to 2D |
| Accessibility | Semantic-list tests and automated WCAG scan | Screen reader, keyboard-only, reduced motion, forced colors |
| Performance | Bundle boundary and deterministic scene metrics | FPS, memory, thermals on desktop and mobile GPUs |
| Compatibility | Chromium, Firefox, WebKit CI smoke tests where GPU support is trustworthy | Current Chrome/Edge, Firefox, and Safari on real hardware |

Results should be recorded with browser/device versions and dates. A missing hardware result is a release caveat, not a result to infer from headless CI.
