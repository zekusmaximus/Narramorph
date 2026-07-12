# L3 loading and assembly profile

Date: 2026-06-26

## Outcome

L3 selection, assembly, and rendering are not long-task candidates. The measurable delay is the first acquisition of 3.87 MB of aggregate L3 JSON. A Web Worker is not justified.

The implementation now:

- loads the four L3 aggregate files in parallel only when L3 is opened;
- validates their actual array-shaped runtime contract and caches the resulting typed data;
- records `l3.loading`, `l3.selection`, `l3.assembly`, and `l3.total` metrics;
- removes the `setTimeout(0)` yield, which did not move work off the main thread;
- keeps selection and assembly synchronous and deterministic;
- exposes `npm run profile:l3` as a repeatable 250-iteration profile.

## Measurements

Environment: Windows, Node 22.18.0, Vite 5.4.20, local Chrome, production and development servers on loopback. Browser timings are useful for attribution, not a forecast for a slow network or lower-powered device.

### Pre-change attribution

A 50-iteration Node harness parsed the four source files from their 3,873,418 bytes of JSON and exercised selection plus the UI's paragraph/bold preparation:

| Stage               |   Median |      p95 |       Max |
| ------------------- | -------: | -------: | --------: |
| JSON parse          | 5.814 ms | 8.388 ms | 13.015 ms |
| Candidate selection | 0.007 ms | 0.010 ms |  0.108 ms |
| Render preparation  | 0.033 ms | 0.054 ms |  0.162 ms |

This ruled out selection and text preparation as sources of blocking before implementation.

### Repeatable application profile

Command:

```text
npm run profile:l3
```

The run covered 45 archaeologist, 45 algorithm, 45 human, and 135 convergence variations. Its warm-path results were:

| Stage               |    Median |       p95 |        Max |
| ------------------- | --------: | --------: | ---------: |
| Cached loading      | 0.0026 ms | 0.0078 ms |  0.0256 ms |
| Typed selection     | 0.0097 ms | 0.0271 ms |  0.1085 ms |
| Assembly            | 0.0031 ms | 0.0105 ms |  0.1494 ms |
| Total build         | 0.0185 ms | 0.0736 ms |  0.2590 ms |
| React static render | 0.6585 ms | 1.8434 ms | 22.1203 ms |

The Vite-Node cold load was 994.5397 ms. That figure includes development transformation of four large JSON modules, so browser resource timing was used to separate development tooling overhead from application CPU.

### Browser verification

A fresh development-browser assembly took 296.7 ms: 295.6 ms loading, 0.4 ms selection, and less than the browser timer's 0.1 ms resolution for assembly. One hundred cached assemblies had a 0 ms median and 0.1 ms p95 at that timer resolution.

Twenty real `L3AssemblyView` mounts measured through React Profiler took:

|    Min | Median | p95 / Max |
| -----: | -----: | --------: |
| 1.6 ms | 2.6 ms |    5.9 ms |

In the production build, no L3 chunk was requested at initial page load. Loading all four chunks for the first time over loopback took 149.4 ms and transferred 556,281 bytes. Re-importing the cached modules 100 times took 0.1 ms median and 0.2 ms p95.

### Bundle impact

| Artifact               |       Before |        After |                Change |
| ---------------------- | -----------: | -----------: | --------------------: |
| Main application chunk | 14,756.07 kB | 11,050.56 kB | -3,705.51 kB (-25.1%) |
| Main application gzip  |  2,947.34 kB |  2,397.05 kB |   -550.29 kB (-18.7%) |

The deferred L3 chunks total 3,709.65 kB raw and 555.08 kB gzip. The convergence chunk is the largest at 2,202.74 kB raw / 314.62 kB gzip.

## Why there is no worker

The warm CPU path is below 0.3 ms at p100 in the repeatable profile, and a real L3 view mount is below 6 ms at p95. Both are comfortably below the 50 ms long-task threshold. A worker would still need to acquire the same content and would add worker startup, a second module graph, protocol maintenance, cancellation complexity, and structured-clone cost for four long narrative strings. It would not address the measured cold-loading delay.

Lazy parallel imports and a single promise cache directly address the measured bottleneck while keeping output deterministic in browsers and tests.

## Remaining risks

- First-use latency remains network-dependent because L3 requires about 555 kB compressed.
- The convergence source contains legacy duplicate combinations and 14 missing exact synthesis combinations. Selection uses documented, deterministic fallbacks; narrative content was not edited.
- Loopback measurements should be repeated under representative mobile CPU and network throttling before setting a user-facing latency budget.
