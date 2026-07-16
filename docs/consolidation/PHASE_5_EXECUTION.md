# Phase 5 execution record

Phase 5 reconciles the interactive edition with the canonical manuscript: `Eternal_Return_Manuscript` becomes the governed literary source for Narramorph while legitimate interactive differences stay preserved and reviewable (roadmap Phase 5; ADR 0002). The phase is editorial analysis plus validation engineering — complete the runtime→canonical concordance (5.1), enforce manuscript voice/philosophy/continuity rules in content validation (5.2), audit the full interactive runtime against those enforced rules (5.3, which also hosts the #156 authored-content release), and make the linear-edition product decision (5.4).

**Status: Batch 5.1 complete on the feature branch, owner review pending.** The concordance accounts for every shipped identity class, the canon contradiction register holds 12 entries (CTR-001…012, five open sev-1 canon findings among them) each with a named owner, and the literary validator enforces both — all local gates pass with every contract identity unchanged. Per the owner's lean directive, the agent-based audit was closed after 5 of 19 families: their findings were verified inline and registered, and the remaining families are covered by Batch 5.2's corpus-wide mechanical validators (pattern-level) plus the owner's Batch 5.3 sign-off reading (semantic level) — see [PHASE_5_CONCORDANCE_AUDIT.md](PHASE_5_CONCORDANCE_AUDIT.md). No canonical manuscript prose, authored runtime prose, package identity, save schema, deployment, release, or archive action has changed.

## Scope and immutable inputs

| Repository | Role | Verified commit | Mutation policy |
| --- | --- | --- | --- |
| Narramorph | Sole implementation target and concordance owner | Phase 4 merge `1ab46898851223139b9dfd564fe683c1b6bb7919` (branch base) | Feature branch and protected-main PRs only |
| Eternal_Return_Manuscript | Canonical literary/editorial source | `6720e76202951e24102997e2b8ef23e08445ab33` (read-only clone; matches the accepted literary release's sourceCommit) | Read-only; canonical prose changes only through the manuscript approval workflow with explicit operator sign-off |
| Project-Leibniz | Frozen; archive gate passed (4.5), archive execution owner-scheduled | `4f3f4600b8782aac5000b45dd64378baf318e1df` | No dependency; not consulted in Phase 5 |
| eternal-return-digital-self | Frozen control repository | `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b` | Read-only; Phase 6 concern |

Contract identities preserved through Batch 5.1 (verified by the gate runs below):

- Story Package schema `1.1.0`; interactive package `eternal-return@1.1.0`; package content hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062`
- SelectionReason `org.narramorph.selection-reason@1.0.0`; VisitEvent `org.narramorph.visit-event@1.0.0`; save schema `1.3.0`
- Literary release `eternal-return-literary-v1.0.1` (contentSha256 `667dd8d9…`) — binding unchanged
- The one deliberate metadata change: the concordance file grew from schema `1.0.0` to `1.1.0`, so both acceptance records re-pin `concordanceSha256` (ADR 0002 step 5 metadata acceptance; no prose, no release, no package identity moved)

## Guardrails carried into Phase 5

- Manuscript prose is read-only; any canonical prose change needs the operator's explicit sign-off before it is made, recorded with provenance. None occurred.
- Authored runtime prose changes are versioned content releases with line-by-line wording sign-off; batches that would touch prose stop and present the exact diff first. None occurred.
- Contradictions found during concordance work are recorded with a named owner and resolution status in `story-packages/concordance/contradictions.v1.json` — never silently fixed.
- Narramorph's build/runtime never fetches the manuscript's (or Project-Leibniz's) default branch; the audit consulted a read-only local clone pinned to the accepted release's `sourceCommit`, and only versioned, checked-in artifacts cross the boundary.
- Never bulk-copy manuscript prose into Narramorph; never auto-regenerate interactive prose; never apply the software license to literary content.

## Batch tracking

| Batch | Issue | Branch | Pull request | Status |
| --- | --- | --- | --- | --- |
| Phase tracking | [#157](https://github.com/zekusmaximus/Narramorph/issues/157) | — | — | Open |
| 5.1 complete the content concordance | [#158](https://github.com/zekusmaximus/Narramorph/issues/158) | `claude/eternal-return-phase-5-07y5q0` | _not opened_ | Complete on branch (CTR-001…012 registered; 5 open sev-1 awaiting owner decisions); owner review pending |
| 5.2 manuscript voice/philosophy checks | _TBD_ | _TBD_ | _TBD_ | Pending |
| 5.3 editorial runtime audit (+ content release #156) | _TBD_ | _TBD_ | _TBD_ | Pending |
| 5.4 canonical linear edition | _TBD_ | _TBD_ | _TBD_ | Pending; product/rights decision |

Phase bookkeeping: epic #93 gained a "Phase 5 — in progress" section; the stale Phase 4 section was reconciled to the merged reality (4.0–4.5 complete via PR #155, merge `1ab4689…`; 4.6 archive owner-scheduled) and batch issues #149–#154 were closed as completed.

## Batch 5.1 — complete the content concordance

**Acceptance gate (roadmap):** every shipped runtime item has a provenance/canon classification; every known contradiction has an owner and decision, not an implicit resolution.

### Coverage model delivered

`story-packages/concordance/eternal-return.v1.json` moved from schema `1.0.0` (19 passage mappings only) to `1.1.0` (every identity class accounted). The shipped catalog contains 19 passages, 1,014 variations, 1,014 prose beats, 3,012 conditions, 27 edges, 3 endings, 5 characters, 2 explanation records, and 0 resources; `story.json` additionally declares 6 themes and 4 motifs. Accounting per class:

| Identity class | Mechanism | Notes |
| --- | --- | --- |
| Passages (19) | Per-item mappings (unchanged from 1.0.0 — every original field value preserved verbatim) | Anchor layer; slice-pinned arrays untouched |
| Variations (1,014) | Per-passage `variations` policy block: `coversAllVariations`, `variationCount` (validated against the catalog per family and in total), `selectionAxes`, `sampledVariationIds` | Family-level with a sampled editorial audit (84 sampled items; see audit doc) |
| Prose beats (1,014) | Explicit exemption: inherit the parent variation family | Beat stable keys embed the ordinal and re-mint on re-segmentation — never keyed per-beat |
| Conditions (3,012) | Explicit exemption: mechanical selection predicates | No prose; identity derives from the owning variation |
| Edges (27) | `edges` section: blanket interactive-only-connective, all 27 stable keys enumerated (set equality enforced) | Reserves the rule that any future authored bridge declares its own relationship and attaches to a traversed within-perspective edge |
| Endings (3) | `endings` section: per-item, `endingId`/`stableKey`/`passageId` joins enforced against the catalog | Ending-claim wording per ending recorded |
| Characters (5) | `characters` section: per-item character→voice join; three `canonical-voice` rows (each claiming exactly one `er-character-*`, all three claimed) and two `runtime-composite` rows | Resolves CTR-003 (catalog `human` ↔ canonical `last-human`) |
| Explanations (2) | `explanations` section: per-item, classification must end `-no-literary-claim` | Governance records can never carry a literary claim |
| Resources (0) | Explicit exemption | Technical file inventory |
| Themes/motifs (10) | `themesAndMotifs` section mapped to release constraint/glossary IDs; set equality with `story.json` enforced | e.g. echoes/recursive loops → eternal return; fragments → tertiary retention |
| Choices / code-level explanation strings | Documented exemptions | No standalone package identity exists |

### Contradiction register delivered

`story-packages/concordance/contradictions.v1.json` (schema `1.0.0`, documentation mirror at `schemas/concordance/v1/contradiction-register.schema.json`): every entry carries id (CTR-NNN), category, severity (sev-1 canon / sev-2 misleading / sev-3 hygiene), evidence, named owner, status (open / accepted-as-is / resolved), decision (required once not open), and resolvedBy (required once resolved) — all enforced by `validateContradictionRegister`, which runs inside `literary:validate`. Open sev-1 entries are surfaced in the CLI summary and block the Phase 5.3 gate, not CI. Seeded findings CTR-001…004 (totalNodes 18 vs 19 passages; 284 tracked `*.json.tmp` files; the character/voice join gap, resolved by this batch; the manuscript-side stale "Phase D" reference). Audit findings extend the register — see [PHASE_5_CONCORDANCE_AUDIT.md](PHASE_5_CONCORDANCE_AUDIT.md).

### Validator extension delivered

`tools/conversion/lib/literary-release.ts` (`validateLiteraryConcordance`, new `validateContradictionRegister`, `summarizeContradictions`):

- new `LITERARY_CONCORDANCE_SCHEMA_VERSION = '1.1.0'` decoupled from the intake/acceptance schema (still `1.0.0`, so acceptance-record shapes are untouched);
- identity-class accounting: every top-level catalog collection must be covered by a section, a family policy, or an explicit exemption whose count matches the catalog — an unaccounted class (e.g. a future `bridges` collection) fails validation;
- per-family variation counts, per-family sample membership, family-count sum == catalog total; ending/character/explanation 1:1 joins with stable-key and passage checks; canonical characters claimed exactly once and completely; edge stable-key set equality; theme set equality against `src/data/stories/eternal-return/story.json` (loaded by `verifyLiteraryIntake`) and canonical-ID existence.
- `npm run literary:validate` output now reports coverage and contradiction summaries.

Documentation JSON Schemas added at `schemas/concordance/v1/` (concordance + contradiction register), mirroring the story-package schema convention; the TypeScript validator remains authoritative.

### Acceptance-record re-pin (the one deliberate metadata change)

Both acceptance records — `literary-releases/accepted/eternal-return.json` and `literary-releases/accepted/eternal-return-vertical-slice.json` — re-pin `concordanceSha256` to the 1.1.0 concordance. Release identity, asset hashes, source commit, story-package identity, runtime-prose policy, and the reviewed diff/stage records are byte-identical. `literary:stage` classifies the release as `no-semantic-change`; the slice's original `initial-intake` review record stands.

### Editorial audit

Method, verified results, and the lean coverage plan: [PHASE_5_CONCORDANCE_AUDIT.md](PHASE_5_CONCORDANCE_AUDIT.md). Five family audits (all L1 plus two arch-L2) ran against the Four Shackles, forbidden narrative moves, per-voice fingerprints, chronology/era rules, controlled terminology, canonical names, and the designed-repetition allowlist; the owner then closed agent-based auditing on cost. Every finding was verified inline (quotes checked against runtime files and the pinned manuscript; spread measured with corpus-wide scans) and consolidated into register entries CTR-005…012 — five sev-1 canon findings (invented era-state/names, absolute compressed dating, a Four Shackles identity violation, bootstrap-paradox exposition, archaeologist character-identity divergence) and three sev-2 findings (concordance chronology/promise metadata errors, algorithm-voice contamination, family-internal continuity breaks). The 14 un-audited families are covered at pattern level by Batch 5.2's corpus-wide validators and at semantic level by the owner's 5.3 reading; that residual risk is recorded. None of the findings was silently fixed.

### Evidence (local verification on Node 22)

- `tools/conversion`: `npx tsc --noEmit` pass; `npx vitest run` 13 files / 151 tests pass (was 143; +8 concordance-coverage and register tests).
- `npm run type-check`: pass. `npm run lint:ci`: 0 errors / 32 warnings (Phase 3/4 baseline held).
- `npm run test:run`: 55 files / 320 tests pass (unchanged from Phase 4 closure — no runtime code changed).
- `npm run story:package:validate`: all three packages valid; `eternal-return@1.1.0` hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062` unchanged.
- `npm run content:validate:runtime`: 8 tests pass.
- `npm run literary:stage eternal-return-literary-v1.0.1`: staged, classification `no-semantic-change`.
- `npm run literary:validate`: `valid accepted literary release=eternal-return-literary-v1.0.1 package=eternal-return@1.1.0 passages=19 mappings=19 coverage=variations:1014,endings:3,characters:5,edges:27,explanations:2,themes:10 contradictions=total:4,open:3,open-sev-1:0` (counts prior to audit incorporation; final counts in the audit doc).
- `npm run literary:slice:validate`: `valid accepted literary slice=archaeologist-opening-accept@1.0.0 … path=arch-L1->arch-L2-accept`.
- `npm run build`: pass.
- Playwright core journeys (`reader-journey`, `phase-3-path-coverage`) pass 6/6 against the installed sandbox Chromium via a throwaway (deleted, never committed) launch-path override; the pinned headless-shell revision is absent in this sandbox, and the full 17-scenario matrix runs in protected-main CI.

## Batch 5.2 — manuscript voice/philosophy checks (pending)

Recon findings that shape 5.2, recorded here so the design conversation starts from evidence:

- The literary release exports structured voice markers/forbidden lists (machine-checkable today) but only constraint IDs/titles for philosophy; the enforcement rules (shackle patterns, forbidden-move lexicons, pharmakon pairing) live solely in the manuscript repo's stdlib-only Python validators (`voice_validator.py`, `philosophy_checker.py`, …), which emit per-file JSON that CI discards.
- The release has NO rhyme-registry, name-index, or ending-claims namespaces; its context key set is closed (`additionalProperties: false`, exact set equality), so exporting them requires a coordinated M-side exporter/schema/policy version bump (roadmap grants M-W for 5.2 report/export changes). The alternative — porting rule data into Narramorph with pinned provenance — avoids touching M but makes N the de-facto rule authority. Decision owed in 5.2 planning.
- Designed repetition (15 sensory rhymes, phrase bleeding, the shared form-sentence) must be allowlisted before any duplication heuristics ship.
- No waiver mechanism exists anywhere in N's validation; the acceptance-record pattern (hash-pinned human-committed JSON) is the established shape for "human signed off on this exception."

## Closure evidence

- _TBD once Batches 5.1–5.4 meet their gates and epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is updated._
