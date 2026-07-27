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

The browser regression now reads a passage through the shared list before recovery, reasserts that no unexpected runtime failures occurred after the intentional context loss, and attaches successful scene/recovery screenshots. A separate deterministic case allows the capability probe to succeed but denies the renderer's canvas context, verifying initialization-error fallback, the cleared 3D preference, and a still-readable passage in 2D.

### Recorded automated results

| Date | Environment | Build | Production-CSP 3D journey | Bundle gate | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-07-26 | Windows, Playwright-pinned Chromium (owner run) | pass, 2,891 modules, 9.03s | pass, 1 test, 5.2s | pass, all budgets and worker-signature gate | Result covered the original scene/list/context-loss journey. Rerun the expanded two-test spec to capture passage activation, recovery-phase assertions, initialization failure, and attached screenshots. |
| 2026-07-27 | Windows 11, Playwright-pinned Chromium (owner run) | pass, 8.05s | pass, 2 tests, 6.8s | pass, all budgets and worker-signature gate | Expanded two-test spec: passage activation through the shared list, recovery-phase console assertions, renderer-initialization-failure fallback with cleared 3D preference, and scene/recovery screenshots attached to the report. |

Headless Chromium's software WebGL path validates integration and deterministic recovery, not real GPU/driver behavior. Owner verification remains required on current Chrome/Edge, Firefox, and Safari across representative desktop/mobile hardware. Record browser, OS, GPU, driver, context-loss behavior, and console output; do not infer those results from CI.

### Recorded hardware results

Runs drive the full production-CSP journey (fixture serving `dist/` with the `public/_headers` policy) on headed, branded browsers using the machine's real GPU: open 3D via the toggle, wait for the first-frame `data-scene-ready` signal, read First Documentation through the shared passage list, dispatch `webglcontextlost`, and verify recovery to a usable 2D map with the 3D preference cleared.

| Date | Browser | OS / GPU / driver | Result | Console |
| --- | --- | --- | --- | --- |
| 2026-07-27 | Chrome 150.0.7871.182 (branded, headed) | Windows 11 Pro 26200; Intel(R) Graphics (0x7D45), driver 32.0.101.8724; ANGLE D3D11, WebGL2 | pass — full journey incl. context-loss recovery | Only the expected `THREE.WebGLRenderer: Context Lost.` during the intentional loss phase; no CSP, worker, or page errors |
| 2026-07-27 | Edge 150.0.4078.83 (branded, headed) | Windows 11 Pro 26200; Intel(R) Graphics (0x7D45), driver 32.0.101.8724; ANGLE D3D11, WebGL2 | pass — full journey incl. context-loss recovery | Only the expected `THREE.WebGLRenderer: Context Lost.` during the intentional loss phase; no CSP, worker, or page errors |

Outstanding release caveats: Firefox (not installed on the verification machine), Safari (requires Apple hardware), and a representative mobile device have not been hardware-verified. These remain caveats, not inferred passes.

### Baseline metrics (2026-07-27, pre-optimization)

Captured during the hardware runs above (1440×900 viewport, default motion, no other load). These are the stage 1 baselines that stage 3 optimization must be measured against.

| Metric                                                  | Chrome 150 | Edge 150 |
| ------------------------------------------------------- | ---------: | -------: |
| Time to first scene (toggle click → `data-scene-ready`) |     906 ms | 1,579 ms |
| Steady-state FPS (5 s rAF sample, idle scene)           |       60.0 |     60.3 |
| JS heap after first scene                               |    14.4 MB |  14.1 MB |
| Context-loss → 2D fallback status visible               |      52 ms |    38 ms |

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
