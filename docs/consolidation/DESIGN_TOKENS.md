# Narramorph design tokens (Phase 6.3)

This is the reference for Narramorph's unified visual language: the design tokens, which effects are **decorative** (and therefore ignored by assistive technology), and the **measured** WCAG contrast that the CI gate enforces. It supports roadmap Phase 6.3 (issue [#166](https://github.com/zekusmaximus/Narramorph/issues/166)); parent epic #93.

## Sources of truth

| Layer | File | Consumed by |
| --- | --- | --- |
| TypeScript tokens (canonical) | `src/styles/designTokens.ts` | node appearance, 3D scene, content loader, the contrast validator |
| CSS custom properties (mirror) | `src/styles/tokens.css` | component styling, focus ring, cosmic atmosphere, Tailwind color `500` shades |
| Tailwind theme | `tailwind.config.js` | utility classes (`text-archaeologist-500`, …) resolve the `500` shade to `var(--perspective-*)` |

`designTokens.test.ts` asserts the CSS mirror matches the TS source (drift guard) **and** that every meaningful colour pairing meets its WCAG target, so contrast cannot silently regress.

## Token groups

- **Perspective colours** — `--perspective-{archaeologist,algorithm,last-human,convergence}`. Used as **graph/node fills** (non-text UI state; WCAG ≥ 3:1). Locked nodes use the dimmer `PERSPECTIVE_COLOR_LOCKED` variants.
- **Perspective ink** — `--perspective-*-ink`. Readable **text** variants (≥ 4.5:1 on the dark shell). Only convergence needed lifting (`#9B59B6` → `#b07cc9`); the others already pass as text.
- **Surfaces** — `--surface-{shell,raised,reader-night,reader-paper,reader-archive}`. The archive shell, raised panels/dialogs, and the three reader themes.
- **Focus** — `--focus-ring` (default cyan for dark surfaces) with `--focus-ring-on-light` applied on the light "Paper"/sepia reader panels via `[data-reader-surface='light'|'sepia']`, because the cyan ring is effectively invisible on white (~1.2:1).
- **Motion** — `--motion-{fast,base,slow}` durations.
- **Atmosphere (decorative)** — `--atmosphere-opacity`, `--atmosphere-drift-duration`.

## Decorative effects (assistive technology ignores these)

- **Cosmic atmosphere.** A drifting starfield rendered as `.archive-shell::before` — a pseudo-element, so it is never in the accessibility tree. It sits behind all content (`z-index: -1` within the shell's own stacking context), never touches the reading surface, and its drift is neutralised by the global reduced-motion rules (`[data-reduced-motion='true']` and `@media (prefers-reduced-motion: reduce)`) in `index.css`. The legible archive shell stays dominant.
- The map's own atmosphere (`NodeMapAtmosphere` and friends) is separate and already gates every layer behind the reduce-motion preference.

## Measured WCAG contrast (the gate)

Ratios computed against N's real surfaces; the CI validator enforces the minimums.

| Pairing                               | Ratio                 | Target       | Result |
| ------------------------------------- | --------------------- | ------------ | ------ |
| archaeologist fill on shell           | 5.93                  | 3 (non-text) | pass   |
| algorithm fill on shell               | 9.18                  | 3            | pass   |
| last-human fill on shell              | 5.11                  | 3            | pass   |
| convergence fill on shell             | 4.18                  | 3            | pass   |
| convergence **ink** as text on shell  | 6.11                  | 4.5 (text)   | pass   |
| focus ring (cyan) on shell / raised   | 15.65 / 15.31         | 3            | pass   |
| focus ring (light) on paper / archive | 5.36 / 5.17           | 3            | pass   |
| reader ink on paper / archive / night | 14.68 / 14.16 / 14.33 | 4.5          | pass   |

**Locked nodes** use dimmer fills (≈2.2–2.7:1 on the shell) and are intentionally excluded from the gate: a locked node is non-interactive and further dimmed at render (opacity 0.3, reduced scale), and "unavailable" is conveyed by that de-emphasis rather than by hue — brightening it would fight the recessive design. The available / visited / active fills that carry meaning stay in the gate.

### Fixed in 6.3

- **Convergence purple as text** was 4.18:1 (< 4.5) on the shell → added the `#b07cc9` ink variant.
- **Focus ring on light reader surfaces** was ~1.2:1 (invisible) → theme-aware ring flips to `#0e7490` (≥ 5:1) on the Paper/sepia panels.
- **Unexplained `⚠️` emoji** in the WebGL fallback → a labelled, tokenised icon; the heading carries the meaning.
