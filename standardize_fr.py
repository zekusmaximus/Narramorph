#!/usr/bin/env python3
"""
Standardize firstRevisit YAML frontmatter for FR-02 through FR-46
"""

import os
import re
from pathlib import Path

def extract_narrative_content(file_content):
    """Extract content after the closing --- of YAML"""
    parts = file_content.split('---', 2)
    if len(parts) >= 3:
        return parts[2]
    return ""

def extract_old_metadata(file_content):
    """Extract key metadata from old YAML"""
    metadata = {}

    # Extract word_count
    match = re.search(r'word_count:\s*(\d+)', file_content)
    if match:
        metadata['word_count'] = int(match.group(1))

    # Extract awareness range
    match = re.search(r'awareness:\s*(\d+)-(\d+)%', file_content)
    if match:
        low = int(match.group(1))
        high = int(match.group(2))
        metadata['awareness_range'] = f"{low}-{high}"
        metadata['awareness_level'] = (low + high) // 2

    # Extract visit_count
    match = re.search(r'visit_count:\s*(\d+)', file_content)
    if match:
        metadata['visit_number'] = int(match.group(1))
    else:
        metadata['visit_number'] = 2  # default

    # Extract cross_character
    match = re.search(r'cross_character:\s*(true|false)', file_content)
    metadata['cross_character'] = match.group(1) == 'true' if match else False

    # Extract visited_nodes
    match = re.search(r'visited_nodes:\s*\[(.*?)\]', file_content)
    if match and match.group(1).strip():
        nodes = [n.strip() for n in match.group(1).split(',')]
        metadata['cross_character_content'] = nodes
    else:
        metadata['cross_character_content'] = []

    # Extract dominant_path
    match = re.search(r'dominant_path:\s*(\w+)', file_content)
    if match and match.group(1) != 'null':
        metadata['active_path'] = match.group(1)
    else:
        metadata['active_path'] = None

    # Extract themes for focus derivation
    themes_match = re.search(r'themes:(.*?)(?:transformation_focus|reference_exemplar|cross_character_elements|conditional_insertions|reusable_patterns|quality_metrics|production_notes|---)', file_content, re.DOTALL)
    if themes_match:
        themes_text = themes_match.group(1)
        metadata['themes'] = themes_text

    # Extract transformation_focus for primary/secondary focus
    match = re.search(r'transformation_focus:\s*"([^"]+)"', file_content)
    if match:
        metadata['transformation_focus'] = match.group(1)

    return metadata

def determine_awareness_tier(awareness_range):
    """Map awareness range to tier"""
    if awareness_range in ["21-30"]:
        return "emerging_awareness"
    elif awareness_range in ["31-40", "31-50", "41-50"]:
        return "developing_awareness"
    elif awareness_range in ["41-60", "51-60"]:
        return "moderate_awareness"
    return "emerging_awareness"

def determine_cluster(fr_num):
    """Determine cluster based on FR number"""
    if 2 <= fr_num <= 15:
        return "firstRevisit_initial"
    elif 16 <= fr_num <= 30:
        return "firstRevisit_emerging"
    elif 31 <= fr_num <= 46:
        return "firstRevisit_deepening"
    return "firstRevisit_initial"

def infer_primary_focus(metadata):
    """Infer primary focus from themes and transformation_focus"""
    trans_focus = metadata.get('transformation_focus', '').lower()
    themes = metadata.get('themes', '').lower()

    if 'seven-stream' in trans_focus or 'computational' in trans_focus:
        return "Seven-stream computational architecture"
    elif 'future attention' in trans_focus or 'being watched' in trans_focus or 'temporal' in trans_focus:
        return "Future attention and temporal connection"
    elif 'pure' in trans_focus or 'observer effect' in trans_focus:
        return "Observer effect and recursive examination"
    elif 'accept' in trans_focus or 'compassionate' in trans_focus:
        return "Compassionate witnessing and acceptance"
    elif 'resist' in trans_focus or 'verification' in trans_focus:
        return "Verification demands and professional rigor"
    elif 'invest' in trans_focus or 'meaning' in trans_focus:
        return "Meaning-making through repeated observation"

    return "Repeated observation and pattern recognition"

def infer_secondary_focus(metadata):
    """Infer secondary focus"""
    trans_focus = metadata.get('transformation_focus', '').lower()

    if 'cross-character' in trans_focus:
        return "Cross-character pattern bleeding"
    elif 'causality' in trans_focus or 'temporal' in trans_focus:
        return "Temporal causality questions"
    elif 'meta' in trans_focus or 'recursive' in trans_focus:
        return "Meta-awareness emerging"
    elif 'path' in trans_focus:
        return "Path philosophy developing"

    return "Methodological uncertainty"

def infer_transformation_type(metadata):
    """Infer transformation type"""
    trans_focus = metadata.get('transformation_focus', '').lower()

    if metadata.get('cross_character'):
        return "cross_character_bleeding"
    elif metadata.get('active_path'):
        return f"path_{metadata['active_path']}"
    elif metadata.get('visit_number', 2) > 2:
        return "deepening_recursion"

    return "baseline_firstRevisit"

def determine_voice_consistency(awareness_level):
    """Determine voice consistency target based on awareness"""
    if awareness_level <= 30:
        return 0.93
    elif awareness_level <= 40:
        return 0.94
    elif awareness_level <= 50:
        return 0.94
    else:
        return 0.95

def generate_new_yaml(fr_num, metadata):
    """Generate standardized YAML frontmatter"""
    cluster = determine_cluster(fr_num)
    awareness_tier = determine_awareness_tier(metadata['awareness_range'])
    primary_focus = infer_primary_focus(metadata)
    secondary_focus = infer_secondary_focus(metadata)
    transformation_type = infer_transformation_type(metadata)
    voice_target = determine_voice_consistency(metadata['awareness_level'])

    # Determine generation_week (simplified - could be more complex)
    if fr_num <= 15:
        gen_week = (fr_num - 2) // 2 + 1
    elif fr_num <= 30:
        gen_week = (fr_num - 16) // 2 + 2
    else:
        gen_week = (fr_num - 31) // 2 + 4
    gen_week = min(gen_week, 8)

    # Determine position_in_cluster
    if fr_num <= 15:
        position = fr_num - 1
    elif fr_num <= 30:
        position = fr_num - 15
    else:
        position = fr_num - 30

    # Frame transparency
    if metadata['awareness_level'] <= 30:
        frame_trans = "hidden"
    elif metadata['awareness_level'] <= 40:
        frame_trans = "emerging"
    else:
        frame_trans = "emerging"

    # Methodology participation
    if metadata['awareness_level'] <= 30:
        method_part = "unaware"
    elif metadata['awareness_level'] <= 40:
        method_part = "suspected"
    else:
        method_part = "recognized"

    # Format cross_character_content
    cc_content = metadata.get('cross_character_content', [])
    if cc_content:
        cc_str = "[" + ", ".join(f'"{node}"' for node in cc_content) + "]"
    else:
        cc_str = "[]"

    # Format active_path
    path_val = f'"{metadata["active_path"]}"' if metadata.get('active_path') else "null"

    yaml = f'''---
id: "FR-{fr_num:02d}"
variation_type: "firstRevisit"
cluster: "{cluster}"
generation_week: {gen_week}
position_in_cluster: {position}

# Narrative Conditions
visit_number: {metadata['visit_number']}
awareness_level: {metadata['awareness_level']}
awareness_range: "{metadata['awareness_range']}"
awareness_tier: "{awareness_tier}"
visited_variations: []
active_path: {path_val}
cross_character_content: {cc_str}

# Content Architecture
word_count: {metadata['word_count']}
primary_focus: "{primary_focus}"
secondary_focus: "{secondary_focus}"
transformation_type: "{transformation_type}"

# Voice Calibration
archaeological_voice: true
past_tense_maintained: true
direct_address: false
frame_transparency: "{frame_trans}"
methodology_participation: "{method_part}"

# Integration Elements
character_content: {str(bool(cc_content)).lower()}
path_voice: {str(bool(metadata.get('active_path'))).lower()}
pure_revisit: {str(not cc_content and not metadata.get('active_path')).lower()}
constants_ritual: true

# Quality Metrics
voice_consistency_target: {voice_target}
---'''

    return yaml

def process_file(file_path, fr_num):
    """Process a single FR file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract metadata and narrative
    metadata = extract_old_metadata(content)
    narrative = extract_narrative_content(content)

    # Generate new YAML
    new_yaml = generate_new_yaml(fr_num, metadata)

    # Combine and write
    new_content = new_yaml + narrative

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Processed FR-{fr_num:02d}")

def main():
    base_dir = Path(__file__).parent / "docs" / "arch-L1-production" / "firstRevisit"

    for fr_num in range(2, 47):
        file_path = base_dir / f"arch-L1-FR-{fr_num:02d}.md"
        if file_path.exists():
            try:
                process_file(file_path, fr_num)
            except Exception as e:
                print(f"Error processing FR-{fr_num:02d}: {e}")
        else:
            print(f"File not found: FR-{fr_num:02d}")

        # Report progress every 10 files
        if fr_num % 10 == 0:
            print(f"Progress: Completed through FR-{fr_num:02d}")

if __name__ == "__main__":
    main()
