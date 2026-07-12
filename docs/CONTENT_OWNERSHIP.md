# Content ownership and reproducibility

Updated: July 12, 2026

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

- `story.json`, the three character node-definition files, `layout.json`, and `unlock-config.json`;
- L1 and L2 aggregate variation files;
- the four L3 aggregate variation files;
- `selection-matrix.json`.

The L3 individual files, L4 individual files, terminal aggregate, and conversion manifest remain checked in as reproducible conversion outputs and are cross-checked against their aggregates even where the current reader path does not import them directly.

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

## Current reconciliation boundary

The source package contains 243 L1, 729 L2, 270 L3, and 3 L4 records. Every L1/L2 authoring group contains 81 records, while the conversion package still carries an older 80-record strict-count policy. The checked-in runtime deliberately contains a curated 12-record L1 set and the complete 729-record L2 set.

Consequently, a full conversion write would change L1 selection outcomes and is not an approved routine regeneration step yet. The dry run is reproducible and exposes the twelve count-policy mismatches; resolving the 80-versus-81 contract and the curated L1 packaging decision is the next content-pipeline change. Do not use a full write merely to make validation green.

## Manifest checksum decision

A package-level checksum is deferred. Source-file hashes already exist in conversion provenance, while timestamps, legacy path entries, and the unresolved curated L1 boundary prevent a package checksum from being a stable or useful contract today. Strict structural, count, ordering, aggregate, and reference checks provide the useful reproducibility guarantees before a second story. Revisit deterministic package checksums after the source/runtime reconciliation is complete or when a second story is introduced.
