# Story Package Contract v1

Status: stable for Phase 3 implementation

Contract identifier: `org.narramorph.story-package`

Schema version: `1.1.0`

## Purpose and boundary

Story Package Contract v1 is the deterministic handoff format between approved literary context and Narramorph's authored interactive edition. It inventories identity, topology, conditions, provenance, licensing, and content digests. It does not authorize a tool to rewrite authored runtime prose, and it does not make the canonical manuscript a build or runtime dependency.

The three artifacts defined by [ADR 0002](../adr/0002-content-authority-and-edition-semantics.md) remain distinct:

1. the canonical manuscript and an approved literary release in `Eternal_Return_Manuscript`;
2. the reviewed Story Package plus Narramorph's authored runtime passages; and
3. a reader's saved journey or export, which identifies the exact application/save and story-package versions that produced it.

The current Eternal Return package catalogs 19 passages: 18 runtime graph nodes plus the shared Layer 3 convergence section used by assembly. It records 1,014 shipped variations without copying their prose into the generated catalog. Each prose beat instead carries the SHA-256 digest and UTF-8 byte length of its normalized authored content.

## Package layout

```text
<package>/
├── manifest.json
├── catalog.json
└── <declared resources, if any>
```

`manifest.json` and `catalog.json` are canonical UTF-8 JSON followed by exactly one LF. Resource paths are package-relative, use forward slashes, and may not be absolute or contain empty, `.` or `..` segments.

## Manifest

The manifest schema is [`schemas/story-package/v1/manifest.schema.json`](../../schemas/story-package/v1/manifest.schema.json). Every manifest contains:

| Field | Contract |
| --- | --- |
| `contract` | Exactly `org.narramorph.story-package`. |
| `schemaVersion` | Semantic contract version. v1 readers accept major version 1 only. |
| `storyId` / `storyVersion` | Stable story namespace and semantic content-edition version. |
| `sourceManuscriptCommit` | Full lowercase 40-character commit SHA. |
| `editorialReleaseId` | Immutable release identifier; an importer separately decides whether it is accepted. |
| `licenses` | One or more scoped license/attribution declarations. `LicenseRef-Narramorph-All-Rights-Reserved` describes current first-party literary and fixture expression; MIT applies only to contract metadata/tooling. |
| `generatedAt` | Deterministic `sourceDateEpoch`, never the builder wall clock. |
| `generation` | Generator name/version, timestamp input, and canonicalization identifier. |
| `contentHash` | Deterministic package identity defined below. |
| `supportedAppRange` | Half-open semantic range in the v1 form `>=x.y.z <a.b.c`. |
| `layerCounts` / `passageIds` | Catalog-derived topology summary. |
| `provenance` | Source repository, commit, release, relation, and optional path links. |
| `catalog` | Safe path `catalog.json` and its SHA-256 digest. |

The current `legacy-runtime-baseline-2026-07-14` release ID inventories pre-contract runtime content. It is not evidence of new editorial approval and must not be placed on the accepted-release allowlist introduced by Batch 2.4. Batch 2.3's immutable manuscript release supersedes it for import acceptance.

## Catalog record schemas

Contract v1 defines separate schemas for:

- [characters](../../schemas/story-package/v1/character.schema.json);
- [passages](../../schemas/story-package/v1/passage.schema.json);
- [variations](../../schemas/story-package/v1/variation.schema.json);
- [conditions](../../schemas/story-package/v1/condition.schema.json);
- [recursive journey-condition expressions](../../schemas/story-package/v1/condition-expression.schema.json);
- [prose beats](../../schemas/story-package/v1/prose-beat.schema.json);
- [edges](../../schemas/story-package/v1/edge.schema.json);
- [endings](../../schemas/story-package/v1/ending.schema.json); and
- [explanation metadata](../../schemas/story-package/v1/explanation.schema.json).
- [selection reasons](../../schemas/story-package/v1/selection-reason.schema.json).

Schema 1.1 retains every 1.0 catalog record and adds `kind: "expression"` conditions for history prefix/suffix, ordered occurrence, immediate adjacency, recency, visit counts, cross-passage visit sums, and recursive `all`/`any`/`not`. It also defines the independent `org.narramorph.selection-reason@1.0.0` explanation object. Generic mutable flags are not part of the contract; product facts remain named and typed.

The aggregate [catalog schema](../../schemas/story-package/v1/catalog.schema.json) fixes collection names. The executable validator additionally enforces cross-record references, globally unique IDs, safe paths, catalog/manifest agreement, resource bytes, compatibility, canonical bytes, and both hash layers.

## Stable identity

Every record ID is opaque:

```text
spv1_<kind>_<24 lowercase hexadecimal characters>
```

The 24 hexadecimal characters are the first 96 bits of:

```text
SHA-256("org.narramorph.story-package|v1|<kind>|<storyId>|<stableKey>")
```

Kinds have separate namespaces (`chr`, `psg`, `var`, `cnd`, `bet`, `edg`, `end`, and `exp`). A stable key is assigned once and is not a display title or file path. Renaming a title or moving a source file therefore preserves the opaque ID. If a semantic identity itself must split, merge, or change, the package version and an explicit migration/concordance entry are required; changing the stable key silently is forbidden.

Legacy runtime IDs remain descriptive metadata only. Import, saves, and provenance use opaque IDs after Contract v1 adoption.

## Deterministic ordering and serialization

`narramorph-canonical-json-v1` applies these rules:

1. Normalize JSON strings to Unicode NFC. Normalize prose line endings to LF before computing beat digests.
2. Reject `undefined`, non-finite numbers, and unsupported JSON values. Serialize negative zero as zero.
3. Sort every object key lexicographically by Unicode code unit.
4. Sort every catalog record collection by opaque `id`; sort manifest `passageIds`, condition references, source paths, and descriptor inputs before emission.
5. Preserve array order only where the contract defines it as semantic or has already prescribed the deterministic sort.
6. Emit compact UTF-8 JSON with no BOM or insignificant whitespace, followed by one LF.
7. Obtain `generatedAt` only from the reviewed descriptor's `sourceDateEpoch`. Wall-clock time, absolute workstation paths, locale, and directory enumeration order are excluded.

## Hash algorithm and coverage

All digests are lowercase SHA-256 hexadecimal.

1. Each prose beat hashes its NFC, LF-normalized authored text. Each copied resource hashes its exact bytes and records byte length.
2. `manifest.catalog.sha256` hashes the canonical catalog JSON without its trailing LF.
3. `manifest.contentHash` hashes the canonical JSON object `{ "catalog": <catalog>, "manifest": <manifest without contentHash> }`.

The package hash therefore covers identity, versions, provenance, licensing, timestamp input, compatibility, topology, all catalog records, prose digests, and declared resource hashes transitively. It excludes only the self-referential `contentHash` field and formatting's single terminal LF. Any semantic or byte-level covered change produces a new package hash.

## Compatibility and change classification

Both checks must pass: the package schema major is supported and the application version satisfies `supportedAppRange`.

| Change | Classification | Required action |
| --- | --- | --- |
| Add optional metadata that old v1 readers ignore; fix documentation; widen a compatible app range | Backward-compatible | Increment schema patch when executable meaning changes; rebuild and review. |
| Add a required v1 field with a defined default; rename or split stable identity; change condition semantics while v1 can still represent it | Migration required | Increment schema minor and story version; ship deterministic migration/concordance evidence. |
| Remove or reinterpret a required field; change canonicalization/hash/identity rules; require an unsupported runtime capability | App upgrade required | Increment schema major or raise the minimum app version; old apps reject before import. |
| Change authored content, topology, conditions, license, provenance, or release ID | New story package | Increment story version as SemVer requires, rebuild, review the semantic diff, and update accepted-release metadata. |

Unknown schema majors, malformed semantic versions/ranges, or packages outside the app range are hard failures. The staged importer adds release allowlisting; unknown editorial releases are also hard failures there.

## Authored and generated locations

| Location | Ownership | Edit rule |
| --- | --- | --- |
| `docs/contracts/` and `schemas/story-package/v1/` | Authored contract and schemas | Review through a contract PR. |
| `tools/conversion/lib/story-package.ts` and `story-package.ts` | Authored generic builder/validator | No story-specific validation branches. |
| `story-packages/sources/` | Authored deterministic inputs and synthetic fixture sources | Review changes; fixture prose is deliberately noncanonical. |
| `story-packages/fixtures/*/{manifest,catalog}.json` | Generated proof artifacts | Do not edit; rebuild. |
| `story-packages/eternal-return/{manifest,catalog}.json` | Generated runtime inventory | Do not edit; rebuild. It contains digests, not copied runtime prose. |
| `src/config/eternalReturnPackageIdentity.json` | Generated application/save fingerprint | Do not edit independently; it must match the shipped manifest. |
| Existing `src/data/stories/eternal-return/content/` | Authored runtime edition | Contract tooling reads and hashes; it never overwrites prose. |

## Saved journeys

Save schema `1.1.0` added required `appVersion` and `storyPackage` identity. Save schema `1.2.0` adds an append-only collection of historical selection records for reader explanations. New saves identify the application, save schema, and exact story package together. Save `1.0.0` remains loadable through a deterministic migration that assigns the checked-in current application/package identity; save `1.1.0` migrates with an empty explanation ledger rather than inventing past reasons. Migrations do not mutate their input.

## Reproduction

From the repository root after `npm run content:install`:

```bash
npm run story:package:build
npm run story:package:validate
npm run story:package:test
```

The test suite builds each fixture and Eternal Return twice, compares IDs, ordering, every emitted byte, and `contentHash`, and proves title/file rename stability. Negative tests cover malformed JSON, missing licensing, duplicate IDs, unsafe paths, resource and package hash tampering, unsupported schema versions, and incompatible app versions.
