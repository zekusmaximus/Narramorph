# Eternal Return Product Consolidation Roadmap

**Planning baseline:** July 13, 2026  
**Primary application:** `zekusmaximus/Narramorph`  
**Canonical literary/editorial source:** `zekusmaximus/Eternal_Return_Manuscript`  
**Temporary reference repositories:** `zekusmaximus/Project-Leibniz`, `zekusmaximus/eternal-return-digital-self`

## Execution status

Updated: July 13, 2026

| Batch | Status | Evidence / remaining gate |
| --- | --- | --- |
| 0.1 — Product charter and repository roles | Implementation complete; awaiting acceptance | Charter, boundary ADR, freeze notices, milestone, and tracking issues are implemented in coordinated draft PRs; review and merge remain. |
| 0.2 — Licensing and provenance | Awaiting owner decision while non-license work proceeds | Proposed split: MIT software code; narrative/story content all rights reserved with explicit permission for approved manuscript-derived material to ship in Narramorph. External confirmation of the historical Leibniz credential revocation is also required. |
| 0.3 — Baselines and extraction inventory | Implementation complete; awaiting acceptance | `pre-consolidation-2026-07-13` is published in all four repositories; verified baseline records and the extraction matrix are implemented; no legacy issues require migration. Coordinated PR review and merge remain. |

The detailed evidence and PR links are maintained in [the Phase 0 execution record](consolidation/PHASE_0_EXECUTION.md).

## 1. Executive decision

The final product should be built and shipped from **Narramorph**. It already has the strongest product shell, the complete runtime story, the most mature data-validation pipeline, the best accessibility posture, and the only full end-to-end browser suite. It should not be replaced by a merged monorepo or rewritten around either older implementation.

`Eternal_Return_Manuscript` should remain active as a separate repository because it serves a fundamentally different purpose: it is the canonical long-form manuscript and editorial control system. It should feed approved, versioned literary material and story-bible constraints into Narramorph through a defined export/import contract. It should not become an npm workspace inside Narramorph, and manuscript prose should not be casually duplicated or edited in the application repository.

`Project-Leibniz` and `eternal-return-digital-self` should enter **feature freeze immediately**. They remain available as reference implementations only while their useful ideas are inventoried, reimplemented or deliberately rejected, tested in Narramorph, and attributed. Each has a precise archive gate later in this roadmap.

The recommended v1 product is a **static, client-side interactive literary experience** with local persistence, deterministic path-sensitive content, exportable journeys, strong accessibility, and a production deployment pipeline. Accounts, cloud saves, multiplayer behavior, and a MongoDB backend are explicitly outside the v1 critical path unless the product owner changes the charter before Phase 8.

## 2. Intended final repository state

### 2.1 Active repositories after consolidation

1. **Narramorph — active, shippable application**
   - React/TypeScript application and accessible reader experience.
   - Runtime story packages, schemas, loaders, selection logic, tests, conversion tooling, release configuration, and deployment documentation.
   - Versioned records describing which manuscript/editorial release informed each runtime content release.
   - No dependency on either archived reference repository at build or runtime.

2. **Eternal_Return_Manuscript — active, canonical literary source**
   - Canonical long-form prose, story bible, voice rules, philosophy constraints, structure map, editorial records, and continuity tooling.
   - A deterministic export command that produces a machine-readable, versioned literary release bundle without mutating manuscript prose.
   - Clear separation between all-rights-reserved literary content and application source-code licensing.
   - No dependency on Narramorph to edit, assemble, or verify the manuscript.

### 2.2 Archived repositories after consolidation

3. **Project-Leibniz — archived after Phase 4**
   - Preserved as a read-only historical reference.
   - Its condition ideas, adaptation explanations, compositional prose model, edge prose, and journey export must either exist in Narramorph or be explicitly rejected in an architecture decision record before archival.
   - Its Express/Mongo backend is not migrated for v1.

4. **eternal-return-digital-self — archived after Phase 6**
   - Preserved as a read-only visual and interaction prototype.
   - Its first-run onboarding, animated-node demonstration, selected visual language, and any useful 3D optimization ideas must be integrated or explicitly rejected before archival.
   - Its duplicate state/domain architecture and broken reading path are not migrated.

## 3. Access notation and working rules

The access requirements below use these abbreviations:

- **R** — repository read access. Public access is sufficient when the repository remains public.
- **W** — branch creation, push, and pull-request creation rights. Direct writes to the default branch are not required.
- **A** — repository administration rights, required for GitHub's archive toggle, branch protection, repository metadata, secrets, environments, and some deployment settings.
- **Content approval** — explicit operator approval required under the manuscript repository's standing rules before an agent changes canonical prose.

Repository abbreviations:

- **N** — Narramorph
- **M** — Eternal_Return_Manuscript
- **L** — Project-Leibniz
- **P** — eternal-return-digital-self, the older prototype

Global implementation rules:

1. Every batch should be delivered as one focused pull request unless the batch explicitly calls for coordinated PRs in N and M.
2. A cross-repository batch must state which PR lands first and what compatibility state exists between merges.
3. No build in N may fetch source directly from L, P, or the GitHub default branch of M. Inputs must be released artifacts or checked-in, versioned packages.
4. Canonical manuscript prose is read-only by default. Agents may create analysis, concordance, schemas, exporters, and editorial proposals without prose-edit permission; prose changes still require the repository's approval workflow.
5. Reference repositories enter feature freeze in Phase 0. Only documentation, security, attribution, and archival-preparation changes are permitted after that point.
6. Archive means GitHub's read-only archive state after a final tag and notice; it does not mean deleting repositories or rewriting their history.

## 4. Definition of “shippable”

The product is ready for general availability only when all of the following are true:

- A first-time reader can understand how to begin without external instructions.
- The complete supported L1→L2→L3→L4 journey works with pointer, keyboard, touch, and reduced motion.
- Every shipped ending is reachable through tested, deterministic conditions.
- Save migration, reset, recovery, import/export, and corrupt-state behavior are tested.
- The application has no known blocker/critical runtime defects and no unreviewed critical dependency advisories.
- Production bundle and interaction budgets pass on representative desktop and mid-range mobile hardware.
- The application works at 200% text scaling and has no horizontal overflow at supported mobile widths.
- A manual screen-reader pass has been completed on at least NVDA/Firefox or NVDA/Chrome and VoiceOver/Safari.
- Literary content has passed schema validation, voice/philosophy checks, attribution/provenance checks, and editorial approval.
- Code and content licensing are explicit and non-contradictory.
- Production deployment, rollback, error monitoring, privacy documentation, backups, and incident ownership exist.
- L and P are archived or have a documented, owner-approved reason to remain active.

---

# Phase 0 — Governance, licensing, freeze, and immutable baselines

**Purpose:** Prevent consolidation work from creating four moving targets, preserve the current state for comparison, and resolve licensing before any code or prose is copied.

**Order constraint:** Nothing may be ported between repositories until Batch 0.2 is complete.

## Batch 0.1 — Approve the product charter and repository roles

**Work**

- Add `docs/PRODUCT_CHARTER.md` to N describing the target audience, primary reading journey, supported platforms, v1 scope, and explicit non-goals.
- Record the two-active/two-reference repository model in an architecture decision record, such as `docs/adr/0001-repository-boundaries.md`.
- State that N is the only deployable application and M is the only canonical long-form prose/editorial source.
- State that v1 is static/client-side with local persistence. Create a formal decision gate for cloud accounts rather than inheriting L's backend by accident.
- Add a freeze notice to the READMEs of L and P: no new feature development; changes are limited to extraction support, security notices, and archival preparation.
- Define a single planning board or issue milestone in N for every batch in this roadmap. Link cross-repository issues from that board.

**Deliverables**

- Product charter.
- Repository-boundary ADR.
- Freeze notices in L and P.
- Consolidation milestone and labeled issues in N.

**Acceptance gate**

- The owner explicitly approves the target repository model and v1 non-goals.
- There is one authoritative backlog rather than independent roadmaps in four repositories.

**Agent access:** N-W, L-W, P-W; M-R.  
**Estimated effort:** 1–2 agent-days.

## Batch 0.2 — Resolve code, content, and cross-repository licensing

**Why this is first:** N and P claim MIT in their READMEs but currently lack license files; L lacks a root license; M says all rights reserved. Copying code or prose before clarifying these boundaries creates avoidable ownership and redistribution ambiguity.

**Work**

- Choose a software license for code in N, L, and P and add the actual license file.
- Add `CONTENT_LICENSE.md` to N defining the rights for narrative prose, story data, character material, and generated content. Do not assume the software license applies to literary content.
- Add or clarify the all-rights-reserved literary notice in M, including whether derived interactive passages may be distributed inside N and under what terms.
- Add `THIRD_PARTY_NOTICES.md` and `docs/PROVENANCE.md` to N.
- Identify exact source files or concepts expected to be reimplemented from L and P. Record whether the transfer is a clean reimplementation, a direct copy, or an adapted design.
- Rotate or verify revocation of the historical MongoDB credential documented in L. Archiving never substitutes for secret rotation.
- Decide whether generated content and AI-assisted prose need disclosure or provenance metadata.

**Deliverables**

- Explicit software and literary-content licenses.
- Third-party attribution and provenance policy.
- Written permission/provenance for M-derived runtime content.
- Confirmation that L's historical database credential is unusable.

**Acceptance gate**

- A reviewer can answer, for every copied/adapted artifact, who owns it and which license applies.
- No batch after Phase 0 needs to guess whether manuscript prose can be shipped in N.

**Agent access:** N-W, M-W, L-W, P-W; owner/legal decision required.  
**Estimated effort:** 1–3 days plus owner/legal review.

## Batch 0.3 — Tag baselines and create an extraction inventory

**Work**

- Tag the reviewed default-branch state of every repository, for example `pre-consolidation-2026-07-13`.
- In N, record the verified baseline: production build, 163 unit/component tests, nine browser tests, lint warnings, bundle sizes, and dependency-audit results.
- In L, record the verified client baseline: build, lint, 137 tests, backend syntax checks, missing server tests, offline fallback behavior, and known UX problems.
- In P, record build success, lint failure, lack of a normal test script, checked-in `dist`, first-run strengths, and the tested blank-content/revisit defect.
- In M, record live script results: 28 canonical chapters, roughly 85,100 words, successful assembly/ending verification, completed roadmap, stale README figures, and the Windows console failure in `edit_status.py`.
- Create `docs/consolidation/FEATURE_EXTRACTION_MATRIX.md` in N. For every candidate capability from L and P, record source location, target location, decision owner, migration status, tests required, and eventual archive dependency.
- Export or migrate open issues from L and P into N. Preserve source links and close only after the N issue exists.

**Acceptance gate**

- Each reference capability has one of three states: migrate, reimplement, or reject.
- Every current issue in L/P is either moved, explicitly closed as obsolete, or listed as an archive exception.

**Agent access:** N-W; M-R, L-R, P-R. Tag creation needs W in all four repositories if delegated.  
**Estimated effort:** 2–3 days.

---

# Phase 1 — Make Narramorph a stable product integration target

**Purpose:** Establish a trustworthy landing zone before importing ideas or content.

**Dependencies:** Phase 0 complete.

## Batch 1.1 — Correct current documentation and package metadata

**Work**

- Reconcile N's README with its current status: remove the obsolete “three endings in progress” and 99.8% claims if L4 is complete.
- Correct repository structure examples so they match the actual `src/data/stories/eternal-return` layout.
- Replace placeholder package author metadata.
- Add supported Node/npm versions, tested browsers, deployment status, data/privacy behavior, and content-license links.
- Add `docs/RELEASE_STATUS.md` with an explicit alpha/beta/RC/GA state; do not use content-completion percentages as a proxy for product readiness.
- Correct M's README chapter and word-count claims from live scripts.
- Fix `scripts/edit_status.py` to use UTF-8-safe output on Windows and add a regression test or subprocess smoke check.

**Acceptance gate**

- README claims are generated from or manually reconciled against live validators.
- A new contributor can run both repositories on Windows without following stale paths.

**Agent access:** N-W, M-W.  
**Estimated effort:** 1–2 days.

## Batch 1.2 — Consolidate CI into release-quality required checks

**Work**

- Make N CI run clean install, type check, lint, formatting, unit/component tests, runtime-content validation, conversion-tool tests, production build, and Playwright browser tests.
- Split fast PR checks from slower browser/content jobs while keeping every release check required on `main`.
- Upload failed Playwright traces and screenshots with short retention.
- Add coverage reporting for domain logic and critical UI boundaries; set an initial floor based on current coverage rather than an arbitrary 100% target.
- Add a bundle-size report and enforce initial regression budgets.
- Add dependency review and secret scanning.
- Configure branch protection so `main` requires PR review and passing checks.
- Add equivalent lightweight CI to M: stats, assembly, ending verification, continuity generation check, UTF-8/status smoke check, and any existing voice/philosophy validators.

**Acceptance gate**

- A clean clone on CI reproduces all checks without local-only state.
- A deliberately malformed story package and a deliberately truncated manuscript ending both fail CI.

**Agent access:** N-W/A, M-W/A.  
**Estimated effort:** 3–5 days.

## Batch 1.3 — Dependency and security stabilization

**Work**

- Review every critical/high audit result in N by dependency path and runtime reachability.
- Upgrade or replace vulnerable packages in small groups, retaining separate PRs for React/Three/React Flow/tooling changes where behavior risk differs.
- Update browserslist/baseline data and document the browser-support policy.
- Add automated dependency updates with grouped, scheduled PRs and CI.
- Verify no `.env`, database URL, generated archive, or deployment token is tracked.
- Add a basic security policy and vulnerability-reporting contact.
- Apply the same secret scan to M even though it is not deployed.

**Acceptance gate**

- No unreviewed critical dependency advisory remains.
- Any accepted advisory has a documented risk assessment, owner, and deadline.
- Builds and all tests still pass after upgrades.

**Agent access:** N-W; M-R/W only if findings require changes.  
**Estimated effort:** 3–7 days depending on upgrade breakage.

## Batch 1.4 — Establish initial performance budgets and lazy boundaries

**Why now:** N's current production main chunk is roughly 11.3 MB minified. New features must not be layered onto that startup cost without a budget and loading strategy.

**Work**

- Capture baseline bundle composition, first-load network cost, parse/evaluation time, LCP, interaction latency, and map responsiveness on desktop and mid-range mobile emulation.
- Separate application shell, 2D map, experimental 3D view, L1/L2 story data, L3 convergence data, L4 endings, and development/debug tooling into intentional chunks.
- Remove debug-only panels and source maps from production delivery where appropriate while retaining uploaded private source maps for monitoring.
- Lazy-load the 3D stack only after the reader requests 3D.
- Load story layers on demand or prefetch them after the initial perspective choice.
- Add visible but quiet loading/error states that preserve keyboard focus.
- Set budgets for initial compressed JS, per-story package size, LCP, CLS, and interaction responsiveness.

**Acceptance gate**

- The opening shell no longer requires downloading the complete story and 3D engine.
- Performance checks fail on meaningful regression.
- All existing browser tests pass under the new loading boundaries.

**Agent access:** N-W.  
**Estimated effort:** 5–10 days.

---

# Phase 2 — Create the manuscript-to-runtime content contract

**Purpose:** Make M and N cooperate without duplicating authority or coupling their builds.

**Dependencies:** Phases 0–1 complete. This phase must precede a large editorial/content rewrite in N.

## Batch 2.1 — Define content authority and edition semantics

**Work**

- Write an ADR defining three distinct artifacts:
  1. canonical long-form manuscript;
  2. interactive runtime edition;
  3. reader-specific exported journey.
- State which facts must remain canonically aligned across editions: character identities, chronology, philosophical constraints, terminology, major causal relationships, and ending claims.
- State which elements may intentionally differ: order, passage length, second-person framing, repetition frequency, unlock structure, choice language, and interactive-only explanations.
- Define an approval workflow for turning a manuscript/editorial change into a runtime-content change.
- Define whether N runtime content is hand-authored, generated, or hybrid. The recommended model is hybrid: authored runtime passages with automated concordance and validation, not automatic conversion of an 85,000-word novel into nodes.

**Deliverables**

- Content-authority ADR in N.
- Matching cross-reference in M's editorial workflow.

**Acceptance gate**

- There is no scenario in which an agent silently overwrites manuscript prose from N or silently overwrites runtime prose from M.

**Agent access:** N-W, M-W; M content approval not needed unless prose changes are proposed.  
**Estimated effort:** 2–3 days.

## Batch 2.2 — Design Story Package Contract v1

**Work**

- Define a versioned package manifest containing story ID, semantic version, source manuscript commit, editorial release ID, schema version, content license, generated timestamp, deterministic content hash, supported app version, layer counts, passage IDs, and provenance links.
- Define stable identifiers that survive title/file renames.
- Define schemas for characters, passages, variations, conditions, prose beats, edges, endings, and explanation metadata.
- Distinguish authored source files from generated runtime files and mark do-not-edit boundaries.
- Define compatibility rules: which schema changes are backward compatible, which require app upgrades, and how old saved journeys identify their content version.
- Add two tiny fixture stories to prove the contract is not accidentally hard-coded to Eternal Return.

**Acceptance gate**

- N can validate two fixture packages plus Eternal Return without special-case paths in the validator.
- A package built twice from identical inputs has identical IDs, ordering, and content hashes.

**Agent access:** N-W; M-R for source constraints.  
**Estimated effort:** 4–7 days.

## Batch 2.3 — Add a non-mutating literary release exporter to M

**Work**

- Add a stdlib-only Python command such as `python scripts/export_runtime_source.py --release <id>`.
- Export structure map, character/voice metadata, philosophical constraints, chronology, approved glossary, chapter identifiers, scene summaries, promise/payoff ledger references, and optionally approved excerpts.
- Do not export arbitrary prose by default. Excerpts must be explicitly marked as approved for interactive use.
- Include source commit, release ID, file hashes, content license, and validation results.
- Make output deterministic and place build artifacts in a git-ignored directory.
- Add schema validation using only mechanisms compatible with M's stdlib-only rule, or validate the exported JSON in N after transfer while M verifies its own required keys/hashes.

**Acceptance gate**

- The exporter does not modify manuscript files.
- Repeated exports from the same commit are byte-stable except for fields explicitly excluded from the hash.
- Assembly and ending verification still pass.

**Agent access:** M-W; N-R for the target contract. No manuscript prose-edit approval required.  
**Estimated effort:** 4–6 days.

## Batch 2.4 — Add the corresponding importer and concordance validator to N

**Work**

- Add a command that imports a released M artifact into a staging location, verifies hashes and schema compatibility, and produces a human-readable diff before any checked-in runtime metadata changes.
- Create a concordance file mapping N passage/node IDs to M chapter IDs, scenes, voices, themes, causal promises/payoffs, and philosophical constraints.
- Validate that every shipped N passage has a declared canonical relationship: direct adaptation, thematic derivative, interactive-only connective material, or independent runtime material.
- Fail on unknown source releases, incompatible schema versions, missing license metadata, or unmapped canonical claims.
- Store the accepted literary release metadata in N; do not store credentials or depend on GitHub at runtime.

**Acceptance gate**

- An agent can explain the provenance of any runtime passage.
- Updating the M release produces a reviewable semantic diff rather than silently rewriting hundreds of JSON files.

**Agent access:** N-W, M-R.  
**Estimated effort:** 4–7 days.

## Batch 2.5 — Prove the contract with one vertical slice

**Work**

- Select one perspective's opening passage and one connected L2 passage.
- Export their canonical context from M, update the concordance, validate N's existing runtime passages against voice/philosophy constraints, and make only explicitly approved content changes.
- Record the M release ID and N story-package version.
- Exercise the complete reader path, save/reload, explanation metadata, and export behavior for the slice.
- Document the two-PR merge order: M exporter/release first, N importer/concordance second.

**Acceptance gate**

- The workflow is understandable to a second agent using only repository documentation.
- No manual copy/paste step exists without provenance.

**Agent access:** M-W then N-W; content approval required only for actual prose edits.  
**Estimated effort:** 3–5 days.

---

# Phase 3 — Port Project-Leibniz's explainability and condition strengths

**Purpose:** Preserve the best conceptual contribution from L: readers can understand how their path changed the prose.

**Dependencies:** Story Package Contract v1 and provenance policy complete.

## Batch 3.1 — Produce the Leibniz-to-Narramorph semantic gap analysis

**Work**

- Compare L's condition DSL against N's condition evaluator and selection context.
- Map each L condition—history start/end, relative order, immediate adjacency, recency, visit count, flags, boolean composition—to an existing N capability, a required extension, or a deliberate rejection.
- Compare L's state history with N's visit history, variation history, awareness, character switches, philosophy choices, and L3/L4 data.
- Define a normalized `SelectionReason` model containing machine-readable triggers plus plain-language explanations.
- Decide that N's existing domain/state architecture remains authoritative; do not import L's React Context or singleton service patterns.

**Acceptance gate**

- Every L condition is accounted for.
- The design adds no second competing source of journey state.

**Agent access:** N-W, L-R.  
**Estimated effort:** 2–4 days.

## Batch 3.2 — Extend N's condition model and explanation compiler

**Work**

- Add only missing condition primitives to the versioned story schema.
- Implement pure evaluators with explicit inputs and no hidden mutable singleton state.
- Add a compiler that turns a condition result into safe, localized reader-facing language such as “because you began with…” or “after returning here from…”.
- Separate author/debug detail from reader language. The reader should never see internal node IDs or raw JSON predicates.
- Preserve deterministic priority and fallback behavior.
- Add property-style tests for boolean composition, ordering, repeated visits, save restoration, and backward compatibility.

**Acceptance gate**

- Existing packages and saves remain valid or migrate explicitly.
- Every selected adaptive fragment can optionally emit a stable explanation object.

**Agent access:** N-W, L-R.  
**Estimated effort:** 4–7 days.

## Batch 3.3 — Add “Why this passage?” and journey-adaptation ledger UI

**Work**

- Add a quiet, optional “Why this version?” disclosure inside the story reader.
- Add a journey-wide ledger reachable from progress, inspired by L's “How your journey has adapted.”
- Show passage title, short excerpt, trigger explanation, and position in the reader's history.
- Ensure explanations are available after reload from persisted selection records, not recomputed against a later state.
- Add keyboard, screen-reader, focus-management, reduced-motion, mobile, and 200%-text coverage.
- Avoid exposing spoilers: future conditions and locked outcomes must not appear.

**Acceptance gate**

- A reader can understand at least one path-sensitive change without developer tooling.
- The feature is optional and does not interrupt uninterrupted literary reading.

**Agent access:** N-W, L-R.  
**Estimated effort:** 4–6 days.

## Batch 3.4 — Author and validate explanation metadata for the full runtime story

**Work**

- Add human-reviewed explanation templates for every shipped condition category.
- Audit all L1/L2 variation groups, L3 assembly criteria, and L4 selection reasons.
- Add automated checks for missing explanations, raw IDs, contradictory language, and spoiler leakage.
- Add representative end-to-end journeys for each philosophical path and ending.

**Acceptance gate**

- Every adaptive selection in supported journeys has a comprehensible explanation.
- No explanation changes the selection outcome.

**Agent access:** N-W; M-R for terminology/voice constraints; L-R as reference.  
**Estimated effort:** 5–10 days, much of it editorial QA.

---

# Phase 4 — Port compositional prose, edge prose, and journey export; archive Project-Leibniz

**Purpose:** Capture L's remaining valuable reader-facing ideas and then eliminate it as an active maintenance surface.

**Dependencies:** Phase 3 explanation model stable.

## Batch 4.1 — Introduce optional compositional prose beats

**Work**

- Add an optional `proseBeats` representation to Story Package Contract v1 or v1.1.
- A beat should contain ordered alternative phrasings, conditions, priority, omission behavior, explanation metadata, and a deterministic fallback.
- Resolve beats into one continuous passage before Markdown rendering.
- Keep existing whole-passage variations fully supported; migration must be incremental.
- Preserve typography, sanitization, reading-time calculation, export behavior, and exact selected-phrasing history.
- Convert one reference node per perspective, then compare editorial quality and complexity against whole-passage variations.

**Acceptance gate**

- Authors can choose between passage variations and compositional beats without duplicating state logic.
- A saved journey reopens with the exact same resolved prose.

**Agent access:** N-W, L-R; M-R and content approval if wording changes.  
**Estimated effort:** 5–8 days plus editorial review.

## Batch 4.2 — Add optional condition-aware edge prose

**Work**

- Extend connections with short bridge prose that can vary by state.
- Render bridges at passage entry and in exports, but do not treat them as separate visited nodes unless explicitly authored that way.
- Define accessibility and animation behavior; bridges must not disappear before assistive technology can read them.
- Add limits so edge prose cannot become an unbounded second content system.

**Acceptance gate**

- At least one journey reads more smoothly without changing graph progression.
- Edge prose has provenance, validation, explanation, and export coverage.

**Agent access:** N-W, L-R; M-R/content approval for canonical connective prose.  
**Estimated effort:** 3–5 days.

## Batch 4.3 — Make the visit event log export-grade

**Why before export:** Replaying the current story against final state can produce text different from what the reader originally saw. Export must use an immutable record of the experienced journey.

**Work**

- Define a versioned `VisitEvent` containing sequence number, node/passage ID, story version, visit number, selected variation/beat IDs, resolved-text hash, bridge ID, selection reasons, reader choice, and timestamp policy.
- Decide whether to store resolved prose or enough immutable identifiers to reproduce it. Store a resolved snapshot when a later content update could otherwise change old journeys.
- Migrate existing saves and define graceful behavior when old data lacks full snapshots.
- Add size limits and privacy documentation for local history.

**Acceptance gate**

- Exported text exactly matches the text observed at each visit, including revisits.
- Old saves remain readable and are clearly labeled when exact reconstruction is impossible.

**Agent access:** N-W.  
**Estimated effort:** 4–7 days.

## Batch 4.4 — Add accessible journey export

**Work**

- Export Markdown first, with title page, story/package version, journey metadata, passages in experienced order, edge prose, optional adaptation notes, and content-license notice.
- Provide filename sanitization and deterministic output for test fixtures.
- Add a print-friendly HTML view. Defer EPUB/PDF until Markdown and print HTML are stable.
- Make download user-initiated and accessible; explain whether progress data is included.
- Add tests for repeats, branching, endings, migration, Unicode, long passages, and content updates.

**Acceptance gate**

- A complete L1→L4 journey exports without omissions or reordering.
- Export works offline and contains no internal IDs unless a diagnostic option is chosen.

**Agent access:** N-W, L-R.  
**Estimated effort:** 4–6 days.

## Batch 4.5 — Leibniz parity review and explicit rejection record

**Work**

- Re-run L's conceptual feature inventory against N.
- Verify condition coverage, adaptation ledger, prose beats, edge prose, and journey export.
- Record explicit rejections: L's Mongo backend, separate React Context state architecture, singleton mutable rule engine, and current visual design unless a product requirement says otherwise.
- Ensure all L issues are migrated or closed and all copied/adapted code has provenance.
- Add regression tests in N named by behavior rather than by the old repository.

**Acceptance gate — Project-Leibniz archive gate**

Project-Leibniz may be archived only when:

1. every extraction-matrix item is migrated or rejected;
2. N has no runtime/build dependency on L;
3. N's replacement features pass unit and browser tests;
4. source attribution and licensing are complete;
5. L's credential has been rotated/revoked;
6. open issues have been migrated or closed;
7. the owner has accepted the N implementations.

**Agent access:** N-W, L-R.  
**Estimated effort:** 2–3 days.

## Batch 4.6 — Archive Project-Leibniz

**Work**

- Create a final release/tag such as `reference-final`.
- Update L's README first paragraph with an archive notice, link to N, list the features that moved, and state that the repository is unsupported/read-only.
- Close or transfer remaining discussions/issues as appropriate.
- Remove active deployment hooks and repository secrets that are no longer required.
- Use GitHub's repository archive control.
- Keep history intact; do not delete the repository.

**After this batch:** Routine agents no longer need L access. Public read access remains useful only for historical provenance.

**Agent access:** L-W/A; N-R to verify destination links.  
**Estimated effort:** less than 1 day after the gate is satisfied.

---

# Phase 5 — Reconcile the interactive edition with the manuscript

**Purpose:** Turn M from a parallel interpretation into the governed literary source for N while preserving legitimate interactive differences.

**Dependencies:** Content contract complete; explanation/prose models stable. L may already be archived.

## Batch 5.1 — Build the complete content concordance

**Work**

- Map all N nodes, variation families, L3 assemblies, endings, and recurring motifs to M chapters/scenes, voices, timeline positions, philosophical constraints, rhyme entries, and promise/payoff records.
- Mark each runtime item as direct adaptation, composite adaptation, thematic derivative, interactive connective material, or noncanonical experiment.
- Identify contradictions rather than automatically “fixing” them.
- Add review ownership and resolution status for each contradiction.

**Acceptance gate**

- Every shipped runtime item has a provenance/canon classification.
- Every known contradiction has an owner and decision, not an implicit resolution.

**Agent access:** N-W, M-R.  
**Estimated effort:** 7–15 days; primarily editorial analysis.

## Batch 5.2 — Integrate manuscript voice and philosophy checks into content validation

**Work**

- Translate stable outputs from M's voice, philosophy, continuity, name, and rhyme tools into machine-readable reports.
- Add N conversion-tool checks that consume the released reports or equivalent rule data.
- Treat hard philosophical violations, renamed canonical entities, and chronology conflicts as errors; treat stylistic signature drift as review warnings unless the owner promotes a rule.
- Keep designed repetition from being flagged as generic duplication.
- Add waiver records with rationale and expiry for intentional interactive deviations.

**Acceptance gate**

- A deliberately flattened “same person” interpretation fails the Four Shackles validation.
- Approved interactive deviations can ship without disabling the entire validator.

**Agent access:** M-W for report/export changes, then N-W for integration. Content approval not required unless prose is edited.  
**Estimated effort:** 5–10 days.

## Batch 5.3 — Editorial audit of the full interactive runtime

**Work**

- Review opening, each L2 philosophy, representative revisit/meta-aware variants, each L3 assembly family, and every L4 ending.
- Check voice consistency, causality, terminology, spoiler timing, repetition, pacing, and philosophical fidelity.
- Use sampling only where large variation families are generated from proven templates; otherwise review every authored record.
- Make prose changes in focused, approved content batches. Update concordance and release IDs with every accepted batch.
- Re-run browser journeys after content changes to catch overflow, reading-time, and focus regressions.

**Acceptance gate**

- Editorial owner signs off on all three perspectives and all endings.
- No unresolved severity-one canon contradiction remains.

**Agent access:** N-W, M-R; M-W/content approval only when canonical prose also changes.  
**Estimated effort:** 2–6 weeks depending on the depth of prose revision.

## Batch 5.4 — Offer the canonical linear edition without confusing it with a journey export

**Work**

- Decide whether v1 includes the complete linear manuscript, a sample, or only a link/metadata. This is a product and rights decision.
- If included, import a signed literary release as a separate “Read the novel” edition, not as graph nodes.
- Clearly distinguish “canonical novel” from “your interactive journey.”
- Provide accessible long-form navigation, chapter landmarks, progress, bookmarks, print styles, and content-license notices.
- Do not make the large manuscript part of the initial interactive-app download.

**Acceptance gate**

- Readers understand which edition they are reading.
- The linear edition is separately lazy-loaded and does not degrade the interactive opening.

**Agent access:** M-R/W to publish an approved release; N-W to integrate. Explicit content-distribution approval required.  
**Estimated effort:** 5–12 days if included in v1; otherwise record a post-v1 decision.

---

# Phase 6 — Extract visual/onboarding value from the older prototype; archive it

**Purpose:** Improve first-run emotional impact without importing P's broken runtime architecture or weakening N's accessibility.

**Dependencies:** Core content and adaptive-reader behavior stable. Performance budgets exist. P remains frozen.

## Batch 6.1 — Visual and interaction extraction audit

**Work**

- Inventory P's introduction overlay, animated node demonstration, help modal, constellation atmosphere, color/character language, instanced rendering, lazy-loading boundaries, and marginalia/minimap concepts.
- Compare each item with N's existing implementation.
- Capture reference screenshots and interaction notes in N so future maintainers do not need P open to understand the target.
- Decide for each item: port concept, clean-room rebuild, reject, or defer.
- Explicitly reject P's duplicate Redux/domain/infrastructure layers and its current reading renderer unless a gap analysis proves unique value.

**Acceptance gate**

- Every useful P feature has a target issue or rejection rationale.

**Agent access:** N-W, P-R.  
**Estimated effort:** 2–4 days.

## Batch 6.2 — Build a cinematic but accessible first-run introduction

**Work**

- Add a concise introductory overlay explaining the premise, node interaction, path sensitivity, and ability to return/revisit.
- Recreate the animated-node example using semantic HTML/SVG or an accessible canvas companion; it must not be the only explanation.
- Support skip, replay from Help, keyboard completion, focus containment/restoration, 200% text, reduced motion, and small screens.
- Persist only a minimal “intro seen/version” value so materially changed onboarding can be shown again.
- A/B or usability-test the overlay against N's current direct perspective opening; do not assume more animation is automatically better.

**Acceptance gate**

- New readers can correctly explain how to begin, choose a perspective, revisit, and access help after one onboarding pass.
- Reduced-motion users receive an equivalent static explanation.

**Agent access:** N-W, P-R.  
**Estimated effort:** 4–7 days.

## Batch 6.3 — Unify visual language and atmosphere

**Work**

- Define design tokens for perspective colors, archive/constellation surfaces, typography, focus, contrast, spacing, and motion.
- Selectively incorporate P's cosmic atmosphere while retaining N's more legible archive shell and literary reader.
- Remove unexplained warning/emoji decorations and any low-contrast labels that do not convey meaningful state.
- Ensure the visual system works in 2D, experimental 3D, onboarding, story reader, progress, settings, and exports.
- Document which effects are decorative and ensure assistive technology ignores them.

**Acceptance gate**

- WCAG contrast targets pass for text, controls, focus, and meaningful graph state.
- Visual identity is consistent without making prose harder to read.

**Agent access:** N-W, P-R; M-R for approved character/voice terminology.  
**Estimated effort:** 5–10 days.

## Batch 6.4 — Profile and selectively improve experimental 3D

**Work**

- Compare N's current 3D node rendering with P's instanced/batched techniques using measured scenarios.
- Port only optimizations that improve representative hardware and do not complicate the primary 2D path.
- Add a semantic list/command surface synchronized with 3D nodes so the canvas is never the only navigation mechanism.
- Keep 3D explicitly optional, lazy-loaded, reduced-motion aware, and recoverable after WebGL context loss.
- Test GPU memory, resize, suspend/resume, repeated open/close, and low-power devices.

**Acceptance gate**

- 3D meets its stated performance budget or remains clearly experimental/disabled for v1.
- 2D remains fully functional when WebGL is unavailable.

**Agent access:** N-W, P-R.  
**Estimated effort:** 4–10 days; stop early if profiling shows little reader value.

## Batch 6.5 — Prototype parity/rejection review

**Work**

- Re-run the extraction matrix for onboarding, Help, visual atmosphere, 3D, minimap, marginalia, and loading behavior.
- Confirm that P's blank reading panel and revisit-count defect are not present in N.
- Migrate/close all P issues and complete attribution.
- Preserve screenshots and decision records in N.

**Acceptance gate — older prototype archive gate**

P may be archived only when:

1. all visual/onboarding extraction items are migrated, rejected, or explicitly deferred in N;
2. N has no build/runtime dependency on P;
3. N's first-run and fallback browser tests pass;
4. accessibility and reduced-motion parity are proven;
5. P's open issues are migrated or closed;
6. provenance and licenses are recorded;
7. the owner accepts N's resulting visual direction.

**Agent access:** N-W, P-R.  
**Estimated effort:** 2–3 days.

## Batch 6.6 — Archive eternal-return-digital-self

**Work**

- Create a final `reference-final` tag.
- Add an archive notice linking to N and documenting what was transferred or rejected.
- Disable deployments, remove unused secrets, and close/migrate remaining issues.
- Use GitHub's archive toggle.
- Preserve history and final screenshots; do not delete the repository.

**After this batch:** Routine agents no longer need P access.

**Agent access:** P-W/A; N-R for destination links.  
**Estimated effort:** less than 1 day after the gate is satisfied.

---

# Phase 7 — Unify the end-to-end reader product

**Purpose:** Turn the integrated capabilities into one intentional experience rather than a collection of imported features.

**Dependencies:** L and P capabilities integrated; content audit substantially complete.

## Batch 7.1 — Define and implement the canonical reader journey

**Work**

- Document every first-run state from page load through onboarding, perspective choice, first passage, return to map, revisit, L2 choice, L3 convergence, L4 ending, progress review, and export.
- Remove duplicate entry points, conflicting terminology, and controls that exist only because of implementation history.
- Give each screen a primary action and predictable back/close behavior.
- Decide how readers discover revisitation without forcing it.
- Ensure the progress model distinguishes passages opened, paths explored, endings reached, and adaptations discovered.

**Acceptance gate**

- A moderated first-time usability session completes the opening and one branch without coaching.
- Navigation labels are consistent across 2D, 3D, progress, and reader views.

**Agent access:** N-W; M-R for terminology.  
**Estimated effort:** 4–8 days.

## Batch 7.2 — Refine the long-passage reading experience

**Work**

- Evaluate whether current 10–15 minute passages should stay whole, use internal section landmarks, or be divided into resumable segments.
- Add chapter/passage landmarks, visible progress, reliable scroll restoration, text size/line-height/theme preferences, and clear continuation actions.
- Avoid modal traps that make a long reading session feel disconnected from browser navigation; consider route-addressable passage views while preserving focus behavior.
- Preserve exact visit semantics when a passage is reopened or partially read.
- Test print, selection/copy, zoom, mobile orientation, virtual keyboard, and interrupted sessions.

**Acceptance gate**

- Long passages are comfortable on desktop and mobile and can be resumed without losing the map context.

**Agent access:** N-W.  
**Estimated effort:** 5–10 days.

## Batch 7.3 — Integrate explanations and export without overwhelming the prose

**Work**

- Place “Why this version?” as secondary disclosure after the passage or in progress history.
- Keep adaptation ledger language concise and literary rather than diagnostic.
- Put journey export at meaningful milestones and endings, not on every screen.
- Add settings for including/excluding adaptation notes in exports.
- Usability-test whether explanations enhance understanding or prematurely expose mechanics.

**Acceptance gate**

- Readers can ignore mechanics and simply read, while curious readers can inspect them.

**Agent access:** N-W; M-R/editorial review.  
**Estimated effort:** 3–6 days.

## Batch 7.4 — Harden persistence, recovery, and reader control

**Work**

- Finalize save schema versioning around story-package and visit-event versions.
- Add explicit “new journey,” reset confirmation, export-before-reset option, corrupt-save recovery, storage quota handling, and migration telemetry that does not expose prose/history without consent.
- Add import of a previously exported machine-readable save separate from the literary Markdown export.
- Test multiple browser tabs, interrupted writes, storage unavailable/private mode, older content packages, and rollback to a prior app version.

**Acceptance gate**

- No single corrupt localStorage record can trap the app at startup.
- Reset and recovery are understandable and reversible where possible.

**Agent access:** N-W.  
**Estimated effort:** 4–7 days.

## Batch 7.5 — Complete manual accessibility and inclusive-design validation

**Work**

- Perform manual screen-reader testing on supported Windows and Apple combinations.
- Test touch targets, color vision, high contrast, forced colors, zoom, text spacing, keyboard-only map traversal, and motion sensitivity.
- Validate the graph's semantic alternative, not merely modal/dialog mechanics.
- Create a release accessibility checklist and public accessibility statement with known limitations.
- Fix blockers before beta rather than deferring all manual validation to release day.

**Acceptance gate**

- No critical task requires sight, pointer precision, color alone, motion, or WebGL.

**Agent access:** N-W; external device/screen-reader access helpful.  
**Estimated effort:** 5–10 days including fixes.

---

# Phase 8 — Production hardening and operational readiness

**Purpose:** Convert a strong application into an operable production service.

**Dependencies:** Product feature set frozen for v1.

## Batch 8.1 — Make the backend decision and close the scope gate

**Recommended decision:** Ship v1 without a backend.

**Work**

- Confirm whether v1 requires accounts, cloud sync, social sharing, paid access, or server-side analytics.
- If none are required, record the client-only decision and remove any dormant API assumptions.
- If cloud sync is truly required, write a separate threat model, data model, privacy plan, authentication plan, migration strategy, and cost/operations estimate. Do not revive L's Mongo server as-is.
- Keep the static release schedule independent of a hypothetical post-v1 service.

**Acceptance gate**

- There is no ambiguous half-backend in the release architecture.

**Agent access:** N-W; L no longer required. Owner/product decision required.  
**Estimated effort:** 1–3 days for the decision; a new backend would be a separate multi-phase program.

## Batch 8.2 — Security headers, privacy, and data minimization

**Work**

- Define CSP, referrer policy, permissions policy, MIME protections, frame policy, and HTTPS/HSTS behavior at the deployment layer.
- Inventory all local data, logs, analytics, error reports, and exported files.
- Avoid transmitting reading history or selected prose without explicit informed consent.
- Add privacy policy, content/cookie notice if applicable, and data-deletion/reset instructions.
- Sanitize Markdown and imported story packages; test malicious links, HTML, oversized content, and prototype pollution paths.

**Acceptance gate**

- The deployed site passes the security-header checklist and content sanitization tests.
- Privacy documentation matches actual network behavior.

**Agent access:** N-W/A plus deployment-host configuration access.  
**Estimated effort:** 4–7 days.

## Batch 8.3 — Error monitoring and privacy-respecting observability

**Work**

- Add release-tagged error reporting with source maps stored privately.
- Redact story prose, journey history, local-save data, URLs containing user data, and browser storage from reports.
- Capture performance vitals and coarse feature health only to the level necessary for operations.
- Add user-facing recovery messages and a support/report flow that lets the reader inspect what will be sent.
- Define alert thresholds and ownership.

**Acceptance gate**

- A deliberately injected production-like error appears with correct release metadata and no sensitive reading content.

**Agent access:** N-W/A plus monitoring service access/secrets.  
**Estimated effort:** 3–6 days.

## Batch 8.4 — Deployment environments, versioning, and rollback

**Work**

- Choose and document the production host.
- Create preview deployments for PRs, a protected staging environment, and production.
- Version the application and each story package independently but record compatibility in release manifests.
- Configure immutable hashed assets, correct HTML caching, compression, content types, redirects, and custom 404 behavior.
- Publish release notes and checksums.
- Implement one-command rollback to the prior known-good application and story-package combination.
- Rehearse rollback before beta.

**Acceptance gate**

- A tagged commit produces a reproducible artifact and staging deployment.
- Rollback completes without corrupting existing local saves.

**Agent access:** N-W/A plus deployment host and domain/DNS access where applicable.  
**Estimated effort:** 4–8 days.

## Batch 8.5 — Production performance and resilience pass

**Work**

- Re-measure against Phase 1 budgets on throttled networks and mid-range devices.
- Verify lazy story/3D/linear-edition loading, prefetch behavior, caching, offline failure states, and WebGL fallback.
- Test large histories, every ending, memory pressure, tab backgrounding, viewport changes, and long sessions.
- Optimize only measured bottlenecks.
- Decide whether a service worker/offline cache provides enough value to justify update/version complexity; do not add one automatically.

**Acceptance gate**

- All budgets pass or have explicit owner-approved waivers.
- The product remains readable when optional assets fail.

**Agent access:** N-W plus representative device/browser access.  
**Estimated effort:** 5–10 days.

---

# Phase 9 — Alpha, beta, editorial acceptance, and release candidate

**Purpose:** Validate the integrated product with readers and real devices before public launch.

**Dependencies:** Feature-complete, deployable staging build; L and P archived.

## Batch 9.1 — Internal alpha

**Work**

- Recruit a small internal group unfamiliar with the implementation.
- Assign test journeys covering all perspectives, philosophies, revisits, save/reload, L3, L4, export, reset, and recovery.
- Observe first-run comprehension and reading fatigue rather than relying only on questionnaires.
- Capture bugs in N using severity, reproducibility, story/app version, device, and accessibility impact.
- Do not accept new feature requests into v1 without replacing equivalent scope.

**Exit gate**

- No blocker defect; all endings reachable; first-run task success meets the owner-defined target.

**Agent access:** N-W for fixes/triage; M-R for content investigation.  
**Estimated duration:** 1 week plus fixes.

## Batch 9.2 — Full content and canon acceptance

**Work**

- Freeze a candidate M literary release and N story package.
- Run complete schema, provenance, voice, philosophy, continuity, ending, and concordance checks.
- Have the editorial owner review every ending, every perspective opening, explanation templates, export framing, and representative adaptive paths.
- Lock content IDs and hashes for RC unless a blocker requires a change.

**Exit gate**

- Written editorial acceptance and no unresolved critical canon defects.

**Agent access:** N-W, M-R/W; content approval required for prose changes.  
**Estimated effort:** 5–10 days.

## Batch 9.3 — External closed beta

**Work**

- Release to a controlled audience across desktop/mobile, keyboard/screen-reader users, and varied reading preferences.
- Collect consented qualitative feedback, error rates, performance vitals, completion/drop-off points, and support requests.
- Specifically test whether adaptation explanations clarify the experience, whether long passages are comfortable, and whether onboarding over-explains.
- Run at least one complete path per ending on production-like hosting after every beta release.

**Exit gate**

- Crash/error and task-completion targets met.
- No critical accessibility, data-loss, security, or content defect open.

**Agent access:** N-W/A and monitoring/deployment access; M-R for content triage.  
**Estimated duration:** 2–3 weeks plus fixes.

## Batch 9.4 — Release-candidate freeze and launch review

**Work**

- Freeze features and content.
- Produce RC artifacts, checksums, release notes, dependency report, accessibility statement, privacy policy, known issues, content provenance, and rollback instructions.
- Re-run the entire CI matrix from a clean environment.
- Rehearse deploy and rollback with the exact RC artifact.
- Verify L and P archive state and every public link from their archive notices.
- Obtain product, editorial, technical, accessibility, security, and operations sign-off.

**Exit gate**

- One explicit go/no-go decision with named owners.

**Agent access:** N-W/A; M-R; L-R and P-R only to verify archive notices. Deployment/monitoring access required.  
**Estimated effort:** 2–4 days.

---

# Phase 10 — General availability and post-launch stabilization

## Batch 10.1 — Production launch

**Work**

- Deploy the signed RC artifact without rebuilding it.
- Verify domain, TLS, headers, caching, source-map privacy, error reporting, core web vitals, robots/indexing decision, social metadata, and all critical reader journeys.
- Publish release notes and support/contact information.
- Tag the N release and record the exact M literary release/story-package versions.

**Agent access:** N-A plus deployment/domain/monitoring access; M-R.  
**Estimated effort:** 1 launch day.

## Batch 10.2 — 72-hour stabilization window

**Work**

- Monitor errors, performance, failed content loads, storage/migration failures, and support reports.
- Triage only launch blockers and severe regressions into hotfixes.
- Re-run smoke journeys after every hotfix.
- Roll back rather than stacking risky hotfixes when core reading is compromised.

**Agent access:** N-W/A plus deployment/monitoring access; M-R if a content blocker appears.  
**Estimated duration:** first 72 hours.

## Batch 10.3 — Thirty-day review and v1.1 planning

**Work**

- Compare actual use, completion, errors, performance, accessibility reports, and reader feedback against launch targets.
- Remove temporary migration/diagnostic code only after old saves have aged through the supported window.
- Decide whether to invest next in additional stories, the complete linear edition, EPUB/PDF export, richer 3D, accounts/cloud sync, or authoring tools.
- Keep L and P archived; new work belongs in N or M.

**Agent access:** N-W/A, M-R/W as required by the selected v1.1 scope.  
**Estimated effort:** 2–4 days for the review.

---

# 5. Repository access matrix by batch

| Batch | Narramorph | Manuscript | Project-Leibniz | Older prototype | Additional authority |
| --- | --- | --- | --- | --- | --- |
| 0.1 Charter/freeze | W | R | W | W | Owner approval |
| 0.2 Licensing | W | W | W | W | Owner/legal decision |
| 0.3 Baselines/inventory | W | R/W for tag | R/W for tag | R/W for tag | — |
| 1.1 Docs/metadata | W | W | — | — | — |
| 1.2 CI | W/A | W/A | — | — | GitHub settings |
| 1.3 Dependencies/security | W | R/W | — | — | Security review |
| 1.4 Performance boundaries | W | — | — | — | — |
| 2.1 Authority model | W | W | — | — | Editorial owner |
| 2.2 Package contract | W | R | — | — | — |
| 2.3 M exporter | R | W | — | — | — |
| 2.4 N importer | W | R | — | — | — |
| 2.5 Vertical slice | W | W | — | — | Prose approval if edited |
| 3.1 Gap analysis | W | — | R | — | — |
| 3.2 Conditions/compiler | W | — | R | — | — |
| 3.3 Explanation UI | W | — | R | — | — |
| 3.4 Explanation content | W | R | R | — | Editorial review |
| 4.1 Prose beats | W | R | R | — | Prose approval if edited |
| 4.2 Edge prose | W | R | R | — | Prose approval if edited |
| 4.3 Visit log | W | — | — | — | — |
| 4.4 Journey export | W | — | R | — | — |
| 4.5 L parity gate | W | — | R | — | Owner acceptance |
| 4.6 Archive L | R | — | W/A | — | GitHub admin |
| 5.1 Concordance | W | R | — | — | Editorial review |
| 5.2 Validators | W | W | — | — | — |
| 5.3 Runtime editorial audit | W | R/W | — | — | Content approval |
| 5.4 Linear edition | W | R/W | — | — | Distribution approval |
| 6.1 Visual audit | W | — | — | R | — |
| 6.2 Onboarding | W | — | — | R | Usability testers |
| 6.3 Visual system | W | R | — | R | Design/editorial review |
| 6.4 Experimental 3D | W | — | — | R | Device access |
| 6.5 P parity gate | W | — | — | R | Owner acceptance |
| 6.6 Archive P | R | — | — | W/A | GitHub admin |
| 7.1 Reader journey | W | R | — | — | Usability testers |
| 7.2 Long-form reader | W | — | — | — | — |
| 7.3 Explanations/export UX | W | R | — | — | Editorial review |
| 7.4 Persistence/recovery | W | — | — | — | — |
| 7.5 Accessibility | W | — | — | — | Devices/screen readers |
| 8.1 Backend decision | W | — | — | — | Product owner |
| 8.2 Security/privacy | W/A | — | — | — | Host/security review |
| 8.3 Monitoring | W/A | — | — | — | Monitoring access |
| 8.4 Deployment/rollback | W/A | — | — | — | Host/domain access |
| 8.5 Resilience | W | — | — | — | Device access |
| 9.1 Alpha | W | R | — | — | Testers |
| 9.2 Content acceptance | W | R/W | — | — | Editorial approval |
| 9.3 Beta | W/A | R | — | — | Deployment/monitoring |
| 9.4 RC | W/A | R | R | R | Cross-functional sign-off |
| 10.1 Launch | A | R | — | — | Domain/host/monitoring |
| 10.2 Stabilization | W/A | R as needed | — | — | Operations |
| 10.3 v1.1 review | W/A | R/W as needed | — | — | Product decision |

## 6. Parallelization and critical path

Safe parallel work is limited by schema and content dependencies:

- After Phase 0, Batches 1.1, 1.2, and 1.3 can run in parallel, but 1.4 should rebase after major dependency upgrades.
- In Phase 2, 2.2 must land before 2.3 and 2.4. Once the contract is stable, the M exporter and N importer can be developed in parallel against fixtures; the exporter release lands first.
- Phase 3 can begin after 2.2 even while the full concordance is incomplete.
- Phase 4 depends on the explanation/condition model from Phase 3.
- Phase 5's concordance work can begin after Phase 2, but broad prose changes should wait until Phase 4 schemas are stable to avoid rewriting content twice.
- Phase 6 visual work should wait until Phase 1 performance budgets and Phase 7 reader-flow targets are understood; otherwise animation work may be discarded.
- Production hardening can begin during late Phase 7, but the final security/performance/rollback pass must run after feature freeze.

The critical path is:

**Licensing → N stability → content contract → Leibniz condition/explanation model → prose/export integration → manuscript concordance/editorial acceptance → prototype visual integration → unified UX → production hardening → beta → release.**

With one experienced agent plus regular owner/editorial review, this is approximately a **four-to-six-month program**. Multiple agents can shorten elapsed time, but editorial review, accessibility testing, beta feedback, and cross-repository approvals remain serial gates. The roadmap should be managed by exit criteria, not calendar pressure.

## 7. Explicit “do not do” list

- Do not merge all four Git histories into a monorepo.
- Do not rewrite N around L's frontend state or server architecture.
- Do not revive L's Mongo backend for v1 without a separately approved account/cloud-sync requirement.
- Do not import P's duplicate architectural layers or treat its current 3D canvas as an accessible navigation solution.
- Do not bulk-copy M's manuscript into N and apply the software license to it.
- Do not automatically regenerate interactive prose from the manuscript without editorial review.
- Do not archive L or P before their extraction matrix, issue migration, provenance, and parity/rejection gates are complete.
- Do not add visual polish before initial-load performance and reduced-motion budgets exist.
- Do not claim production readiness from passing unit tests alone; manual accessibility, content acceptance, deployment, monitoring, privacy, and rollback are required.

## 8. Recommended first five implementation tickets

1. **P0-01:** Approve and commit the product charter and repository-boundary ADR.
2. **P0-02:** Add software/content licenses and provenance records across all four repositories; confirm L credential revocation.
3. **P0-03:** Tag baselines, freeze L/P, and create the extraction matrix plus migrated issue backlog.
4. **P1-01:** Fix N/M status documentation and M's Windows UTF-8 status-script failure.
5. **P1-02:** Make N and M CI release-grade, then start N's bundle/lazy-loading work.

Only after those tickets are complete should an implementation agent begin copying or reimplementing L/P behavior.
