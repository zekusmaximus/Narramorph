# Narramorph Conversion Tools

Markdown → JSON conversion pipeline for Narramorph content with validation, deduplication, and manifest tracking.

## Overview

This tooling converts the tracked Markdown source package in `archive/source-markdown/` into structured JSON for the Narramorph Fiction platform. See `docs/CONTENT_OWNERSHIP.md` for the current ownership boundary and safe command sequence.

## Status

**Week 1 Complete** (Core libraries + L1 pipeline)

- ✅ TypeScript project with Vitest
- ✅ All library modules implemented
- ✅ L1 conversion pipeline functional
- ⏳ L2/L3/L4 conversion (Weeks 2-4)
- ⏳ Validation CLI (Week 2)
- ⏳ Selection matrix generator (Week 3)
- ⏳ Diff & rollback tools (Week 4)

## Installation

```bash
cd tools/conversion
npm install
```

## Usage

### Story Package Contract v1

The same generic builder and validator process the two synthetic fixtures and Eternal Return. The contract inventory hashes authored runtime prose but never writes it.

```bash
npm run story-package:build
npm run story-package:validate
npm run story-package:test
```

See [`docs/contracts/story-package-v1.md`](../../docs/contracts/story-package-v1.md) for identity, canonicalization, hash coverage, compatibility, and generated-file boundaries.

### Convert L1 (Week 1)

```bash
# Convert Layer 1 content
npm run convert:l1

# Dry run (no file writes)
npm run convert:l1 -- --dry-run

# Strict mode (ERROR-level violations fail conversion)
npm run convert:l1 -- --strict

# Verbose logging
npm run convert:l1 -- --verbose
```

The CLI accepts `--source-root=<repository-relative-path>` when validating a temporary source package. The default is `archive/source-markdown`.

Use a dry run before any write:

```bash
npm run convert:all -- --dry-run
```

The current dry run intentionally reports the documented 80-versus-81 L1/L2 count-policy mismatch. Do not perform a full write until that policy and the curated L1 runtime package are reconciled.

### Type Check

```bash
npm run type-check
```

## Architecture

### Library Modules (`lib/`)

- **`log.ts`** - Structured logging with error codes and severities (BLOCKER/ERROR/WARNING/INFO)
- **`normalize.ts`** - Text normalization (NFC, BOM stripping, CRLF→LF, smart quote conversion, homoglyph detection)
- **`ids.ts`** - ID parsing, validation, and zero-padding (L1/L2: `XXX-LX-NNN`, L3: `XXX-L3-NNN`, L4: `final-XXX`)
- **`frontmatter.ts`** - YAML frontmatter parsing with strict validation
- **`fs.ts`** - Atomic writes, backup creation, manifest generation, file discovery
- **`validate.ts`** - Field validation with severity policies per canonical plan
- **`similarity.ts`** - MinHash+LSH duplicate detection (>95% similarity threshold)

### Conversion Pipeline

1. **Discover** - Recursively find markdown files with deterministic sorting
2. **Normalize** - Apply text normalization rules
3. **Parse** - Extract and validate frontmatter + content
4. **Validate** - Check required fields, enums, ID format, awareness ranges
5. **Aggregate** - L1/L2: combine 80 variations per node; L3/L4: per-file output
6. **Deduplicate** - Detect >95% similar variations within same group
7. **Output** - Write JSON with atomic file operations and manifest tracking

### Output Structure

```
src/data/stories/eternal-return/content/
├── layer1/
│   ├── arch-L1-variations.json       # 80 variations
│   ├── algo-L1-variations.json
│   └── hum-L1-variations.json
├── layer2/                            # Week 2
│   └── [9 files × 80 variations each]
├── layer3/                            # Week 3
│   ├── variations/                    # 270 individual section files
│   └── selection-matrix.json          # 45 combo mappings
├── layer4/                            # Week 4
│   ├── final-preserve.json
│   ├── final-release.json
│   └── final-transform.json
└── manifest.json                      # Source hashes, counts, timestamps
```

### JSON Schema

All outputs include `"schemaVersion": "1.0.0"` at top-level.

#### L1/L2 Aggregated Format

```json
{
  "schemaVersion": "1.0.0",
  "nodeId": "arch-L1",
  "totalVariations": 80,
  "variations": [
    {
      "id": "arch-L1-001",
      "transformationState": "initial",
      "awarenessRange": [0, 100],
      "content": "Full narrative text...",
      "metadata": { "wordCount": 895, ... }
    }
  ]
}
```

## Validation Severities

Per `docs/CONVERSION_TOOLING_PLAN.md`:

### BLOCKER (always fail)

- Missing required frontmatter fields
- Invalid enum values
- Duplicate IDs
- Invalid awarenessRange rules
- Missing `schemaVersion`
- conv-L3 missing `characterVoices` or has <2 voices

### ERROR (fail in --strict mode only)

- Count mismatches (L1/L2 not 80 variations)
- Missing matrix coverage
- Invalid zero-padding

### WARNING (never fail, even in strict)

- Word count drift >10%
- Optional metadata gaps
- Homoglyphs detected
- High similarity (>95%) within same group

## Development

### Run Tests (Week 1 - fixtures pending)

```bash
npm test
```

### Add New Layer Conversion

1. Implement `convertLX()` function in `convert-md-to-json.ts`
2. Add output interface
3. Update manifest counts
4. Add validation rules to `validate.ts`
5. Create test fixtures in `tests/fixtures/lX/`
6. Add integration tests

## Roadmap

- **Week 1** ✅ - Core libraries + L1 conversion
- **Week 2** - Validator CLI + L2 pipeline + tests + severity enforcement + error codes doc
- **Week 3** - Watch mode + L3 pipeline + matrix generator + property tests
- **Week 4** - Diff/rollback + L4 + performance tuning + docs + full integration tests

## References

- Canonical Plan: `../../docs/CONVERSION_TOOLING_PLAN.md`
- Punch List: `../../docs/CONTENT_CONVERSION_PUNCH_LIST.md`
- Data Schema: `../../docs/DATA_SCHEMA.md`
