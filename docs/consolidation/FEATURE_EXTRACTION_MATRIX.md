# Feature extraction matrix

Status values: `migrate`, `reimplement`, `reject`, `defer`, `complete`.

No reference repository may be archived until every row for that repository is `complete` or has an owner-approved rejection/defer record.

## Project-Leibniz

Project-Leibniz dispositions were re-verified in the [Batch 4.5 parity review](PHASE_4_LEIBNIZ_PARITY.md) (all nine adversarially confirmed). Archive is blocked only on owner acceptance (gate condition 7).

| Capability | Source | Decision | Narramorph target | Required proof | Archive dependency |
| --- | --- | --- | --- | --- | --- |
| Serializable order-aware conditions | `client/src/services/conditionDSL.ts` | Complete — reimplemented (Phase 3.2) | Story Package condition schema and pure domain evaluator | Met: `conditions.test.ts` covers start/end, relative order, adjacency, recency, visit counts, boolean composition, fail-closed | Yes |
| Plain-language selection explanations | `client/src/pages/NarrativePage.tsx`, condition descriptions | Complete — migrated (Phase 3) | `SelectionReason`, “Why this version?”, journey ledger | Met: reader-safe closed templates, no spoiler leakage, persist after reload | Yes |
| Compositional prose beats | `client/src/context/StoryTypes.ts`, `client/src/services/StoryLogicService.ts` | Complete — reimplemented (Batch 4.1) | Optional story-package `proseBeats` and deterministic renderer | Met: `proseBeats.test.ts`, byte-invariant identity path, exact-save replay via snapshot. Reference-node conversion deferred to the 4.6 editorial pass | Yes |
| Condition-aware edge prose | `client/src/data/storyGraph.json`, `StoryLogicService.ts` | Complete — reimplemented (Batch 4.2) | Optional edge bridge schema/render/export | Met: `edgeBridge.test.ts` + `StoryBridge.test.tsx`, bounds, accessibility. Authored bridge prose deferred to the 4.6 editorial pass | Yes |
| Exact experienced-journey Markdown export | `client/src/services/narrativeExport.ts` | Complete — reimplemented (Batches 4.3–4.4) | Journey export service and accessible UI | Met: `journeyExport.test.ts` covers repeats/order/Unicode/migration; exact snapshot export | Yes |
| Adaptation ledger UX | Narrative page controls | Complete — migrated (Phase 3.3) | Progress/history surface | Met: `AdaptationLedger.test.tsx` + browser progress-dialog journeys | Yes |
| Express/Mongo backend | `server/` | Reject (complete) — ADR 0005 | None; future backend requires separate ADR | Met: no mongo/express dependency; credential revocation confirmed (Batch 0.2) | Yes |
| React Context/reducer state architecture | `client/src/context/` | Reject (complete) — ADR 0003/0005 | Existing Zustand/domain boundaries remain authoritative | Met: single authoritative journey state; no imported Context/reducer | Yes |
| D3 force-map visual design | `client/src/components/NodeMap.tsx` | Reject (complete) — ADR 0005 | Existing accessible 2D map | Met: graph behavior preserved; accessible map retained | No |

## eternal-return-digital-self

| Capability | Source | Decision | Narramorph target | Required proof | Archive dependency |
| --- | --- | --- | --- | --- | --- |
| Cinematic first-run overlay | `src/components/Onboarding/IntroductionOverlay.tsx` | Clean-room reimplementation | Accessible first-run experience | Skip/replay, keyboard, focus, reduced motion, 200% text, mobile, comprehension testing | Yes |
| Animated node demonstration | Onboarding components/styles | Reimplement with semantic equivalent | Onboarding illustration plus text alternative | Reduced-motion static equivalent; not canvas-only | Yes |
| Help entry and replayable guidance | `HelpIcon.tsx`, `Onboarding.tsx` | Migrate concept | Narramorph Help/settings | Focus and screen-reader tests | Yes |
| Cosmic visual atmosphere | `app.css`, constellation styles/components | Selectively reimplement | Design tokens and decorative layers | Contrast, motion, prose readability, performance | Yes |
| Instanced/batched 3D rendering | `NodesInstanced.tsx`, `ConnectionsBatched.tsx` | Defer pending profiling | Experimental 3D only | Measured improvement on representative hardware; WebGL fallback | Yes |
| Mini constellation | `MiniConstellation.tsx` | Compare with current progress/map context | Reader context if user testing supports it | Mobile and accessibility proof | Yes |
| Marginalia sidebar | `MarginaliaSidebar.tsx` | Defer to product/editorial decision | Optional explanation/annotation surface | Does not duplicate adaptation ledger or crowd prose | Yes |
| Duplicate Redux/domain/infrastructure stacks | `src/store`, `src/domain`, `src/infrastructure` | Reject | None | Architecture record | Yes |
| Current node reader/transform renderer | `src/components/NodeView`, transformation services | Reject as implementation | Existing Narramorph reader/selection architecture | The tested blank-content and first-visit/revisit defects are absent | Yes |
| Checked-in `dist` output | `dist/` | Reject as source practice | CI-built release artifacts | Release pipeline produces artifacts without tracking build output | No |

## Issue disposition

GitHub reported no open issues in either reference repository on July 13, 2026. Future extraction work is tracked only in Narramorph.
