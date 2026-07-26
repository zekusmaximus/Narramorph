# Experimental 3D view: stabilization and enhancement plan

The 3D view remains an optional enhancement. The 2D map and shared passage list remain the reliable, non-WebGL navigation paths while this plan is executed.

## Phase 1 stabilization record (2026-07-25)

Before Phase 1, `PlaneGuide` rendered labels with Drei's `Text`, which delegates glyph work to Troika. Troika creates a blob-backed worker and rehydrates additional modules with `importScripts(blob:...)`. The production policy already permitted the outer worker through `worker-src blob:`, but the nested imports are governed by `script-src`; consequently they were blocked and initialization ended with `init did not return a callable function`.

This chain was verified in the installed dependency, not inferred from the console alone:

- `PlaneGuide` was the only 3D component importing Drei `Text`.
- `troika-worker-utils/src/workerBootstrap.js` creates a JavaScript blob and calls `importScripts(url)` to rehydrate each module. If CSP blocks that import it logs `worker module init function failed to rehydrate`.
- `troika-worker-utils/src/WorkerModules.js` then throws `Worker module function was called but init did not return a callable function` when registration reports a non-callable result.
- Before the replacement, both strings and `importScripts(url)` were present in the generated 3D asset, demonstrating that the production graph contained the failing path.

### Security decision

Phase 1 removes Drei `Text` from the layer guides and renders the three fixed labels into local canvas-backed Three.js sprite textures. This keeps the labels camera-facing without a font parser or worker. The production policy is therefore restored to `script-src 'self'` and `worker-src 'self'`; the header verifier rejects `blob:` and `data:` script sources.

Alternatives considered:

1. **Keep `script-src 'self' blob:`.** This matches Troika's current nested `importScripts(blob:)` architecture and likely repairs this exact failure, but expands the script execution boundary for three static labels. It was rejected because the dependency can be removed cheaply.
2. **Configure or bundle Troika's worker differently.** The installed supported API serializes module functions and rehydrates them via blob `importScripts`; setting a bundled outer worker does not remove the nested blob scripts. Troika has a main-thread fallback, but its worker-support choice is internal and overriding it would rely on unsupported global behavior. This was rejected as less maintainable than a small worker-free label.
3. **Worker-free canvas sprites (selected).** No CSP exception, remote font, inline/eval script, or custom dependency patch is required. The tradeoff is that these fixed guide labels are raster textures rather than Troika SDF text, which is acceptable at their current size and decorative role; the semantic passage list remains the accessible text path.

### Automated coverage and recovery

The 3D browser regression is served from the production build by a deterministic Node fixture that reads the CSP directly from `public/_headers` (Vite preview is not treated as CSP evidence). It enters through the real toggle, waits for the first rendered frame's `data-scene-ready` signal, checks the passage list, and records relevant console errors plus all `pageerror` events. It then dispatches `webglcontextlost` and verifies automatic return to a usable 2D map with an explanatory status.

The bundle-budget gate also fails if the generated 3D entry contains Troika's two reported worker-error signatures or its package marker. This catches an accidental reintroduction even where CI cannot launch a trustworthy WebGL browser.

Headless Chromium's software WebGL path validates integration and deterministic recovery, not real GPU/driver behavior. Owner verification remains required on current Chrome/Edge, Firefox, and Safari across representative desktop/mobile hardware. Record browser, OS, GPU, driver, context-loss behavior, and console output; do not infer those results from CI.

## Delivery sequence

### 1. Stabilize and observe

- Maintain the production-CSP browser regression and extend browser coverage where CI WebGL is trustworthy.
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
| Security | Header checker requires self-only script/worker policies and rejects blob/data/inline/eval scripts; production-CSP 3D journey | Production console has no CSP violations |
| Function | 3D smoke journey, keyboard navigation, fallback/context-loss tests | Orbit, zoom, focus, open, close, return to 2D |
| Accessibility | Semantic-list tests and automated WCAG scan | Screen reader, keyboard-only, reduced motion, forced colors |
| Performance | Bundle boundary and deterministic scene metrics | FPS, memory, thermals on desktop and mobile GPUs |
| Compatibility | Chromium, Firefox, WebKit CI smoke tests where GPU support is trustworthy | Current Chrome/Edge, Firefox, and Safari on real hardware |

Results should be recorded with browser/device versions and dates. A missing hardware result is a release caveat, not a result to infer from headless CI.
