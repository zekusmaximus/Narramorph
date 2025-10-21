#!/usr/bin/bash
# Convert old variation_id format to new id format for arch-L1 production files

echo "========================================="
echo "CONVERTING VARIATION FILES TO NEW FORMAT"
echo "========================================="

FR_DIR="C:/Users/zeke/Desktop/Projects/Narramorph/docs/arch-L1-production/firstRevisit"
MA_DIR="C:/Users/zeke/Desktop/Projects/Narramorph/docs/arch-L1-production/metaAware"

# Get list of old-format FR files
OLD_FR_FILES=$(grep -l "^variation_id:" "$FR_DIR"/*.md | sort)
OLD_FR_COUNT=$(echo "$OLD_FR_FILES" | wc -l)

# Get list of old-format MA files
OLD_MA_FILES=$(grep -l "^variation_id:" "$MA_DIR"/*.md | sort)
OLD_MA_COUNT=$(echo "$OLD_MA_FILES" | wc -l)

echo ""
echo "Found $OLD_FR_COUNT firstRevisit files to convert"
echo "Found $OLD_MA_COUNT metaAware files to convert"
echo ""

# Process each old FR file
for filepath in $OLD_FR_FILES; do
    filename=$(basename "$filepath")
    echo "Processing $filename..."

    # Use Python if available, otherwise skip
    python3 - "$filepath" << 'EOF'
import sys, re

filepath = sys.argv[1]
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Just change variation_id to id
content = re.sub(r'^variation_id:', 'id:', content, flags=re.MULTILINE)

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"  ✓ Converted")
EOF
done

# Process each old MA file
for filepath in $OLD_MA_FILES; do
    filename=$(basename "$filepath")
    echo "Processing $filename..."

    python3 - "$filepath" << 'EOF'
import sys, re

filepath = sys.argv[1]
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Just change variation_id to id
content = re.sub(r'^variation_id:', 'id:', content, flags=re.MULTILINE)

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"  ✓ Converted")
EOF
done

echo ""
echo "========================================="
echo "CONVERSION COMPLETE"
echo "========================================="
echo "FirstRevisit: $OLD_FR_COUNT files converted"
echo "MetaAware: $OLD_MA_COUNT files converted"
echo "Total: $(($OLD_FR_COUNT + $OLD_MA_COUNT)) files converted"
