# Phase 6.4 — experimental 3D profiling and the port decision

This records the Phase 6.4 comparison of N's experimental 3D node rendering against the frozen prototype's instanced/batched technique ("P", `392eef6c…`), and the resulting decision. It supports roadmap Phase 6.4 (issue [#167](https://github.com/zekusmaximus/Narramorph/issues/167)); parent epic #93. No N build/runtime dependency on P is introduced (ADR 0001).

## The scenario that actually ships

N's constellation is intentionally small: `SCENE_NODE_LIMIT = 19` (`src/components/3d/sceneNodes.ts`), matching the story's L1–L4 spine. This is the scenario to profile — not a synthetic thousand-node scene.

## The two approaches

|  | N (ships) | P (reference) |
| --- | --- | --- |
| Node rendering | per-node `NodeSphere` mesh, `sphereGeometry(1.5, 32, 32)` each | one `InstancedMesh` + custom `ShaderMaterial` + LOD (`NodesInstanced.tsx`, 844 lines) |
| Render loop | react-spring transitions (demand-driven) + OrbitControls damping **gated on reduced motion** | `frameloop="always"` + per-frame noise, **no reduced-motion guard** |
| Connections | — | `ConnectionsBatched.tsx` (124 lines) |

## Structural comparison (computed from the scene composition; confirm live on device)

These are deterministic structural counts derived from the code, independent of GPU speed — not measured FPS.

| Metric          | N (per-node, 19 nodes)           | P-style (instanced)   | Delta          |
| --------------- | -------------------------------- | --------------------- | -------------- |
| Node draw calls | 19 (+ ≤3 plane guides) ≈ **~22** | 1 (+ guides) ≈ **~4** | −18 draw calls |
| Node geometries | 19 sphere geometries             | 1 shared              | −18            |
| Node materials  | 19 standard materials            | 1 shader material     | −18            |
| Node triangles  | 19 × ~1,984 ≈ **~37.7k**         | ~37.7k (shared)       | ~0             |

**Reading of the numbers.** Instancing's benefit is collapsing many draw calls into one — it pays off at **hundreds-to-thousands** of instances. At ~22 total draw calls and ~38k triangles, the scene is far below any draw-call, geometry, or fill bottleneck on modern or even software GPUs; the ~18 draw calls instancing would remove were never a cost. Porting P's 844-line instanced shader + LOD path would add significant complexity to the primary path for **no measurable reader benefit at this node count**, and would **regress** N's accessibility posture (P's `frameloop="always"` has no reduced-motion guard, which N deliberately avoids).

## Decision — stop early; do not port instancing

Per the roadmap's "stop early if profiling shows little reader value", **P's instancing is not ported.** N keeps its per-node 3D, which is comfortably within budget at ≤19 nodes and is reduced-motion correct. 3D stays **clearly experimental**: opt-in, lazy-loaded, reduced-motion aware, and recoverable after WebGL context loss, with 2D fully functional when WebGL is unavailable. This satisfies the 6.4 gate ("3D meets its budget **or** remains clearly experimental/disabled for v1; 2D fully functional without WebGL").

## What 6.4 did build — the portable win

- **A semantic, visible companion node list** (`SceneNodeList`) synchronized with the 3D nodes through the shared `selectSceneNodeGroups` selector and the same interaction adapter, so the WebGL canvas is **never the only navigation mechanism**. It is plain DOM (keyboard + screen-reader accessible, no motion), lists the same ≤19 nodes in the same order the canvas renders, activates the same node selection, disables locked nodes, and marks the open node as current — working under reduced motion and when WebGL is unavailable.
- Confirmed guards: 3D is optional + lazy (`Home` lazy-loads the canvas), reduced-motion aware (`enableDamping` gated; the list has no motion), and WebGL-loss → 2D is proven green in `e2e/reader-journey.spec.ts`.

## Device measurement (owner, on representative hardware)

Structural counts above are deterministic; **frame-rate and GPU-memory behaviour are device-dependent and are the owner's to measure** (agent access for 6.4 notes device access). Repeatable method:

1. `npm run dev`, enable **Experimental 3D**; the DEV `FPSCounter` overlay is already present.
2. On each target device (including a low-power one), record FPS and — via the browser Performance panel or `renderer.info` (React Three DevTools / a console read) — draw calls and GPU memory across the roadmap scenarios: **GPU memory, resize, suspend/resume, repeated open/close, low-power**.
3. Acceptance: if 3D holds interactive FPS on representative hardware it may graduate from experimental; otherwise it stays experimental/disabled for v1. Either way, 2D remains the fully-functional path.
