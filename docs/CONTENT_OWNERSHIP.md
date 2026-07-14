# Content ownership and reproducibility

Updated: July 14, 2026

This document defines which story files are authored, generated, or consumed directly by the application. It describes the current repository boundary; `docs/archive/` remains historical context only.

## Canonical authoring inputs

The complete Markdown authoring package is tracked under `archive/source-markdown/`. Despite the directory name, this root-level source package is the input expected by the conversion tooling. It is distinct from `docs/archive/`, which is historical documentation and must not drive implementation decisions.

Authoring inputs include:

- `archive/source-markdown/{arch,algo,hum}-L1-production/`;
- `archive/source-markdown/{arch,algo,hum}-L2-{accept,resist,invest}-production/`;
- `archive/source-markdown/L3/*-L3-production/`;
- `archive/source-markdown/L4/L4-{PRESERVE,RELEASE,TRANSFORM}.md`.

Framework guides and exemplars under `docs/` guide writing but are not conversion inputs.

## Generated conversion outputs

The conversion package writes JSON beneath `src/data/stories/eternal-return/content/`:

- L1 and L2 `*-variations.json` files;
- L3 individual files under `layer3/variations/`;
- L4 individual `final-*.json` files;
- `manifest.json` conversion provenance and declared record counts.

The aggregate command derives the four L3 `*-L3-variations.json` files and `layer4/terminal-variations.json` from the individual outputs. The matrix command derives `selection-matrix.json`.

Do not edit generated narrative JSON directly. Change Markdown source, run conversion, inspect the diff, regenerate aggregates and the matrix where applicable, then run both validators.

## Checked-in runtime inputs

The application imports these files directly:

- `story.json`, the three character node-definition files, `terminals.json`, `layout.json`, and `unlock-config.json`;
- L1 and L2 aggregate variation files;
- the four L3 aggregate variation files;
- the three L4 `final-*.json` terminal files;
- `selection-matrix.json`.

The L3 individual files, terminal aggregate, runtime profile, and conversion manifest remain checked in as reproducible conversion inputs or outputs and are cross-checked against their aggregates where applicable.

## Cross-repository literary release boundary

`Eternal_Return_Manuscript` is the canonical long-form literary/editorial source. Narramorph's checked-in story graph and runtime passages are a separately authored interactive edition. The authority and approval workflow is defined by [ADR 0002](adr/0002-content-authority-and-edition-semantics.md).

- A manuscript literary release may supply versioned structured context, constraints, provenance, and explicitly approved excerpts. It is not an authoring tree for Narramorph.
- Import is staging-only until a reviewed pull request accepts release metadata and concordance changes.
- No importer may create, replace, normalize, or edit narrative content beneath `src/data/stories/`. Runtime prose changes remain authored diffs.
- No Narramorph build, test, runtime, or reader export may fetch another repository or depend on GitHub credentials.
- No Narramorph command may write into a manuscript checkout.
- Generated staging/output declares its source and do-not-edit boundary and remains separate from checked-in authored inputs.

A reader-specific journey export is derived from an identified application/save version and story-package version. It is never an authoring input for the manuscript or runtime edition.

## Commands

Install the locked conversion dependencies once:

```bash
npm run content:install
```

Validate checked-in runtime inputs strictly, without migration repair:

```bash
npm run content:validate:runtime
```

Validate generated conversion outputs with the conversion package:

```bash
npm run content:validate
```

Preview a full conversion without writing files:

```bash
npm run content:convert:all -- --dry-run
```

Regenerate derived outputs after an intentionally reviewed conversion:

```bash
npm run content:aggregate
npm run content:matrix
npm run content:diff
```

## Source and runtime profile

The source package contains 243 L1, 729 L2, 270 L3, and 3 L4 records. Every L1/L2 authoring group contains 81 records. `content/runtime-profile.json` declares those authored counts and names the stable L1 IDs included in the checked-in reader package: 3 Archaeologist, 4 Algorithm, and 5 Human variations. L2 is not curated and remains complete at 729 records.

The converter validates and deterministically reindexes all 81 authored records before applying the L1 allowlist, so a missing authored record or selected runtime ID fails instead of silently changing selection outcomes. A strict full dry run reports 12 L1, 729 L2, 270 L3, and 3 L4 runtime records with no blockers or errors. Review generated diffs before any full write because provenance timestamps and narrative normalization warnings remain intentionally visible.

## Manifest checksum decision

A package-level checksum is deferred until a second story is introduced. The source/runtime boundary is now resolved, but a checksum designed only around Eternal Return would risk encoding story-specific file assumptions as a platform contract. Source-file hashes already exist in conversion provenance, while strict structural, count, ordering, aggregate, and reference checks cover the current package. When a second story fixture exists, define one timestamp-independent canonical file list and checksum algorithm that both packages can satisfy.
