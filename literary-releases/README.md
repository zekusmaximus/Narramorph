# Literary release intake

Narramorph consumes canonical editorial context from versioned literary release artifacts produced by `Eternal_Return_Manuscript`.

The intake boundary is deliberately staged:

1. `known-releases.json` allowlists an immutable release, its application compatibility range, and exact content and asset hashes.
2. `npm run literary:stage -- <release-id>` verifies the downloaded artifact and writes a machine report plus a human-readable semantic diff only under `build/literary-import-staging/`.
3. A reviewer inspects that report before checked-in acceptance metadata or Story Package provenance changes.
4. `npm run literary:validate` re-verifies accepted release metadata, the complete runtime concordance, and the shipped Story Package.
5. `npm run literary:explain -- <passage-id-or-legacy-id>` explains a shipped passage through its canonical references and declared relationship.

The importer never copies, rewrites, or overwrites runtime prose. Released manuscript prose remains canonical in the manuscript repository; Narramorph stores only the immutable release artifact, acceptance/provenance metadata, and mappings to its separately authored runtime passages.
