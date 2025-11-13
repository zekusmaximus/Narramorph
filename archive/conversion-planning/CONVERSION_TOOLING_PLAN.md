# Conversion Tooling Plan (Option C)

This is the finalized, implementation‑ready plan for the Markdown → JSON conversion pipeline for Narramorph (Eternal Return).

## Decisions Locked

- L3 matrix = per‑character mapping (Option B): 45 combos × 3 character sections + 45 conv sections = 180 total entries across 4 arrays.
- conv‑L3 count = 45 (one per combo).
- Dedup policy = WARNING at >95% similarity within same transformationState, using MinHash + LSH; strict does not elevate.
- Parallelism default = 4; MAX_CONCURRENT_READS = 10.

## conv‑L3 Requirements

- SelectionKey identical to character sections (journeyPattern, pathPhilosophy, awarenessLevel).
- Frontmatter must include multi‑voice metadata:
  - Required: `characterVoices: ['archaeologist','algorithm','last-human']` (length ≥ 2)
  - Validator enforces; BLOCKER if missing or <2.
- Selection: same logic as character sections (deterministic, lowest numeric ID per combo).

## schemaVersion & ID Formats

- Include `schemaVersion` at top‑level in every output file.
- L1/L2 aggregated files:
  - `{ "schemaVersion": "1.0.0", "nodeId": "arch-L1", "totalVariations": 80, "variations": [...] }`
- L3/L4 per‑file:
  - `{ "schemaVersion": "1.0.0", "id": "arch-L3-001", ... }`
- Zero‑padding rules:
  - L1/L2 variations: `{nodeId}-{NNN}` with NNN ∈ 001–080 (reject `-1`, require `-001`).
  - L3: `{sectionType}-{NNN}` with NNN ∈ 001–270 (3 digits).
  - L4: `final-{preserve|release|transform}` (no numeric suffix).

## Manifest, Rollback, Determinism

- Manifest path: `src/data/stories/eternal-return/content/manifest.json`.
- Manifest fields:
  - `{ schemaVersion, generatorVersion, convertedAt, sourceRoot, files: { [mdPath]: { sourceHash, outputPath, convertedAt } }, counts }`
  - Hash the source markdown (frontmatter + body), not output JSON.
- Rollback CLI:
  - Full: `npm run content:rollback -- --to=YYYY-MM-DDTHH-mm-ss`
  - Layer‑only: `--layer=3`
  - Node‑specific: `--nodes=arch-L1,algo-L1`
- Determinism with parallelism:
  - Discover → sort → process in parallel → aggregate/sort by ID → write.

## Watch Mode

- Scope: watch markdown under `docs/` only; ignore JSON outputs.
- Granularity: re‑convert only impacted unit (L1/L2: node; L3/L4: file/ID).
- Debounce: 500ms; auto‑validate with WARNINGS only (no fail).
- Example: `npm run content:convert -- --watch --layer=1 --debounce=500`

## Normalization & Encoding (Pre‑Parse)

- Normalize to NFC; strip BOM; CRLF → LF.
- Remove zero‑width (ZWSP, ZWJ, ZWNJ) and directional marks (LRM, RLM).
- Normalize smart quotes to ASCII `'` and `"`; collapse multiple spaces.
- Homoglyph scan (Cyrillic vs Latin) → WARNING.
- Reject illegal control chars (BLOCKER), allow `\t\n\r`.

## Validation & Severity

- BLOCKER (always fail):
  - Missing required frontmatter fields
  - Invalid enums
  - Duplicate IDs
  - Invalid awarenessRange rules (required for firstRevisit/metaAware; forbidden for initial)
  - Irreparable UTF‑8 / control chars
  - Missing `schemaVersion`
  - conv‑L3 missing `characterVoices` or has <2 voices
- ERROR (fail in strict; otherwise report only):
  - Count mismatches (e.g., L1/L2 not 80)
  - Missing matrix coverage for any combo/section type
  - Filename/ID mismatch; invalid zero‑padding
- WARNING (never fail; remains warning in strict):
  - Word count drift
  - Optional metadata gaps
  - Homoglyphs
  - High similarity (>95%) within same transformationState

## Dedup Checks (Efficient)

- Scope: within same node + transformationState (L1/L2) and within L3 sectionType+selectionKey.
- Technique: tokenize → shingles → MinHash (k≈100) → LSH buckets → compare pairs in same bucket.
- Threshold: flag when estimated Jaccard ≥ 0.95 (WARNING).

## Selection Matrix Generation

- Read valid L3 files; group by `{journeyPattern, pathPhilosophy, awarenessLevel}`.
- For each combo:
  - Choose one `arch-L3`, one `algo-L3`, one `hum-L3`, one `conv-L3`.
  - Determinism: sort IDs numeric‑then‑lex; pick the first.
  - Missing candidate → ERROR (strict: fail).
- Output: `content/layer3/selection-matrix.json` with metadata:
  - `{ version, generatedAt, sortOrder: 'numericThenLex', coverage: { arch:45, algo:45, hum:45, conv:45 }, missing: [] }`
- Property‑based tests: ensure exactly one per type for every 3×3×5 combo.

## CLI & Scripts

- `tools/conversion/convert-md-to-json.ts`
  - Flags: `--layer`, `--nodes`, `--ids`, `--dry-run`, `--out`, `--parallel`, `--watch`, `--debounce`, `--strict`
- `tools/conversion/generate-selection-matrix.ts`
  - Flags: `--strict`, `--report`
- `tools/conversion/validate-content.ts`
  - Flags: `--strict`, `--report`, `--max-warnings-per-type`
- `tools/conversion/diff-content.ts`
  - Flags: `--before`, `--after`, `--summary-only`
- `tools/conversion/rollback.ts`
  - Flags: `--to`, `--layer`, `--nodes`
- Libraries (tools/conversion/lib): `frontmatter.ts`, `normalize.ts`, `ids.ts`, `fs.ts`, `log.ts`, `validate.ts`, `similarity.ts`

## Docs & Error Codes

- `docs/error-codes.md` with code, severity, description, fix (MISSING_FIELD, INVALID_ENUM, COUNT_MISMATCH, INVALID_PADDING, UTF8_INVALID, MATRIX_MISSING_COMBO, SIMILARITY_HIGH, etc.).
- CHANGELOG template + `content:migrate` placeholder with example migration stanza.

## Performance & Limits

- MAX_CONCURRENT_READS = 10; default `--parallel=4`.
- STREAM_THRESHOLD_KB = 100 (stream large L4 files).
- Report caps: `MAX_WARNINGS_PER_TYPE = 50` and summarize beyond cap.

## Testing

- Fixtures: full 80‑variation L1, representative L2, full 3×3×5 L3 stubs, 3 L4 terminals.
- Unit: normalization, FM parsing, ID padding, awareness rules.
- Property‑based: matrix coverage + exactly one section per type per combo.
- Integration: count validation and strict mode behavior.

## Implementation Steps (Phased)

- Week 1: conversion core + normalization + L1 pipeline.
- Week 2: validator + L2 pipeline + unit tests + severity + error codes.
- Week 3: incremental/watch + L3 pipeline + matrix generator + property tests.
- Week 4: diff/rollback + L4 + perf caps + docs + fixture polish.

## Open Questions (All Defaulted)

- Matrix per‑character mapping: CONFIRMED.
- conv‑L3 count: 45 (one per combo), requires multi‑voice `characterVoices`.
- Dedup policy: WARNING >95%, MinHash+LSH; not elevated in strict.
- Parallel defaults: `--parallel=4`, `MAX_CONCURRENT_READS=10`.
