# Code and content provenance policy

Status: Active for consolidation; license terms remain subject to the Phase 0 owner decision.

## Purpose

Every code or content artifact brought into Narramorph must be traceable to its source, owner, license, transformation, and approval. A public repository URL is not permission by itself.

## Artifact classes

1. **Original Narramorph code/content** — authored directly in this repository.
2. **Clean-room reimplementation** — behavior or design observed in a reference repository, implemented anew against a written requirement and behavior tests.
3. **Adapted implementation** — source code or prose materially derived from another repository and changed for Narramorph.
4. **Direct copy** — copied with minimal modification; requires file-level attribution and compatible licensing.
5. **Canonical literary input** — approved material or constraints released from `Eternal_Return_Manuscript` with an explicit release ID and distribution permission.
6. **Generated artifact** — created deterministically from authored inputs; must name the generator version and do-not-edit boundary.

## Required record

For every transferred artifact, record:

- source repository, path, and immutable commit/tag;
- original owner/author when known;
- source license and content-license status;
- transfer class from the list above;
- target path;
- approving PR/issue;
- tests or editorial review proving the target behavior/content;
- whether future maintenance still needs the source repository.

Records belong in the feature extraction matrix, story-package manifest, a file header where appropriate, or `THIRD_PARTY_NOTICES.md`.

## Manuscript relationship

`Eternal_Return_Manuscript` is the canonical long-form literary/editorial source. Narramorph is the canonical interactive edition. Narramorph must consume only approved, versioned literary releases; it must not scrape or fetch the manuscript default branch during build or runtime.

Canonical prose remains read-only by default under the manuscript repository's approval rules. Interactive content may intentionally differ in order, passage length, perspective framing, unlock language, or other documented ways, but canonical claims and deviations require concordance/provenance records.

## Reference repositories

`Project-Leibniz` and `eternal-return-digital-self` are frozen references. Preferred transfer mode is clean-room reimplementation of behavior within Narramorph's architecture. Direct copying requires compatible licensing and explicit attribution.

## Prohibited transfers

- Copying code or prose while license status is unresolved.
- Treating all-rights-reserved literary content as MIT software.
- Using Git history or a public URL as a substitute for permission.
- Removing attribution after a reference repository is archived.
- Generating runtime content without recording the authored inputs and generator version.
