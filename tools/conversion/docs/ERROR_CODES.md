# Conversion Error Codes

Complete reference of error codes used in the Markdown→JSON conversion pipeline with severities, descriptions, and fixes.

## Severity Levels

- **BLOCKER** - Always fails conversion. Critical issues that prevent valid output.
- **ERROR** - Fails conversion in strict mode only. Count mismatches, padding errors, missing coverage.
- **WARNING** - Never fails (even in strict mode). Word count drift, optional fields, homoglyphs, similarity.
- **INFO** - Informational messages about normalization and processing.

## Error Code Reference

### BLOCKER Severity

#### MISSING_FRONTMATTER
**Description**: No YAML frontmatter found in markdown file

**Fix**: Add YAML frontmatter between `---` delimiters at start of file
```markdown
---
variation_id: arch-L1-001
variation_type: initial
word_count: 1000
---
Content goes here...
```

#### INVALID_FRONTMATTER
**Description**: Frontmatter must be a YAML object

**Fix**: Ensure frontmatter is valid YAML with proper indentation (no tabs)

#### YAML_PARSE_ERROR
**Description**: Failed to parse YAML frontmatter

**Fix**: Check YAML syntax - ensure proper indentation, no tabs, valid structure

#### MISSING_FIELD
**Description**: Required frontmatter field is missing or null

**Fields**:
- L1/L2: `variation_id`, `variation_type`, `word_count`
- L3: `variationId`, `journeyPattern`, `philosophyDominant`, `awarenessLevel`
- L4: `id`, `philosophy`

**Fix**: Add the missing field to frontmatter with appropriate value

#### INVALID_ENUM
**Description**: Field value not in allowed enum values

**Enums**:
- `variation_type`: `initial`, `firstRevisit`, `metaAware`
- `journeyPattern`: `linear`, `exploratory`, `recursive` (plus extended values for actual source)
- `philosophyDominant`: `accept`, `resist`, `invest`
- `awarenessLevel`: `veryLow`, `low`, `medium`, `high`, `maximum`
- `philosophy` (L4): `preserve`, `release`, `transform`

**Fix**: Change field to one of the valid enum values listed in the error

#### INVALID_AWARENESS
**Description**: Awareness range forbidden for initial state or required for firstRevisit/metaAware

**Fix**:
- For `initial` variations: Remove `awareness` from `conditions`
- For `firstRevisit`/`metaAware`: Add `awareness: "0-100%"` to `conditions`

#### MISSING_SCHEMA_VERSION
**Description**: Output JSON must include schemaVersion field

**Fix**: This is automatically added by converter. Check generator code if this occurs.

#### MISSING_CHARACTER_VOICES
**Description**: conv-L3 variations must have `characterVoices` array with ≥2 voices

**Fix**: Add to frontmatter:
```yaml
characterVoices: [archaeologist, algorithm, last-human]
```

#### INVALID_CHARACTER_VOICES
**Description**: conv-L3 `characterVoices` must have at least 2 voices

**Fix**: Add at least 2 character voices to the array

#### DUPLICATE_ID
**Description**: Duplicate variation ID found within scope

**Fix**: Ensure all variation IDs are unique within their node/layer

#### UTF8_INVALID
**Description**: File contains illegal control characters

**Fix**: Remove control characters (except tab, newline, carriage return) from source file

#### FILE_READ_ERROR
**Description**: Failed to read source file

**Fix**: Check file exists and has proper read permissions

#### FILE_WRITE_ERROR
**Description**: Failed to write output file

**Fix**: Check directory exists and has write permissions

### ERROR Severity

#### COUNT_MISMATCH
**Description**: Expected variation count doesn't match actual count

**Expected Counts**:
- L1: 80 variations per node (1 initial + 46 firstRevisit + 33 metaAware)
- L2: 80 variations per node
- L3: 270 total variations (45 per character section type + 135 conv)
- L4: 3 terminal variations

**Fix**: Add or remove variations to match expected count

**Strict Mode**: Fails conversion
**Non-strict Mode**: Warns but continues

#### INVALID_PADDING
**Description**: Variation ID has invalid zero-padding

**Padding Rules**:
- L1/L2: 3-digit padding (e.g., `arch-L1-001`, not `arch-L1-1`)
- L3: 3-digit padding (e.g., `arch-L3-042`, not `arch-L3-42`)
- L4: No numeric padding (e.g., `final-preserve`)

**Fix**: Add zero-padding to meet 3-digit requirement

#### MATRIX_MISSING_COMBO
**Description**: L3 selection matrix missing coverage for combo

**Expected**: 45 combinations (3 journey × 3 philosophy × 5 awareness)

**Fix**: Add missing variation for the combo to matrix

#### ID_MISMATCH
**Description**: Variation ID doesn't match expected format for layer/type

**Fix**: Correct the ID to match layer conventions

### WARNING Severity

#### WORD_COUNT_DRIFT
**Description**: Actual word count differs from declared count by >10%

**Fix**: Update `word_count` in frontmatter to match actual content, or adjust content length

**Note**: This is a WARNING, not an error, as some drift is acceptable

#### NORMALIZE_ZERO_WIDTH
**Description**: Removed zero-width characters from content

**Characters Removed**: ZWSP (U+200B), ZWJ (U+200C), ZWNJ (U+200D), BOM (U+FEFF)

**Fix**: These are automatically removed. Review source if unexpected.

#### NORMALIZE_DIRECTIONAL
**Description**: Removed directional marks from content

**Marks Removed**: LRM (U+200E), RLM (U+200F)

**Fix**: Automatically removed. No action needed unless bidirectional text is intentional.

#### HOMOGLYPH_DETECTED
**Description**: Potential Cyrillic characters that look like Latin detected

**Common Examples**:
- 'А' (Cyrillic) looks like 'A' (Latin)
- 'е' (Cyrillic) looks like 'e' (Latin)
- 'р' (Cyrillic) looks like 'p' (Latin)

**Fix**: Review content and replace Cyrillic with Latin if unintentional

#### SIMILARITY_HIGH
**Description**: >95% similarity detected between variations in same group

**Fix**: Review variations for duplicate content. Ensure each variation is sufficiently distinct.

**Note**: This uses MinHash+LSH for efficient similarity detection

#### MISSING_GENERATOR_VERSION
**Description**: Manifest missing generatorVersion field

**Fix**: Automatically added by converter. Informational only.

### INFO Severity

#### NORMALIZE_SMART_QUOTES
**Description**: Converted smart quotes to ASCII quotes

**Conversions**:
- `"` (U+201C) → `"`
- `"` (U+201D) → `"`
- `'` (U+2018) → `'`
- `'` (U+2019) → `'`

**Fix**: No action needed. Automatic normalization for consistency.

#### CONVERSION_START
**Description**: Conversion process started

#### L1_START, L2_START, L3_START, L4_START
**Description**: Layer conversion started

#### L1_DISCOVERED, L2_DISCOVERED, L3_DISCOVERED, L4_DISCOVERED
**Description**: Files discovered for layer conversion

#### L1_WRITTEN, L2_WRITTEN, L3_WRITTEN, L4_WRITTEN
**Description**: Output file successfully written

#### L1_COMPLETE, L2_COMPLETE, L3_COMPLETE, L4_COMPLETE
**Description**: Layer conversion completed with count summary

#### MANIFEST_WRITTEN
**Description**: Manifest file successfully written

#### BACKUP_CREATED
**Description**: Backup created at specified path

#### REPORT_WRITTEN
**Description**: Validation report written to file

## Usage Examples

### Check Specific Error in Code

```typescript
const logger = new Logger();
// ... processing ...
if (logger.hasBlockers()) {
  console.error('Conversion failed due to blockers');
  process.exit(1);
}
```

### Filter Errors by Severity

```typescript
const blockers = logger.getEntriesBySeverity('BLOCKER');
const errors = logger.getEntriesBySeverity('ERROR');
const warnings = logger.getEntriesBySeverity('WARNING');
```

### Get Error Count Summary

```typescript
const counts = logger.getCounts();
console.log(`Blockers: ${counts.BLOCKER}`);
console.log(`Errors: ${counts.ERROR}`);
console.log(`Warnings: ${counts.WARNING}`);
```

## Validation Report Format

The validation CLI generates a JSON report with all errors:

```json
{
  "timestamp": "2025-11-09T17:48:00.000Z",
  "totalFiles": 15,
  "validFiles": 12,
  "invalidFiles": 3,
  "summary": {
    "blockers": 5,
    "errors": 2,
    "warnings": 8,
    "info": 15
  },
  "warningsByType": {
    "WORD_COUNT_DRIFT": 3,
    "SIMILARITY_HIGH": 5
  },
  "entries": [
    {
      "code": "MISSING_FIELD",
      "severity": "BLOCKER",
      "message": "Required field missing: variation_type",
      "file": "/path/to/file.md",
      "field": "variation_type",
      "exampleFix": "Add variation_type to frontmatter",
      "timestamp": "2025-11-09T17:48:00.123Z"
    }
  ]
}
```

## Related Documentation

- [Conversion Tooling Plan](../../../docs/CONVERSION_TOOLING_PLAN.md)
- [Data Schema](../../../docs/DATA_SCHEMA.md)
- [Validation README](../README.md#validation-severities)
