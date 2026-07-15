# Literary release intake

Narramorph consumes canonical editorial context from versioned literary release artifacts produced by `Eternal_Return_Manuscript`.

The intake boundary is deliberately staged:

1. `known-releases.json` allowlists an immutable release, its application compatibility range, and exact content and asset hashes.
2. `npm run literary:stage -- <release-id>` verifies the downloaded artifact and writes a machine report plus a human-readable semantic diff only under `build/literary-import-staging/`.
3. A reviewer inspects that report before checked-in acceptance metadata or Story Package provenance changes.
4. `npm run literary:validate` re-verifies accepted release metadata, the complete runtime concordance, and the shipped Story Package.
5. `npm run literary:explain -- <passage-id-or-legacy-id>` explains a shipped passage through its canonical references and declared relationship.

An approved vertical slice has a second, narrower boundary:

1. `known-slices.json` allowlists the exact slice asset, its parent release, its target runtime graph, and the stable passage path it is allowed to prove.
2. `npm run literary:slice:stage -- <slice-id>` verifies the slice against the already verified full release, the accepted concordance, and the current runtime graph. It writes review output only beneath the full release's ignored `build/literary-import-staging/<release-id>/slices/` directory.
3. A reviewer inspects the staged report before checking in `accepted/<story-id>-vertical-slice.json`.
4. `npm run literary:slice:validate` re-verifies the accepted slice and its exact Story Package, concordance, and runtime identities.
5. `npm run literary:slice:explain -- <slice-id>` prints the complete canonical-to-runtime evidence for each target passage.

The importer never copies, rewrites, or overwrites runtime prose. Released manuscript prose remains canonical in the manuscript repository; Narramorph stores only the immutable release artifact, acceptance/provenance metadata, and mappings to its separately authored runtime passages.

The full release and slice assets are deliberately transferred release artifacts. Narramorph's build, tests, and runtime never clone or fetch the manuscript repository and never require GitHub credentials. See [Phase 2 vertical-slice reproduction](../docs/consolidation/PHASE_2_VERTICAL_SLICE_REPRODUCTION.md) for the exact transfer, review, validation, and rollback sequence.
