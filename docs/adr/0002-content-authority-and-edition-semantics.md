# ADR 0002: Content authority and edition semantics

- Status: Accepted
- Date: July 14, 2026
- Decision owners: product owner, editorial owner, and product consolidation program
- Supersedes: no prior ADR

## Context

Narramorph and `Eternal_Return_Manuscript` express the same literary project in forms with different jobs. The manuscript repository is the canonical long-form work and editorial system. Narramorph is an authored interactive edition whose order, framing, repetition, choices, and explanations respond to a reader's journey. A reader export is a record of one traversal through that interactive edition.

Treating any of these artifacts as a generated replacement for another would erase authority, create an unsafe cross-repository build dependency, and make literary review impossible. Treating them as unrelated would allow canonical claims to drift. The product therefore needs an explicit hybrid boundary.

## Decision

### Three distinct artifacts

1. **Canonical long-form manuscript.** The 28 ordered prose files, story bible, constraints, continuity data, and editorial records owned by `Eternal_Return_Manuscript`. Canonical prose changes only through that repository's explicitly approved revision workflow.
2. **Interactive runtime edition.** The authored story graph, passages, variations, choices, unlocks, endings, and explanation metadata owned by Narramorph. It is informed by approved literary releases but is not generated from or overwritten by the long-form manuscript.
3. **Reader-specific exported journey.** A derivative record of the exact package version, passage versions, order, choices, explanations, and ending experienced by one reader. It does not become an authoring source for either upstream edition.

### Canonical alignment

The editions must not contradict an approved literary release on:

- character identities and the rule that the three protagonists are differentiations rather than the same person;
- chronology and the relative ordering of material causal events;
- philosophical constraints, including the Four Shackles and the non-transmissive causal-loop model;
- controlled terminology and named concepts;
- major causal relationships, promises, and payoffs; and
- ending claims, including what each ending affirms, transforms, preserves, or releases.

Alignment is demonstrated by stable identifiers, a versioned literary-release artifact, a complete runtime concordance, and automated compatibility/claim validation. It is not demonstrated by copying prose.

### Intentional edition differences

Narramorph may intentionally differ in:

- reading order and passage composition;
- passage length and excerpt selection;
- second-person or reader-address framing;
- repetition frequency and revisit variants;
- unlock and convergence structure;
- choice labels and interactive language; and
- interactive-only connective or explanation material.

Every shipped passage declares whether it is a direct adaptation, thematic derivative, interactive-only connective material, or independent runtime material. A permitted difference cannot be used to introduce an unreviewed canonical claim.

### Hybrid authority model

Runtime prose remains authored and reviewed in Narramorph. Automation supplies package validation, deterministic identifiers and hashes, release compatibility, concordance coverage, canonical-claim checks, provenance explanations, and semantic diffs. Automation must not convert the complete manuscript into runtime passages or rewrite either edition's prose.

## Approval workflow

1. A manuscript or editorial change follows `Eternal_Return_Manuscript/editorial/WORKFLOW.md`. Any canonical prose edit requires the operator's exact, session-specific approval before files change.
2. M produces a versioned literary-release artifact containing only approved structured context and explicitly approved excerpts. The artifact names the immutable source commit, editorial release ID, license/permission, file hashes, contract version, and validation results.
3. N imports the artifact into a staging-only location. Import verifies schema, application compatibility, license, release identity, paths, and hashes, then emits a human-readable semantic diff. It cannot write authored runtime prose.
4. Editorial review classifies changed identities, chronology, constraints, terminology, causal relationships, ending claims, and any explicitly approved excerpts. Technical review covers schema, compatibility, deterministic identity, and provenance coverage.
5. Acceptance is an N pull request that deliberately updates accepted-release metadata and concordance. A runtime-prose proposal is a separate authored diff. Direct adaptations and changes to canonical claims require editorial approval; technical metadata-only acceptance does not authorize prose edits.
6. The accepted story package receives a semantic version. Saved journeys and reader exports record both the application/save version and story-package version.
7. Rollback reverts the N acceptance/concordance commit or selects the prior checked-in package; it never rewrites M. Released artifacts and provenance records remain immutable for audit.

## Do-not-overwrite and coupling rules

- No N command may write to M, and no M command may write to N.
- M exporters write only to a git-ignored build directory or an explicitly reviewed release artifact. They never modify `manuscript/`.
- N importers write only to staging until a maintainer accepts a metadata/concordance diff through a pull request. They never write passage content beneath `src/data/stories/`.
- Neither repository fetches the other's default branch during build, test, application startup, runtime operation, or reader export.
- Checked-in, versioned artifacts cross the boundary deliberately and require no GitHub credentials or network access at runtime.
- Generated files declare their source and do-not-edit boundary. Authored files remain visibly separate.
- Reader exports are terminal derivatives. They cannot be imported as manuscript or runtime authoring input.

## Consequences

### Positive

- M retains sole literary/editorial authority while N remains independently shippable.
- Runtime differences are reviewable instead of being mistaken for manuscript drift.
- Provenance and compatibility can be automated without automating prose authorship.
- A changed literary release produces a semantic proposal, not a bulk rewrite.

### Costs

- Releases require coordinated metadata, concordance, and review in two repositories.
- Canonical alignment is modeled explicitly for every runtime passage.
- Runtime prose changes and literary-release acceptance may require separate reviews.

## Verification

This decision is implemented when the Story Package Contract, M exporter, N staged importer, concordance, provenance explanation, saved-journey package identity, and vertical-slice reproduction all enforce these rules. Batch 2.1's narrower gate is met when both repositories' operative workflows state the same boundary and provide no silent overwrite path.

## Related records

- [ADR 0001: repository boundaries](0001-repository-boundaries.md)
- [Product charter](../PRODUCT_CHARTER.md)
- [Phase 2 execution record](../consolidation/PHASE_2_EXECUTION.md)
- [`Eternal_Return_Manuscript` editorial workflow](https://github.com/zekusmaximus/Eternal_Return_Manuscript/blob/main/editorial/WORKFLOW.md)
- [`Eternal_Return_Manuscript` interactive-edition provenance policy](https://github.com/zekusmaximus/Eternal_Return_Manuscript/blob/main/editorial/INTERACTIVE_EDITION_PROVENANCE.md)
