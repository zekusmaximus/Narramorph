# Archive notice draft for `eternal-return-digital-self`

This is the **draft** archive notice for the prototype repository, prepared in N per Phase 6.6 (issue [#169](https://github.com/zekusmaximus/Narramorph/issues/169)). **It has not been applied to P.** When the archive gate is satisfied and you give the go-ahead, prepend the block below to P's `README.md` (and/or use it as the archive banner), then tag `reference-final`, disable deployments, remove unused secrets, and use GitHub's archive toggle. Nothing here modifies P automatically.

---

## Suggested README banner (paste into `eternal-return-digital-self`)

> # ⧗ Archived reference prototype
>
> **This repository is archived and read-only.** It is preserved as the frozen visual/interaction prototype for the Narramorph project. Active development continues in **[Narramorph](https://github.com/zekusmaximus/Narramorph)**.
>
> Reference tag: **`reference-final`** (commit `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b`).
>
> ## What was carried into Narramorph (clean-room, not by copying code)
>
> - **First-run introduction** — rebuilt as an accessible modal (focus containment/restoration, Escape, skip, keyboard completion, reduced-motion) with a versioned "intro seen" value.
> - **Animated node demonstration** — reimplemented as semantic SVG with a static reduced-motion equivalent and a text alternative.
> - **Help / replayable guidance** — a persistent Help entry with Narramorph-accurate copy.
> - **Cosmic atmosphere** — adopted selectively as a decorative, `aria-hidden`, reduced-motion-gated layer kept off the reading surface.
> - **Character/colour language** — promoted to documented, WCAG-checked design tokens.
>
> ## What was intentionally not carried over
>
> - **Instanced/batched 3D rendering** — profiled and declined: no measurable benefit at Narramorph's node count, and it lacked a reduced-motion guard. Narramorph added an accessible companion node list instead.
> - **Lazy-load boundary** and **WebGL→text fallback** — Narramorph already had both.
> - **Marginalia sidebar**, the **duplicate Redux/domain/infrastructure stacks**, the **reader/transform renderer**, and the checked-in **`dist/`** — superseded or defect-carrying; not ported.
> - **Mini-constellation minimap** — deferred, pending user testing and an accessible (non-canvas-only) rebuild.
>
> Full rationale: Narramorph's `docs/consolidation/` (extraction audit, design tokens, 3D profiling, and the archive-gate review).

---

## Owner checklist to execute the archive (on P; admin)

1. Prepend the banner above to P's `README.md` (commit on P).
2. `git tag reference-final 392eef6c6f87b8064c8cc51d91b6f029b0e32d5b && git push origin reference-final`.
3. Disable P's deployments (e.g. any hosting/CI deploy hooks) and delete unused repository secrets.
4. Confirm P's issue tracker (currently **empty**) needs no migration/closure.
5. GitHub → repo Settings → **Archive this repository**. Do **not** delete the repo — preserve history and the final screenshots.
