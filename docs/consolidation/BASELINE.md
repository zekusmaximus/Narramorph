# Verified pre-consolidation baseline

Reviewed: July 13, 2026

Immutable tag: `pre-consolidation-2026-07-13`

Tagged Narramorph commit: `cbd840c0de2d11752fb37b1c7c60399c36549eb6`

## Repository and product state

- Narramorph is the strongest product foundation and the designated integration target.
- The current status documentation reports a complete checked-in L1–L4 runtime story.
- The application presents three perspective openings, a 2D archive map, an optional experimental 3D view, long-form passage reader, progress, preferences, and local persistence.
- Current repository documentation includes the product consolidation roadmap merged immediately before this baseline tag.

## Verified commands

The comparison run used a clean dependency install against the reviewed lockfile.

| Check | Result |
|---|---|
| `npm run build` | Passed |
| `npm test -- --run` | 37 files, 163 tests passed |
| `npm run lint:ci` | Passed with 29 warnings and no errors |
| `npm run test:e2e` | Nine Chromium journeys passed |

The browser suite covered the complete reader journey, save/restore, missing-story recovery, WebGL fallback, keyboard use, 390×844 layout, text sizing, 200% root text, and reduced motion.

## Baseline risks

- The reviewed build produced an approximately 11.3 MB minified main JavaScript chunk, about 2.47 MB compressed, plus large story chunks. Startup code/content boundaries require work before release.
- `npm audit` reported 22 advisories in the reviewed dependency graph, including two critical advisories. Each requires path/reachability review rather than blind automated fixing.
- The README's 99.8%/unfinished-L4 claim conflicts with current status documentation and checked-in L4 content.
- Lint permits a warning budget and currently reports 29 warnings.
- Deployment, monitoring, release, and rollback operations are not yet defined.

## UX baseline

- Strengths: clear perspective-first opening, semantic node controls in 2D, readable literary passage surface, progress/settings, focus containment, keyboard navigation, reduced motion, responsive browser coverage, and no console errors in the tested path.
- Risks: long passages can be dense and scroll-heavy; optional 3D must not increase initial load or become the only navigation surface.

## Reproduction notes

This document records the pre-consolidation state. Future results belong in dated release records and must not overwrite the tagged evidence.
