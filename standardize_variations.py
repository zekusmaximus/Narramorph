#!/usr/bin/env python3
"""
Standardize variation file metadata for Narramorph project.
Processes firstRevisit and metaAware variation files.
"""

import os
import re
from pathlib import Path

# Base directory
BASE_DIR = Path(r"C:\Users\zeke\Desktop\Projects\Narramorph\docs\arch-L1-production")

def count_narrative_words(content):
    """Count words in narrative content (excluding YAML frontmatter)."""
    # Remove YAML frontmatter if present
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            narrative = parts[2]
        else:
            narrative = content
    else:
        narrative = content

    # Count words
    words = narrative.split()
    return len(words)

def extract_awareness_from_content(content):
    """Try to extract awareness level from existing metadata or infer from content."""
    # Try to find in existing YAML
    match = re.search(r'awareness_level:\s*(\d+)', content)
    if match:
        return int(match.group(1))

    match = re.search(r'awareness_range:\s*["\']?(\d+)-(\d+)["\']?', content)
    if match:
        low, high = int(match.group(1)), int(match.group(2))
        return (low + high) // 2

    return None

def determine_cluster(file_num, variation_type):
    """Determine cluster based on file number."""
    if variation_type == "firstRevisit":
        if file_num <= 15:
            return "firstRevisit_initial"
        elif file_num <= 30:
            return "firstRevisit_emerging"
        else:
            return "firstRevisit_deepening"
    else:  # metaAware
        if file_num <= 8:
            return "metaAware_initial"
        elif file_num <= 16:
            return "metaAware_developing"
        else:
            return "metaAware_advanced"

def determine_awareness_tier(awareness_level, variation_type):
    """Determine awareness tier based on level."""
    if variation_type == "firstRevisit":
        if awareness_level < 31:
            return "emerging_awareness"
        elif awareness_level < 41:
            return "developing_awareness"
        else:
            return "moderate_awareness"
    else:  # metaAware
        if awareness_level < 71:
            return "low_metaAware"
        elif awareness_level < 86:
            return "medium_metaAware"
        else:
            return "high_metaAware"

def determine_awareness_range(awareness_level):
    """Determine awareness range string."""
    ranges = [
        (21, 30), (31, 40), (41, 50), (51, 60),
        (61, 70), (71, 80), (81, 90), (91, 100)
    ]
    for low, high in ranges:
        if low <= awareness_level <= high:
            return f'"{low}-{high}"'
    return '"21-30"'  # default

def generate_firstRevisit_yaml(file_num, word_count, awareness_level):
    """Generate YAML frontmatter for firstRevisit variation."""
    cluster = determine_cluster(file_num, "firstRevisit")
    awareness_tier = determine_awareness_tier(awareness_level, "firstRevisit")
    awareness_range = determine_awareness_range(awareness_level)
    generation_week = min(8, (file_num - 1) // 6 + 1)
    position_in_cluster = ((file_num - 1) % 15) + 1

    # Determine frame transparency based on awareness
    if awareness_level < 35:
        frame_transparency = '"hidden"'
    else:
        frame_transparency = '"emerging"'

    # Determine methodology participation
    if awareness_level < 30:
        methodology_participation = '"unaware"'
    elif awareness_level < 45:
        methodology_participation = '"suspected"'
    else:
        methodology_participation = '"recognized"'

    voice_consistency = 0.92 + (awareness_level / 1000)  # 0.92-0.95 range

    yaml = f'''---
id: "FR-{file_num:02d}"
variation_type: "firstRevisit"
cluster: "{cluster}"
generation_week: {generation_week}
position_in_cluster: {position_in_cluster}

# Narrative Conditions
visit_number: 2
awareness_level: {awareness_level}
awareness_range: {awareness_range}
awareness_tier: "{awareness_tier}"
visited_variations: []
active_path: null
cross_character_content: []

# Content Architecture
word_count: {word_count}
primary_focus: "perception_transformation"
secondary_focus: "technical_continuity"
transformation_type: "threshold_crossing"

# Voice Calibration
archaeological_voice: true
past_tense_maintained: true
direct_address: false
frame_transparency: {frame_transparency}
methodology_participation: {methodology_participation}

# Integration Elements
character_content: false
path_voice: false
pure_revisit: true
constants_ritual: true

# Quality Metrics
voice_consistency_target: {voice_consistency:.2f}
---
'''
    return yaml

def generate_metaAware_yaml(file_num, word_count, awareness_level):
    """Generate YAML frontmatter for metaAware variation."""
    cluster = determine_cluster(file_num, "metaAware")
    awareness_tier = determine_awareness_tier(awareness_level, "metaAware")
    awareness_range = determine_awareness_range(awareness_level)
    generation_week = 8 + min(4, (file_num - 1) // 6)
    position_in_cluster = ((file_num - 1) % 8) + 1

    # MetaAware specific fields
    if awareness_level < 71:
        metaAware_level = '"low"'
        frame_consciousness = '"explicit_but_subtle"'
        reader_address_type = '"implied"'
        reader_presence = '"implicit"'
        frame_transparency = '"emerging"'
    elif awareness_level < 86:
        metaAware_level = '"medium"'
        frame_consciousness = '"acknowledged"'
        reader_address_type = '"acknowledged"'
        reader_presence = '"explicit"'
        frame_transparency = '"acknowledged"'
    else:
        metaAware_level = '"high"'
        frame_consciousness = '"transparent"'
        reader_address_type = '"direct"'
        reader_presence = '"direct"'
        frame_transparency = '"transparent"'

    temporal_positions = 3 if awareness_level < 80 else 4
    temporal_architecture = '"past_present_future_implied"' if awareness_level < 85 else '"multi_temporal_explicit"'
    methodology_participation = '"recognized"' if awareness_level < 80 else '"collaborative"'

    voice_consistency = 0.94 + (awareness_level / 2000)  # 0.94-0.97 range

    yaml = f'''---
id: "MA-{file_num:02d}"
variation_type: "metaAware"
cluster: "{cluster}"
generation_week: {generation_week}
position_in_cluster: {position_in_cluster}

# Narrative Conditions
visit_number: 3
awareness_level: {awareness_level}
awareness_range: {awareness_range}
awareness_tier: "{awareness_tier}"
visited_variations: []
active_path: null
cross_character_content: []

# MetaAware Specifications
metaAware_level: {metaAware_level}
frame_consciousness: {frame_consciousness}
reader_address_type: {reader_address_type}
reader_presence: {reader_presence}
temporal_positions: {temporal_positions}
temporal_architecture: {temporal_architecture}

# Content Architecture
word_count: {word_count}
primary_focus: "frame_awareness_emerging"
secondary_focus: "pure_revisit_metaAware"
transformation_type: "meta_recognition"

# Voice Calibration
archaeological_voice: true
past_tense_maintained: true
direct_address: {str(awareness_level >= 85).lower()}
frame_transparency: {frame_transparency}
methodology_participation: {methodology_participation}

# Integration Elements
character_content: false
path_voice: false
pure_revisit: true
constants_ritual: true

# Quality Metrics
voice_consistency_target: {voice_consistency:.2f}
---
'''
    return yaml

def extract_narrative(content):
    """Extract narrative content, removing old YAML frontmatter."""
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            return parts[2].lstrip('\n')
    return content

def process_file(filepath, variation_type):
    """Process a single variation file."""
    print(f"Processing {filepath.name}...")

    # Read current content
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract file number
    match = re.search(r'-(FR|MA)-(\d+)\.md', filepath.name)
    if not match:
        print(f"  ⚠ Could not parse file number from {filepath.name}")
        return False

    file_num = int(match.group(2))

    # Extract narrative
    narrative = extract_narrative(content)

    # Count words
    word_count = count_narrative_words(narrative)

    # Determine awareness level
    awareness_level = extract_awareness_from_content(content)
    if awareness_level is None:
        # Use defaults based on variation type and file position
        if variation_type == "firstRevisit":
            awareness_level = 25 + (file_num // 2)  # Gradually increase
            awareness_level = min(60, awareness_level)  # Cap at 60
        else:  # metaAware
            awareness_level = 65 + file_num  # Gradually increase
            awareness_level = min(98, awareness_level)  # Cap at 98

    # Generate appropriate YAML
    if variation_type == "firstRevisit":
        yaml = generate_firstRevisit_yaml(file_num, word_count, awareness_level)
    else:
        yaml = generate_metaAware_yaml(file_num, word_count, awareness_level)

    # Write standardized file
    standardized_content = yaml + '\n' + narrative

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(standardized_content)

    print(f"  ✓ {filepath.name} standardized")
    print(f"    - id: {match.group(1)}-{file_num:02d}")
    print(f"    - word_count: {word_count}")
    print(f"    - awareness_level: {awareness_level}")

    return True

def main():
    """Main processing function."""
    print("=" * 60)
    print("VARIATION METADATA STANDARDIZATION")
    print("=" * 60)

    # Process firstRevisit files
    fr_dir = BASE_DIR / "firstRevisit"
    fr_files = sorted(fr_dir.glob("arch-L1-FR-*.md"))

    print(f"\nProcessing {len(fr_files)} firstRevisit files...")
    fr_success = 0
    for filepath in fr_files:
        if process_file(filepath, "firstRevisit"):
            fr_success += 1

    print(f"\n✓✓ firstRevisit complete ({fr_success}/{len(fr_files)} files standardized)")

    # Process metaAware files
    ma_dir = BASE_DIR / "metaAware"
    ma_files = sorted(ma_dir.glob("arch-L1-MA-*.md"))

    print(f"\nProcessing {len(ma_files)} metaAware files...")
    ma_success = 0
    for filepath in ma_files:
        if process_file(filepath, "metaAware"):
            ma_success += 1

    print(f"\n✓✓ metaAware complete ({ma_success}/{len(ma_files)} files standardized)")

    # Final summary
    print("\n" + "=" * 60)
    print("VARIATION STANDARDIZATION COMPLETE")
    print("=" * 60)
    print(f"FirstRevisit: {fr_success} files processed")
    print(f"MetaAware: {ma_success} files processed")
    print(f"Total: {fr_success + ma_success} files standardized")
    print("All variations now have consistent metadata structure.")

if __name__ == "__main__":
    main()
