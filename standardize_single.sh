#!/bin/bash

# Function to process a single FR file
# Usage: process_fr <file_number>
process_fr() {
    local num=$1
    local file="docs/arch-L1-production/firstRevisit/arch-L1-FR-$(printf "%02d" $num).md"

    if [ ! -f "$file" ]; then
        echo "File not found: $file"
        return 1
    fi

    # Extract the narrative content (everything after the second ---)
    local narrative=$(awk 'BEGIN{count=0} /^---$/{count++; if(count==2) {getline; flag=1}} flag' "$file")

    # Extract metadata
    local word_count=$(grep -oP 'word_count:\s*\K\d+' "$file" | head -1)
    local awareness=$(grep -oP 'awareness:\s*\K\d+-\d+' "$file" | head -1)
    local visit_count=$(grep -oP 'visit_count:\s*\K\d+' "$file" | head -1)
    local cross_char=$(grep -oP 'cross_character:\s*\K(true|false)' "$file" | head -1)
    local visited_nodes=$(grep -oP 'visited_nodes:\s*\K\[.*?\]' "$file" | head -1)
    local dominant_path=$(grep -oP 'dominant_path:\s*\K\w+' "$file" | head -1)

    # Set defaults
    [ -z "$visit_count" ] && visit_count=2
    [ -z "$word_count" ] && word_count=1300
    [ -z "$awareness" ] && awareness="21-30"

    # Calculate awareness level (midpoint)
    local aw_low=$(echo $awareness | cut -d'-' -f1)
    local aw_high=$(echo $awareness | cut -d'-' -f2)
    local aw_level=$(( ($aw_low + $aw_high) / 2 ))

    # Determine awareness tier
    local aw_tier="emerging_awareness"
    if [[ $aw_high -ge 41 ]]; then
        aw_tier="moderate_awareness"
    elif [[ $aw_high -ge 31 ]]; then
        aw_tier="developing_awareness"
    fi

    # Determine cluster
    local cluster="firstRevisit_initial"
    if [[ $num -ge 31 ]]; then
        cluster="firstRevisit_deepening"
    elif [[ $num -ge 16 ]]; then
        cluster="firstRevisit_emerging"
    fi

    # Determine position_in_cluster
    local position=$num
    if [[ $num -ge 31 ]]; then
        position=$(( $num - 30 ))
    elif [[ $num -ge 16 ]]; then
        position=$(( $num - 15 ))
    else
        position=$(( $num - 1 ))
    fi

    # Determine generation_week
    local gen_week=1
    if [[ $num -ge 31 ]]; then
        gen_week=$(( ($num - 31) / 2 + 4 ))
    elif [[ $num -ge 16 ]]; then
        gen_week=$(( ($num - 16) / 2 + 2 ))
    else
        gen_week=$(( ($num - 2) / 2 + 1 ))
    fi
    [[ $gen_week -gt 8 ]] && gen_week=8

    # Determine cross_character_content
    local cc_content="[]"
    if [[ "$visited_nodes" != "[]" && "$visited_nodes" != "" ]]; then
        # Extract node names and format
        cc_content="$visited_nodes"
        # Fix formatting for YAML
        cc_content=$(echo "$cc_content" | sed 's/\[/["/g' | sed 's/\]/"]/'g | sed 's/, /", "/g')
    fi

    # Determine character_content boolean
    local char_content="false"
    [[ "$cross_char" == "true" ]] && char_content="true"

    # Determine path_voice and active_path
    local path_voice="false"
    local active_path="null"
    if [[ "$dominant_path" != "null" && "$dominant_path" != "" ]]; then
        path_voice="true"
        active_path="\"$dominant_path\""
    fi

    # Determine pure_revisit
    local pure_revisit="true"
    [[ "$char_content" == "true" || "$path_voice" == "true" ]] && pure_revisit="false"

    # Determine voice_consistency_target
    local voice_target="0.93"
    [[ $aw_level -ge 41 ]] && voice_target="0.95"
    [[ $aw_level -ge 31 && $aw_level -lt 41 ]] && voice_target="0.94"

    # Determine frame_transparency
    local frame_trans="hidden"
    [[ $aw_level -ge 31 ]] && frame_trans="emerging"

    # Determine methodology_participation
    local method_part="unaware"
    [[ $aw_level -ge 41 ]] && method_part="recognized"
    [[ $aw_level -ge 31 && $aw_level -lt 41 ]] && method_part="suspected"

    # Infer primary_focus
    local primary_focus="Repeated observation and pattern recognition"
    if grep -q "seven-stream\|Seven-stream\|computational" "$file"; then
        primary_focus="Seven-stream computational architecture"
    elif grep -q "future attention\|Future attention\|being watched" "$file"; then
        primary_focus="Future attention and temporal connection"
    elif grep -q "observer effect\|Observer effect\|recursive" "$file"; then
        primary_focus="Observer effect and recursive examination"
    elif grep -q "accept\|Accept\|compassionate" "$file"; then
        primary_focus="Compassionate witnessing and acceptance"
    elif grep -q "resist\|Resist\|verification" "$file"; then
        primary_focus="Verification demands and professional rigor"
    fi

    # Infer secondary_focus
    local secondary_focus="Methodological uncertainty"
    if grep -q "cross-character" "$file"; then
        secondary_focus="Cross-character pattern bleeding"
    elif grep -q "causality\|temporal paradox" "$file"; then
        secondary_focus="Temporal causality questions"
    elif grep -q "meta-awareness\|recursive observation" "$file"; then
        secondary_focus="Meta-awareness emerging"
    elif grep -q "path\|philosophy" "$file"; then
        secondary_focus="Path philosophy developing"
    fi

    # Determine transformation_type
    local trans_type="baseline_firstRevisit"
    if [[ "$char_content" == "true" ]]; then
        trans_type="cross_character_bleeding"
    elif [[ "$path_voice" == "true" ]]; then
        trans_type="path_$dominant_path"
    elif [[ $visit_count -gt 2 ]]; then
        trans_type="deepening_recursion"
    fi

    # Create new YAML
    cat > "$file" <<EOF
---
id: "FR-$(printf "%02d" $num)"
variation_type: "firstRevisit"
cluster: "$cluster"
generation_week: $gen_week
position_in_cluster: $position

# Narrative Conditions
visit_number: $visit_count
awareness_level: $aw_level
awareness_range: "$awareness"
awareness_tier: "$aw_tier"
visited_variations: []
active_path: $active_path
cross_character_content: $cc_content

# Content Architecture
word_count: $word_count
primary_focus: "$primary_focus"
secondary_focus: "$secondary_focus"
transformation_type: "$trans_type"

# Voice Calibration
archaeological_voice: true
past_tense_maintained: true
direct_address: false
frame_transparency: "$frame_trans"
methodology_participation: "$method_part"

# Integration Elements
character_content: $char_content
path_voice: $path_voice
pure_revisit: $pure_revisit
constants_ritual: true

# Quality Metrics
voice_consistency_target: $voice_target
---
$narrative
EOF

    echo "Processed FR-$(printf "%02d" $num)"
}

# Process all files from FR-02 to FR-46
for i in {2..46}; do
    process_fr $i

    # Report progress every 10 files
    if [[ $(($i % 10)) -eq 0 ]]; then
        echo "Progress: Completed through FR-$(printf "%02d" $i)"
    fi
done

echo "All files processed!"
