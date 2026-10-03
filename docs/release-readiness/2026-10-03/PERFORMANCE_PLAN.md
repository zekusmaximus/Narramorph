# Performance budgets and measurement completion

Owner role: performance/technical maintainer. Priority: P2, required before broader support claims. Estimate: 2–3 engineering days plus real-device sessions. Findings: R07; links to #167 and #181.

## Preserve the existing contracts

The bundle policy and lazy boundaries are useful and currently pass. Keep their limits while correcting measurement. The present browser harness runs one sample per profile despite a three-run median protocol, omits the declared mobile DPR, samples loading after a fixed 500 ms, sums layout shifts without session windows, and treats an empty event list as a passing zero. Its delayed passage request tests loading semantics; click-event duration does not include waiting for the passage chunk.

| Profile | Viewport / DPR | CPU / network | LCP | CLS | Story interaction | Map interaction |
| --- | --- | --- | --: | --: | --: | --: |
| Desktop | 1440×900 / 1 | 1× / unthrottled | ≤3,000 ms | ≤0.1 | ≤750 ms | ≤300 ms |
| Mobile proxy | 412×915 / 2.625 | 4× / 150 ms RTT, 1.6 Mbps down, 750 Kbps up | ≤8,000 ms | ≤0.1 | ≤1,500 ms | ≤600 ms |

These are repository lab thresholds, not field percentiles or promises about every phone. Retain the accepted no-service-worker v1 scope.

## PERF-01 — Implement the declared protocol

Files: `config/performance-budgets.json`, `e2e/performance-boundaries.spec.ts`, performance reporting helper, workflow artifact step.

1. Make profile settings structured data and read `protocol.runs` and aggregation from the file. Use three independent fresh browser contexts per cold-load case; set viewport and device scale factor at context creation. Reset storage/cache deliberately and record exact browser/runner versions.
2. Collect LCP until a defined initial-load observation boundary, before the first interaction, with the map and fonts ready. Replace the 500 ms assumption. Compute CLS with the [standard maximum session-window definition](https://web.dev/articles/cls) or a maintained, pinned measurement library. Record observer support and entry counts.
3. Use a mark around each named action and its visible/focus-ready outcome. Keep Event Timing as a separate responsiveness measure and wait for observer delivery before sampling. An absent entry may mean a sub-16 ms action: report a censored value only when observer support and input delivery are confirmed; otherwise report unavailable evidence. An unsupported observer is unavailable evidence. Never substitute zero for an unavailable measurement.
4. For each case, retain all three valid samples and their median. Any functional failure or missing mandatory observation fails the case; do not discard a slow sample or turn a timeout into a retry-derived pass. Ordinary runner variance can trigger a documented rerun of the whole protocol, preserving the original result.
5. Export JSON containing commit/artifact digest, profile, cache/onboarding/motion state, sample index, observer support, entry counts, LCP/CLS, named action timings, long tasks, resource bytes, medians, budgets, and pass/fail reasons. Attach the report on success and failure. Keep browser traces for failures.

Acceptance: the report shows three samples per configured profile; an unsupported observation cannot pass as zero; an intentionally delayed passage fails its readiness budget while retaining correct loading/focus assertions. A budget violation produces a nonzero CI result and an intelligible report.

## PERF-02 — Measure the reader's actual waits

Separate cases so cache and onboarding state are explicit:

- First-time visitor: onboarding visible, self-hosted fonts, 2D entry, no story/3D requests before demand. Keep the existing returning-reader initial-map case separately.
- Cold passage: click to passage text visible, `aria-busy=false`, and usable focus. Include the largest convergence passage as well as L1; capture download, parse/evaluation, render, and layout costs. The artificial 350 ms delay remains a functional loading test, separate from the budget baseline.
- Warm revisit and ending: already-loaded passage, actual selected variation, close/return-to-map, convergence-section navigation, and ending unlock. Record real readiness rather than only input-handler duration.
- History stress: use a supported fixture at the actual visit-log cap, then load, navigate, save, and export the exact journey. Measure large-history startup and export latency/peak memory without changing the cap to make the test pass.
- Optional 3D: cold toggle, useful frame or clear fallback, 2D return, repeated toggles, and background/resume. Confirm it never loads before demand and releases animation work when inactive.

Establish new cold-readiness, history, export, long-task, and 3D limits from the corrected baseline on identified hardware. Submit raw results and the proposed limits for maintainer review before making them required. Do not invent a passing baseline or relabel synthetic interaction latency as field INP.

## PERF-03 — Preserve bundle headroom and prove device behavior

Run ordinary and DSN-configured builds against the same byte budgets. Current CSS gzip is **14,371 / 14,700 bytes**; configured total JS gzip is **3,271,833 / 3,320,000 bytes**. Evaluate dependency changes against those narrow margins. Add a warning at 95% of a budget without weakening its hard ceiling. Scan the whole deploy tree for maps, not only `dist/assets`.

On one identified mid-range Android phone and one iPhone, record OS/browser/device, network, cold/warm timings, long-passage scrolling, memory pressure, visibility suspension, and optional GPU behavior. Complete the genuine 3D baseline required by #167 rather than treating software-rendered proxies as GPU evidence. Test offline continuation only for already-loaded modules and explicitly document failure/retry for an uncached passage; a cold offline reload is not promised.

Acceptance: raw device records accompany the lab report, every hard budget holds, and regressions lead to optimization or a separately justified policy change. Update the Phase 8 execution record with measurements and limitations, not a table of thresholds alone.
