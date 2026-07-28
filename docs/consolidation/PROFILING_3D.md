# Phase 6.4 — experimental 3D profiling and the port decision

This records the Phase 6.4 comparison of N's experimental 3D node rendering against the frozen prototype's instanced/batched technique ("P", `392eef6c…`), and the resulting decision. It supports roadmap Phase 6.4 (issue [#167](https://github.com/zekusmaximus/Narramorph/issues/167)); parent epic #93. No N build/runtime dependency on P is introduced (ADR 0001).

> **Current-status note (2026-07-28):** The comparison and stop-early decision below are historical context. Phase 2 subsequently added story connections, locked cages, selection rings, and navigation controls. `NarromorphCanvas` does not set `frameloop`; with the installed R3F version its default is `always`. The new production profiler in `docs/3D_VIEW_PLAN.md` is the current measurement source.

## The scenario that actually ships

N's constellation is intentionally small: `SCENE_NODE_LIMIT = 19` (`src/components/3d/sceneNodes.ts`), matching the story's L1–L4 spine. This is the scenario to profile — not a synthetic thousand-node scene.

## The two approaches

|  | N (ships) | P (reference) |
| --- | --- | --- |
| Node rendering | per-node `NodeSphere` mesh, `sphereGeometry(1.5, 32, 32)` each, plus state-dependent cages/rings | one `InstancedMesh` + custom `ShaderMaterial` + LOD (`NodesInstanced.tsx`, 844 lines) |
| Render loop | R3F default `frameloop="always"`; reduced motion makes node springs immediate and disables OrbitControls damping, but does not pause the loop | `frameloop="always"` + per-frame noise, **no reduced-motion guard** |
| Connections | `SceneConnection`: directional arrowheads, solid available routes, segmented locked routes, selected-route emphasis | `ConnectionsBatched.tsx` (124 lines) |

## Historical structural comparison (pre-Phase-2)

These counts were derived from the earlier node-and-guide composition, independent of GPU speed. They preserve the basis for the original port decision but no longer describe the whole shipping scene: connections and non-colour state geometry were added later.

| Metric          | N (per-node, 19 nodes)           | P-style (instanced)   | Delta          |
| --------------- | -------------------------------- | --------------------- | -------------- |
| Node draw calls | 19 (+ ≤3 plane guides) ≈ **~22** | 1 (+ guides) ≈ **~4** | −18 draw calls |
| Node geometries | 19 sphere geometries             | 1 shared              | −18            |
| Node materials  | 19 standard materials            | 1 shader material     | −18            |
| Node triangles  | 19 × ~1,984 ≈ **~37.7k**         | ~37.7k (shared)       | ~0             |

**Historical reading of the numbers.** The original decision reasoned that collapsing 19 node draws did not justify porting P's 844-line instanced shader/LOD path. The statement that the complete scene was about 22 calls, demand-driven, and comfortably below a software-GPU bottleneck is no longer current. It predated Phase 2 and was not backed by a repeatable production measurement.

### Current automated structural/runtime snapshot

`npm run profile:3d` now builds production, enters through the real toggle under the production CSP, samples after settling, and writes raw JSON plus Markdown to ignored `output/profile-3d/`.

The final 2026-07-28 headless Chromium 151 software-WebGL run measured 174 calls, 33,078 triangles, 9,504 lines, 172 geometries, and 4 textures; its five-second rAF window averaged 11.6 FPS. A preceding same-host run averaged 7.2 FPS. These figures describe the current Phase 2 scene on one variable software renderer. They do not identify node draw calls as the bottleneck, do not establish a real-device budget, and are not evidence to port instancing.

## Decision — stop early; do not port instancing

Per the roadmap's "stop early if profiling shows little reader value", **P's instancing was not ported.** That remains the decision unless measurements isolate node draw calls as a meaningful cost on representative hardware. N keeps its per-node 3D for now; 3D stays **clearly experimental**: opt-in, lazy-loaded, reduced-motion aware, and recoverable after WebGL context loss, with 2D fully functional when WebGL is unavailable. No current real-device performance budget is claimed as passed.

## What 6.4 did build — the portable win

- **A semantic, visible companion node list** (`SceneNodeList`) synchronized with the 3D nodes through the shared `selectSceneNodeGroups` selector and the same interaction adapter, so the WebGL canvas is **never the only navigation mechanism**. It is plain DOM (keyboard + screen-reader accessible, no motion), lists the same ≤19 nodes in the same order the canvas renders, activates the same node selection, disables locked nodes, and marks the open node as current — working under reduced motion and when WebGL is unavailable.
- Confirmed guards: 3D is optional + lazy (`Home` lazy-loads the canvas), reduced-motion aware (`enableDamping` gated; the list has no motion), and WebGL-loss → 2D is proven green in `e2e/reader-journey.spec.ts`.

## Device measurement (owner, on representative hardware)

Frame rate, GPU/JS memory, thermals, and device behavior remain hardware-dependent. Repeatable method:

1. Run `npm run profile:3d` for the production-CSP automated baseline. Preserve `output/profile-3d/latest.json` with the run record when comparing changes.
2. Repeat on each target device/browser (including a low-power and representative mobile device) and supplement the automated fields with GPU memory, thermals, resize/orientation, suspend/resume, repeated open/close, and pointer/touch observations.
3. Agree budgets by device tier before creating gates or selecting an optimization. Firefox, Safari, and representative mobile hardware results remain unrecorded; Phase 2 comprehension and label-readability gates also remain open.

The development `FPSCounter` remains useful for interactive investigation, but it is not the reproducible production baseline. Neither the automated software-WebGL result nor a missing browser/device run is an inferred pass.
