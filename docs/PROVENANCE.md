# Code and content provenance policy

Status: Active. The owner approved the code/content licensing split on July 13, 2026.

## Purpose

Every code or content artifact brought into Narramorph must be traceable to its source, owner, license, transformation, and approval. A public repository URL is not permission by itself.

## Artifact classes

1. **Original Narramorph software** — authored directly in this repository and covered by the MIT License unless a file says otherwise.
2. **Original Narramorph creative content** — authored directly in this repository and covered by `CONTENT_LICENSE.md`.
3. **Clean-room reimplementation** — behavior or design observed in a reference repository, implemented anew against a written requirement and behavior tests.
4. **Adapted implementation** — source code or prose materially derived from another repository and changed for Narramorph.
5. **Direct copy** — copied with minimal modification; requires file-level attribution and compatible licensing.
6. **Canonical literary input** — approved material or constraints released from `Eternal_Return_Manuscript` with an explicit release ID and distribution permission.
7. **Generated artifact** — created deterministically from authored inputs; must name the generator version and do-not-edit boundary.
8. **AI-assisted artifact** — drafted or transformed with a generative system and accepted by a human owner/editor; requires the additional record below.

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

The manuscript repository's `INTERACTIVE_USE_PERMISSION.md` grants official Narramorph releases the right to adapt and distribute only material named in an approved, versioned release record. That material and its derivative runtime passages remain reserved content; they do not become MIT software.

## Reference repositories

`Project-Leibniz` and `eternal-return-digital-self` are frozen references. Their software code is MIT-licensed, while their narrative and media content is reserved. Preferred transfer mode is clean-room reimplementation of behavior within Narramorph's architecture. Direct copying requires compatible licensing and explicit attribution.

## Generated and AI-assisted material

Generated or AI-assisted artifacts must record, when known:

- the human owner/editor who approved the result;
- tool/provider, model or generator version, and generation date;
- source inputs, licenses, and immutable hashes or references;
- whether prompts or inputs contained reserved manuscript material;
- material human edits and the approving PR or editorial record; and
- the final artifact's code/content classification.

Approval is never inferred from generation. Accepted software may be released under MIT only after source and dependency review. Accepted expressive story/media output remains reserved content to the extent the owner holds rights in it. A generated result that reproduces third-party material retains the third party's restrictions and must not be accepted merely because a tool produced it.

## Prohibited transfers

- Copying code or prose while license status is unresolved.
- Treating all-rights-reserved literary content as MIT software.
- Using Git history or a public URL as a substitute for permission.
- Removing attribution after a reference repository is archived.
- Generating runtime content without recording the authored inputs and generator version.
