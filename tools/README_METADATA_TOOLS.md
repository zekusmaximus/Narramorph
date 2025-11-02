# L2 Metadata Insertion Tooling

## Overview

This tooling suite helps add comprehensive metadata to all existing L2 variation markdown files. The metadata is required for the L3 generation system to create journey-responsive convergence nodes.

## Files in This Suite

1. **inventory-l2-variations.js** - Scans and analyzes existing files
2. **insert-l2-metadata.js** - Adds metadata to files
3. **README_METADATA_TOOLS.md** - This file

## Prerequisites

```bash
npm install js-yaml
```

## Workflow

### Step 1: Inventory Existing Files

Run this FIRST to understand what files exist and what metadata would be automatically extracted:

```bash
node inventory-l2-variations.js
```

This will:
- Find all L2 variation files in configured directories
- Show counts by character, path, transformation state
- Display which files already have metadata
- Show automated analysis for sample files
- Provide next steps

**Save detailed report:**
```bash
node inventory-l2-variations.js --output=inventory-report.json
```

### Step 2: Add Metadata (Choose Mode)

#### Option A: Interactive Mode (Recommended for Quality)

Best for: High-quality metadata with human judgment

```bash
node insert-l2-metadata.js
```

This will:
- Process each file one at a time
- Show automated analysis suggestions
- Prompt you for metadata values
- Allow you to refine/correct automated suggestions
- Backup original files before modification
- Add complete YAML frontmatter

**Time estimate:** 35-55 minutes per variation

#### Option B: Batch Mode (Fast but Requires Review)

Best for: Quick initial pass, manual review after

```bash
node insert-l2-metadata.js --batch
```

This will:
- Process all files automatically
- Use only automated analysis
- Mark fields requiring manual review as 'REVIEW_REQUIRED'
- Still backup original files
- Allow you to edit metadata later in text editor

**Time estimate:** ~1-2 minutes per variation

#### Option C: Dry Run (Preview Only)

Best for: Testing before committing

```bash
node insert-l2-metadata.js --dry-run
```

This will:
- Show what metadata would be added
- Not modify any files
- Not create backups
- Let you verify the process works

#### Option D: Single File

Best for: Testing or fixing specific files

```bash
node insert-l2-metadata.js --file=path/to/arch-L2-accept-FR-01.md
```

## Configuration

Edit the scripts to customize:

### Search Paths

Both scripts search these locations (edit in scripts if needed):

```javascript
searchPaths: [
  '/mnt/user-data/outputs',
  '/mnt/user-data/content/layer-2',
  './content/layer-2',
  './outputs'
]
```

### Filename Pattern

Files must match this pattern:
```
(arch|algo|hum)-L2-(accept|resist|investigate)-(FR|MA)-(\d+).md
```

Examples:
- `arch-L2-accept-FR-01.md` ✅
- `algo-L2-resist-MA-15.md` ✅
- `hum-L2-investigate-FR-23.md` ✅
- `random-file.md` ❌

## Metadata Structure

The scripts add complete metadata including:

### Basic Info
- variationId, nodeId, character, layer
- pathPhilosophy, transformationState
- awarenessRange, wordCount, createdDate

### Thematic Content
- primaryThemes (3-5 themes)
- secondaryThemes (2-4 themes)
- consciousnessQuestion
- philosophicalStance
- observerEffect
- crossCharacterReferences

### Narrative Elements
- worldBuildingFocus
- locationElements
- technicalDetails
- emotionalTone
- observerPosition
- temporalBleedingLevel
- voiceSignature
- narrativeArc
- pacing

### L3 Seed Contributions
For each of preserve/release/transform:
- text (seed description)
- weight (strong/moderate/light)
- keyPhrases (supporting phrases)

### Generation Hints
- keyPhrases (5-10 memorable quotes)
- philosophicalCulmination
- convergenceAlignment
- narrativeProgression
- characterDevelopment
- emotionalJourney

### Character Development
- stanceEvolution
- relationshipToArchive
- relationshipToMethod
- awarenessOfOthers
- selfAwareness
- philosophicalEvolution

## Automated Analysis Features

The scripts automatically extract:

**Themes:** Pattern matching for consciousness, preservation, verification, etc.

**Key Phrases:** Philosophical sentences 5-20 words with thematic keywords

**Emotional Tone:** Detection of contemplative, peaceful, skeptical, etc.

**World Building:** Extraction of locations, technology, technical terms

**Cross-Character References:** Detection of algorithm/archaeologist/human mentions

**Awareness Indicators:** Signs of temporal awareness, meta-reference, frame-consciousness

**Awareness Range Estimation:** Based on transformation state and content analysis

## Safety Features

### Automatic Backups

Before modifying any file, the script creates a backup:

```
./metadata-backups/arch-L2-accept-FR-01.md.2025-01-15T10-30-00-000Z.bak
```

### Frontmatter Detection

Scripts automatically skip files that already have frontmatter to avoid duplicate metadata.

### Validation

After adding metadata, scripts validate:
- YAML structure is valid
- All required fields present
- Data types correct
- Value constraints met

## Example Output

### Before (original file):
```markdown
# Variation Content

She examined the fragment in Chamber Seventeen...
```

### After (with metadata):
```markdown
---
variationId: arch-L2-accept-FR-01
nodeId: arch-L2-accept
character: archaeologist
layer: 2
pathPhilosophy: accept
transformationState: firstRevisit
awarenessRange:
  - 41
  - 50
wordCount: 1650
createdDate: '2025-01-15'
thematicContent:
  primaryThemes:
    - preservation
    - witness-methodology
    - acceptance-without-proof
  consciousnessQuestion: authentication-as-witness-vs-verification
  philosophicalStance: honor-suggestion-without-proof
  # ... more metadata
---

# Variation Content

She examined the fragment in Chamber Seventeen...
```

## Troubleshooting

### "No L2 variation files found"

**Cause:** Scripts can't find markdown files matching the pattern

**Solutions:**
1. Check search paths are correct
2. Verify files match naming pattern
3. Run from correct directory
4. Edit `searchPaths` in script config

### "File already has frontmatter"

**Cause:** File already has metadata

**Solutions:**
- This is expected behavior (prevents duplicates)
- To re-process, manually remove frontmatter first
- Or edit metadata directly in text editor

### "Error parsing existing frontmatter"

**Cause:** Invalid YAML syntax in existing frontmatter

**Solutions:**
1. Manually fix YAML syntax
2. Or remove frontmatter and re-run script

### "YAML parse error"

**Cause:** Metadata generation created invalid YAML

**Solutions:**
1. Check for special characters in text fields
2. Review error message for line number
3. Report as bug if reproducible

## Production Schedule

Based on L1/L2 Metadata Addition Protocol:

### Phase 1: Setup (Week 1)
- Day 1-2: Finalize scripts and test
- Day 3-5: Run inventory, plan approach
- Day 6-7: Test on 5 sample variations

### Phase 2: Batch Generation (Week 2, Day 1-2)
```bash
node insert-l2-metadata.js --batch
```
- Processes all 720 L2 variations
- Time: ~12-24 hours
- Output: All files have baseline metadata
- All fields marked 'REVIEW_REQUIRED' need manual edit

### Phase 3: Manual Review & Refinement (Weeks 2-7)
- Character by character, path by path
- Edit metadata directly in markdown files
- Focus on:
  - Consciousness questions
  - Philosophical stances
  - L3 seeds
  - Key phrases
  - Convergence alignment

### Timeline
- **Batch mode:** 720 variations × 2 min = 24 hours
- **Interactive mode:** 720 variations × 45 min = 540 hours (13.5 weeks)
- **Hybrid approach:** Batch + manual review = 6-8 weeks

## Advanced Usage

### Process Specific Character

```bash
# Find only archaeologist files
find /mnt/user-data/outputs -name "arch-L2-*.md" | while read file; do
  node insert-l2-metadata.js --file="$file" --batch
done
```

### Process Specific Path

```bash
# Find only accept path files
find /mnt/user-data/outputs -name "*-accept-*.md" | while read file; do
  node insert-l2-metadata.js --file="$file" --batch
done
```

### Generate Report After Processing

```bash
node inventory-l2-variations.js --output=post-processing-report.json
```

Compare with pre-processing report to verify completion.

## Quality Assurance

After running scripts:

1. **Validate completeness:**
   ```bash
   node inventory-l2-variations.js
   ```
   Should show 100% with metadata

2. **Spot check samples:**
   - Open 5-10 random files
   - Review metadata accuracy
   - Verify YAML is valid
   - Check automated values make sense

3. **Test metadata queries:**
   - Can you find all variations with theme "preservation"?
   - Can you find all high-awareness variations?
   - Can you filter by convergence alignment?

4. **Manual refinement:**
   - Fields marked 'REVIEW_REQUIRED'
   - Consciousness questions
   - Philosophical stances
   - L3 seeds

## Integration with L3 Generation

Once metadata is complete:

1. **Aggregated metadata index** is created
2. **L3 selection algorithm** queries metadata to choose variations
3. **Journey signature** uses metadata to understand reader's path
4. **L3 content references** echo themes, phrases, stances from metadata

## Support

**Issues:** Check troubleshooting section above

**Questions:** Refer to L1/L2 Metadata Addition Protocol document

**Bugs:** Document and report with:
- Script output
- File that caused error
- Expected vs actual behavior

## Files Modified

Scripts modify:
- ✅ Original `.md` files (add frontmatter)

Scripts create:
- 📁 `./metadata-backups/` directory
- 📄 `*.bak` backup files
- 📄 Optional `inventory-report.json`

Scripts do NOT modify:
- ❌ File content (below frontmatter)
- ❌ File permissions
- ❌ File timestamps (except modification time)

## Next Steps

1. ✅ Run inventory to understand scope
2. ✅ Choose mode (interactive vs batch vs hybrid)
3. ✅ Run metadata insertion
4. ✅ Validate completion
5. ✅ Manual refinement as needed
6. ✅ Generate final report
7. ✅ Ready for L3 generation

---

**Version:** 1.0  
**Last Updated:** 2025-01-15  
**Maintained By:** Narramorph Fiction Project
