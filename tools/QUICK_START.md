# Quick Start: L2 Metadata Insertion

## Get Started in 5 Minutes

### 1. Download Files

Download these 4 files to your computer:

- [inventory-l2-variations.js](computer:///mnt/user-data/outputs/inventory-l2-variations.js)
- [insert-l2-metadata.js](computer:///mnt/user-data/outputs/insert-l2-metadata.js)
- [package.json](computer:///mnt/user-data/outputs/package.json)
- [README_METADATA_TOOLS.md](computer:///mnt/user-data/outputs/README_METADATA_TOOLS.md)

Put them all in the same folder (e.g., `C:\Users\YourName\narramorph-metadata-tools\`)

### 2. Install Dependencies

Open terminal/command prompt in that folder and run:

```bash
npm install
```

This installs the `js-yaml` package needed for YAML processing.

### 3. Run Inventory

See what files exist and their status:

```bash
npm run inventory
```

Or use Node directly:

```bash
node inventory-l2-variations.js
```

This shows:

- How many L2 files found
- Which have metadata vs. need metadata
- Breakdown by character, path, state
- Sample automated analysis

### 4. Add Metadata

Choose your approach:

#### Quick & Automated (Batch Mode)

```bash
npm run insert:batch
```

- Processes all files automatically
- Fast (~2 min per file)
- Marks fields needing review as 'REVIEW_REQUIRED'
- You edit metadata later in text editor

#### High Quality (Interactive Mode)

```bash
npm run insert
```

- Prompts you for each metadata field
- Shows automated suggestions
- You refine and correct
- Takes longer (~45 min per file) but best quality

#### Test First (Dry Run)

```bash
npm run insert:dry-run
```

- Shows what would be added
- Doesn't modify files
- Safe to run

### 5. Verify Completion

After adding metadata, run inventory again:

```bash
npm run inventory
```

Should show 100% with metadata.

## Where Are My L2 Files?

The scripts search these locations automatically:

- `/mnt/user-data/outputs`
- `/mnt/user-data/content/layer-2`
- `./content/layer-2`
- `./outputs`

**Can't find your files?**

Edit the `searchPaths` array at the top of both scripts to point to your actual L2 variation directory.

## What Files Match?

Files must be named like:

- `arch-L2-accept-FR-01.md`
- `algo-L2-resist-MA-15.md`
- `hum-L2-investigate-FR-23.md`

Pattern: `(arch|algo|hum)-L2-(accept|resist|investigate)-(FR|MA)-(number).md`

## Safety Features

✅ **Automatic backups:** Original files backed up before modification

✅ **Skip existing:** Won't add duplicate metadata to files that already have it

✅ **Dry run mode:** Test without modifying files

✅ **YAML validation:** Ensures metadata structure is valid

## Common Commands

```bash
# See what files exist
npm run inventory

# Save detailed report
npm run inventory:report

# Add metadata to all files (automated)
npm run insert:batch

# Add metadata interactively (high quality)
npm run insert

# Test without modifying files
npm run insert:dry-run

# Process single file
node insert-l2-metadata.js --file=path/to/file.md
```

## Recommended Workflow

### For 720 Variations (6-8 week timeline)

**Week 1:**

1. Run inventory to understand scope
2. Test on 5 sample files (interactive mode)
3. Verify quality of results

**Week 2:** 4. Run batch mode on all 720 files 5. Generates baseline metadata (~24 hours)

**Weeks 3-8:** 6. Manual review and refinement 7. Edit metadata directly in markdown files 8. Focus on fields marked 'REVIEW_REQUIRED' 9. Character by character, path by path

## What Metadata Is Added?

Complete metadata including:

- **Basic info:** ID, character, path, word count
- **Themes:** Primary and secondary thematic content
- **Philosophy:** Consciousness questions, stances
- **Narrative:** World-building, tone, pacing
- **L3 seeds:** Preserve/release/transform seeds
- **Key phrases:** Memorable quotes
- **Character development:** Stance evolution

## Troubleshooting

**"No files found"**

- Check search paths in script config
- Verify files match naming pattern
- Run from correct directory

**"Already has frontmatter"**

- File already has metadata (this is good!)
- Script skips to avoid duplicates

**"YAML parse error"**

- Check for special characters in metadata
- Review error message
- Edit YAML manually if needed

## Need Help?

Read the full README: [README_METADATA_TOOLS.md](computer:///mnt/user-data/outputs/README_METADATA_TOOLS.md)

## Next Steps After Metadata Complete

1. ✅ Run final inventory (verify 100% completion)
2. ✅ Manual quality review (spot check 30 random files)
3. ✅ Aggregated metadata index generation
4. ✅ Ready for L3 generation system

---

**You're ready to go!** Start with `npm run inventory` to see your current state.
