# Conversion Tooling Implementation Prompt (v3)

Implement the Markdown→JSON conversion pipeline for Narramorph Fiction by following `docs/CONVERSION_TOOLING_PLAN.md` exactly. Read that document first. Everything below is a convenience summary—if anything conflicts with the canonical plan, the plan wins.

## Canonical References

- Canonical plan: `docs/CONVERSION_TOOLING_PLAN.md`
- Punch list context: `docs/CONTENT_CONVERSION_PUNCH_LIST.md`
- Data schema: `docs/DATA_SCHEMA.md`

## Before You Start

1. Read the canonical plan first: open and review `docs/CONVERSION_TOOLING_PLAN.md` completely.
2. Examine the codebase: review the current structure of `tools/`, `src/data/`, and `docs/`.
3. Identify dependencies: note any existing utilities that can be reused.
4. Confirm ambiguities: ask about any unclear requirement before writing code.
5. Propose file structure: show the complete directory tree you will create in `tools/conversion/` before implementation.

## Project Context

- Source markdown: `docs/L1/`, `docs/L2/`, `docs/L3/`, `docs/L4/`
- Output JSON root: `src/data/stories/eternal-return/content/`
- Tools: `tools/conversion/`
- Tool libs: `tools/conversion/lib/`
- Tests/fixtures: `tools/conversion/tests/` and `tools/conversion/tests/fixtures/`
- Reports: `tools/conversion/reports/`
- Backups: `.backups/`

## Output Locations (from Plan)

- L1: `src/data/stories/eternal-return/content/layer1/{arch|algo|hum}-L1-variations.json`
- L2: `src/data/stories/eternal-return/content/layer2/{arch|algo|hum}-L2-{accept|resist|invest}-variations.json`
- L3 variations: `src/data/stories/eternal-return/content/layer3/variations/{arch|algo|hum|conv}-L3-XXX.json`
- L3 matrix: `src/data/stories/eternal-return/content/layer3/selection-matrix.json`
- L4: `src/data/stories/eternal-return/content/layer4/final-{preserve|release|transform}.json`
- Manifest: `src/data/stories/eternal-return/content/manifest.json`

## Tech Stack

- Node.js + TypeScript 5
- Vitest for testing

## Scope & Phases

- Week 1 (core): library modules + L1 conversion
- Week 2 (validation + L2): validator + L2 pipeline + tests
- Week 3 (L3 + matrix + watch): L3 per-file conversion + matrix generator + watch mode
- Week 4 (polish + L4): diff + rollback + L4 + docs + performance caps

## Implementation Checkpoints

After each phase, stop and confirm:

1. Week 1: lib modules + L1 converter working on a 3-file fixture.
2. Week 2: validation report with all severity levels (BLOCKER/ERROR/WARNING).
3. Week 3: selection matrix output for fixture L3 set with property test passing.
4. Week 4: full pipeline test including rollback demonstration.

## Implement (Follow Plan Exactly)

- Library modules (in `tools/conversion/lib/`):
  - `frontmatter.ts` — strict YAML parsing.
  - `normalize.ts` — NFC, strip BOM, CRLF→LF, remove ZW chars/dir marks, smart quotes→ASCII, homoglyph scan.
  - `ids.ts` — ID parsing/validation/zero-padding rules.
  - `fs.ts` — atomic writes, temp dirs, manifest creation, backups.
  - `log.ts` — structured logging with error codes and severities.
  - `validate.ts` — field validation and severity policy per plan.
  - `similarity.ts` — MinHash+LSH ≥95% within-group similarity.
- Conversion CLI: `tools/conversion/convert-md-to-json.ts`
  - Discover files, normalize, parse FM, validate, aggregate L1/L2 (80), emit L3/L4 per-file.
  - Manifest with source hashes (frontmatter + body), counts.
  - Flags: `--layer`, `--nodes`, `--ids`, `--dry-run`, `--parallel=4`, `--strict`, `--watch`, `--debounce=500`.
- Validation CLI: `tools/conversion/validate-content.ts`
  - Severities and rules exactly as plan.
  - Report → `tools/conversion/reports/validation.json`.
  - Flags: `--strict`, `--max-warnings-per-type=50`.
- L2 pipeline specifics: accept/resist/invest handled and validated.
- L3 matrix: `tools/conversion/generate-selection-matrix.ts`
  - Per-character mapping; conv-L3 count=45; deterministic numeric-then-lex tie-breaking.
  - Missing coverage → ERROR; strict → fail.
- Diff tool: `tools/conversion/diff-content.ts`
  - Compare manifests/dirs; canonicalize JSON; report added/removed/changed with field-level diffs.
- Rollback: `tools/conversion/rollback.ts`
  - Restore from `.backups/<timestamp>/` via manifest; support `--to`, `--layer`, `--nodes`.
- L4 pipeline: convert and validate terminal endings.

## Schema & Output Format

- Include `"schemaVersion": "1.0.0"` at top-level in every output.
- L1/L2 aggregated files: `{ schemaVersion, nodeId, totalVariations: 80, variations: [...] }` with `id: {nodeId}-{NNN}`; NNN ∈ 001–080.
- L3 files: `{ schemaVersion, id: {sectionType}-{NNN}, sectionType, selectionKey, content, metadata }` with NNN ∈ 001–270.
- L4 files: `{ schemaVersion, id: final-{preserve|release|transform}, philosophy, content or sections, metadata }`.

## conv‑L3 Requirements

- Same selectionKey as character sections.
- Must include `characterVoices: string[]` with length ≥2 (BLOCKER if missing/invalid).
- Same deterministic selection logic as other sections.

## Determinism & Performance

- Always sort discovered files; process in parallel; aggregate and write in sorted order.
- Hash source markdown (frontmatter + body), not output JSON.
- `MAX_CONCURRENT_READS=10`; default `--parallel=4`.
- Stream files >100KB.

## Error Handling

- Wrap all I/O in try-catch with actionable messages.
- Validation errors include: file path, field name, invalid value, valid options, example fix.
- Atomic writes only; failed conversions must not corrupt existing JSON.
- Partial failures are reported in `validation.json`, not unhandled exceptions.

## Testing Requirements

- Unit tests for every lib (edge cases covered).
- Fixtures: full 80-var L1 set; representative L2; full 3×3×5 L3 stubs; 3 L4 terminals.
- Property-based tests: matrix must have exactly one section per type for all 45 combos.
- Integration tests: counts and strict mode behavior.

## CLI Commands

```bash
npm run content:convert -- --layer=all --strict
npm run content:convert -- --layer=1 --nodes=arch-L1,algo-L1
npm run content:convert -- --watch --layer=3 --debounce=500
npm run content:matrix -- --strict
npm run content:validate -- --strict --max-warnings-per-type=50
npm run content:diff -- --before=.backups/2025-11-09T12-00-00 --after=src/data/stories/eternal-return/content
npm run content:rollback -- --to=2025-11-09T12-00-00 --layer=3
```

## Acceptance Criteria

- All tools compile and run with documented flags.
- Outputs follow schema and zero-padding rules; `schemaVersion` present.
- Manifest created with source hashes; rollback works.
- L3 selection matrix complete and deterministic; property tests pass.
- Validation report generated; severities enforced per plan.
- Tests: all unit + fixture + property-based + integration tests pass with `npm test`.
- No placeholders: functions fully implemented; no TODOs or stub comments.
- Type safety: no implicit `any` (justify explicit `any` in comments if absolutely required).
