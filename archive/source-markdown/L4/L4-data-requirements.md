# L4 Data Requirements for Ending Personalization

## Overview

This document catalogs all data points required for personalizing the three L4 endings (PRESERVE, RELEASE, TRANSFORM). Each ending uses reader journey data to create a unique experience that feels genuinely tailored to their exploration pattern.

**Key Principle**: All data must be translated into narrative-appropriate language using substrate-specific terminology. Never expose technical metadata directly.

---

## Core Journey Tracking Data (UserProgress)

### Basic Navigation Metrics

**1. First node visited**

- Source: `progress.readingPath[0]`
- Values: `arch-L1`, `algo-L1`, `hum-L1`
- Narrative use: Character entry point

**2. Journey start date/timestamp**

- Source: `progress.visitedNodes[firstNode].visitTimestamps[0]`
- Format: ISO-8601
- Narrative use: Relative chronology only ("months ago", "recently")

**3. Total nodes visited**

- Source: `Object.keys(progress.visitedNodes).length`
- Type: Number
- Narrative use: Qualitative scope ("extensive", "focused", "limited")

**4. Reading path array**

- Source: `progress.readingPath`
- Type: `string[]` of node IDs
- Narrative use: Journey reconstruction, pattern detection

**5. Journey completion date**

- Source: Timestamp when L4 accessed
- Format: ISO-8601
- Narrative use: Journey duration calculation (relative only)

### Visit Records (per node)

**6. Visit count per node**

- Source: `progress.visitedNodes[nodeId].visitCount`
- Type: Number per node
- Narrative use: Identify recursive examination patterns

**7. Visit timestamps per node**

- Source: `progress.visitedNodes[nodeId].visitTimestamps`
- Type: `string[]`
- Narrative use: Temporal sequencing of returns

**8. Most visited node ID**

- Source: Derived from visit counts
- Type: Node ID
- Narrative use: "You returned most frequently to [narrative description]"

**9. Most visited node count**

- Source: Max visit count
- Type: Number
- Narrative use: Intensity of focus ("repeatedly", "obsessively")

**10. Transformation state reached per node**

- Source: `progress.visitedNodes[nodeId].currentState`
- Values: `initial`, `firstRevisit`, `metaAware`
- Narrative use: Transformation depth achieved

### Temporal Awareness System

**11. Final temporal awareness level**

- Source: `progress.temporalAwarenessLevel`
- Type: Number (0-100)
- Narrative use: Qualitative translation (low/medium/high/complete)

**12. Character nodes visited breakdown**

- Source: `progress.characterNodesVisited`
- Fields:
  - `archaeologist`: Number
  - `algorithm`: Number
  - `lastHuman`: Number
- Narrative use: Perspective distribution analysis

**13. Character balance percentages**

- Source: Derived from item 12
- Type: Three percentages summing to 100%
- Narrative use: Dominant perspective identification

**14. Most-visited character**

- Source: Derived from item 12 (highest count)
- Values: `archaeologist`, `algorithm`, `lastHuman`
- Narrative use: Primary substrate identification

### Cross-Character Exploration

**15. Perspectives visited count**

- Source: Derived from item 12 (count non-zero)
- Values: 1, 2, or 3
- Narrative use: Plurality vs. singularity of observation

**16. Character switch frequency**

- Source: Derived from `readingPath` (count character changes)
- Type: Number
- Narrative use: Stability vs. fluidity of perspective

**17. Character loyalty index**

- Source: Calculated: `maxCharacterVisits / totalVisits`
- Type: Percentage (0-100)
- Narrative use: Focused vs. distributed observation

**18. Boundary dissolution metric**

- Source: Inverse of character loyalty
- Type: Percentage
- Narrative use: TRANSFORM-specific metric for perspective fluidity

---

## Journey Pattern Classification

### Exploration Style

**19. Journey pattern type**

- Source: Algorithmic classification from navigation data
- Values:
  - `Started-Stayed`: Remained with starting character (loyalty > 70%)
  - `Started-Bounced`: Started one, switched quickly (< 3 visits before switch)
  - `Shifted-Dominant`: Explored multiple, focused on one (visited all, one dominant)
  - `Began-Lightly`: Dabbled before committing (< 2 visits initial, then focused)
  - `Met-Later`: Joined non-starting character path later (returned to L1 after L2)
- Narrative use: Describe exploration methodology, never use category names

**20. Exploration classification**

- Source: Derived from breadth vs. depth
- Values:
  - `Linear`: Focused single path (visited < 50% of available nodes)
  - `Cross-pollinating`: Regular character switching (3+ character switches)
  - `Completionist`: Visited everything available (> 80% nodes visited)
- Narrative use: Observational methodology description

**21. Revisit rate**

- Source: `nodesRevisited / totalNodesVisited`
- Type: Percentage
- Narrative use: Recursive vs. linear observation

**22. Identity instability index**

- Source: High revisit rate + state transformations
- Type: Boolean or percentage
- Narrative use: TRANSFORM-specific metric for uncertainty

### Philosophical Emphasis

**23. L2 path distribution**

- Source: Count nodes matching each path pattern
- Fields:
  - `acceptCount`: Nodes with `-accept` in ID
  - `resistCount`: Nodes with `-resist` in ID
  - `investigateCount`: Nodes with `-investigate` in ID
- Narrative use: Philosophical stance identification

**24. Dominant philosophical path**

- Source: Highest count from item 23
- Values: `accept`, `resist`, `investigate`
- Narrative use: Primary philosophical orientation

**25. Philosophical mixing index**

- Source: Distribution across three paths
- Type: Boolean (pure vs. mixed)
- Narrative use: Philosophical consistency vs. evolution

**26. Path philosophy percentages**

- Source: Derived from item 23
- Type: Three percentages
- Narrative use: Philosophical emphasis description

**27. Early vs. late philosophical shifts**

- Source: Temporal analysis of path changes
- Type: Qualitative (early/mid/late/consistent)
- Narrative use: TRANSFORM transformation susceptibility metric

---

## L3 Convergence Data

### L3 Experience

**28. L3 convergence choice made**

- Source: `progress.convergenceChoices[0].choiceId`
- Values: `preserve`, `release`, `transform`
- Narrative use: THE central dramatic choice—explicit reference

**29. L3 choice timestamp**

- Source: `progress.convergenceChoices[0].timestamp`
- Format: ISO-8601
- Narrative use: Backend only (determines which L4 ending to show)

**30. Journey pattern selected for L3 assembly**

- Source: L3 assembly algorithm output
- Values: `SS`, `SB`, `SD`, `BL`, `ML`
- Narrative use: Backend only (which variation was shown)

**31. Path philosophy selected for L3**

- Source: L3 assembly algorithm output
- Values: `accept`, `resist`, `investigate`
- Narrative use: Backend only (which variation was shown)

**32. Awareness level selected for L3**

- Source: L3 assembly algorithm output
- Values: `medium`, `high`, `maximum`
- Narrative use: Backend only (which variation was shown)

**33. Specific L3 variation IDs assembled**

- Source: L3 assembly algorithm output
- Fields:
  - `archL3VariationId`: String
  - `algoL3VariationId`: String
  - `humL3VariationId`: String
  - `convL3VariationId`: String
- Narrative use: Backend only (tracking which content was shown)

---

## Node-Specific Historical Data

### L1 Initial Visit Data

**34. First L1 node visited**

- Source: First `arch-L1`, `algo-L1`, or `hum-L1` in `readingPath`
- Values: Node ID
- Narrative use: Origin point of observation

**35. First L1 visit timestamp**

- Source: `progress.visitedNodes[firstL1Node].visitTimestamps[0]`
- Format: ISO-8601
- Narrative use: Journey chronology

**36. All L1 nodes eventually visited**

- Source: Boolean check for each L1 node
- Type: Object of booleans
- Narrative use: Completeness of perspective coverage

**37. Order of L1 node discovery**

- Source: Sequence from `readingPath`
- Type: Ordered array of L1 node IDs
- Narrative use: Perspective discovery narrative

### L2 Exploration Pattern

**38. L2 nodes visited list**

- Source: Filter `readingPath` for L2 nodes
- Type: `string[]`
- Narrative use: Philosophical path traversal

**39. L2 path taken from each L1**

- Source: Derived from navigation after each L1
- Type: Mapping of L1 → L2 paths chosen
- Narrative use: Branching decision reconstruction

**40. L2 nodes reaching MetaAware state**

- Source: Count nodes with `currentState: 'metaAware'`
- Type: Number
- Narrative use: Depth of transformation achieved

**41. First MetaAware state achieved**

- Source: First node chronologically reaching MetaAware
- Type: Node ID + timestamp
- Narrative use: "Frame-consciousness first emerged when..."

### Transformation Milestones

**42. First FirstRevisit transformation**

- Source: First node chronologically reaching FirstRevisit
- Type: Node ID + timestamp
- Narrative use: "Meaning first transformed when you returned to..."

**43. First MetaAware transformation**

- Source: First node chronologically reaching MetaAware
- Type: Node ID + timestamp
- Narrative use: Initial breakthrough moment

**44. Total transformations witnessed**

- Source: Count all non-initial states seen
- Type: Number
- Narrative use: Transformation depth qualitative ("limited", "extensive")

**45. Transformation depth**

- Source: Count MetaAware states specifically
- Type: Number
- Narrative use: Highest consciousness level achieved

**46. Special transformations unlocked**

- Source: `progress.specialTransformations`
- Type: Array of transformation objects
- Narrative use: Unique breakthrough moments (if any special mechanics)

---

## Specialized TRANSFORM Metrics

### Liminal Behavior

**47. Perspective-switching velocity**

- Source: Character changes per session
- Type: Number or rate
- Narrative use: "Restless observation" vs. "patient methodology"

**48. Uncertainty indicators**

- Source: Derived patterns
- Fields:
  - Low revisit threshold visits (visited once, never returned)
  - Back-and-forth patterns (A→B→A navigation)
  - High revisit with state changes (seeking different meanings)
- Narrative use: Identity instability, transformation susceptibility

---

## Specialized RELEASE Metrics

### Skepticism Indicators

**49. Resist-path preference**

- Source: Resist-dominant from item 24
- Type: Boolean
- Narrative use: "Verification demanded repeatedly"

**50. Return-to-doubt patterns**

- Source: Revisiting early nodes after progressing
- Type: Boolean or count
- Narrative use: "Authentication authenticating authentication"

---

## Specialized PRESERVE Metrics

### Devotion Indicators

**51. Accept-path preference**

- Source: Accept-dominant from item 24
- Type: Boolean
- Narrative use: "Acceptance sustained across temporal positions"

**52. Archival thoroughness**

- Source: Completionist classification from item 20
- Type: Boolean
- Narrative use: "Comprehensive witness prioritized"

**53. Pattern-seeking behavior**

- Source: Systematic exploration (linear progression through layers)
- Type: Boolean or pattern description
- Narrative use: "Methodical observation sustained"

---

## Metadata from Variations Themselves

### Content References

**54. Which specific L2 nodes were visited**

- Source: Filter for L2 nodes in `readingPath`
- Type: Array of node IDs
- Narrative use: "Remember when [narrative description of node content]"

**55. Which philosophical stances reader encountered**

- Source: Derived from visited nodes
- Type: Set of philosophical positions
- Narrative use: Philosophical journey reconstruction

**56. Which cross-character references reader earned**

- Source: MetaAware states with cross-character content
- Type: Array of reference descriptions
- Narrative use: "You witnessed [temporal bleeding moments]"

**57. Which themes reader engaged with most**

- Source: Aggregate from variation metadata of visited nodes
- Type: Theme frequency map
- Narrative use: Thematic emphasis identification

**58. Key phrases reader encountered**

- Source: Memorable quotes from visited variations
- Type: Array of strings
- Narrative use: Echo key language from their specific journey

---

## Assembled Novel Construction Data

### PDF Export Assembly

**59. Complete L1 variation shown**

- Source: Which transformation state was displayed
- Type: Variation ID
- Narrative use: Backend only (assembly)

**60. All L2 variations shown**

- Source: Complete list with transformation states
- Type: Array of variation IDs
- Narrative use: Backend only (assembly)

**61. L3 assembled sections**

- Source: All four pieces that were assembled
- Type: Four variation IDs
- Narrative use: Backend only (assembly)

**62. L4 ending selected**

- Source: Which L4 variation rendered
- Values: `preserve`, `release`, `transform`
- Narrative use: Backend only (assembly)

**63. Total assembled word count**

- Source: Sum of all sections
- Type: Number
- Narrative use: "Complete novel" claims (~20,000-27,000 words)

---

## Voice Consistency Reference

### Character Substrate Language

**64. Archaeological terms encountered**

- Source: Track from visited arch nodes
- Examples: Fragment numbers, authentication protocols, verification methodology
- Narrative use: Echo reader's specific archaeological vocabulary

**65. Computational terms encountered**

- Source: Track from visited algo nodes
- Examples: Processing streams, substrate references, iteration cycles
- Narrative use: Echo reader's specific computational vocabulary

**66. Embodied terms encountered**

- Source: Track from visited hum nodes
- Examples: Physical sensation language, present-tense moments, embodiment
- Narrative use: Echo reader's specific embodied vocabulary

---

## L4-Specific Assembly Triggers

### Conditional Content Selection

**67. Character emphasis interpretation**

- Source: Derived from items 12-14
- Type: Interpretive text about what their focus reveals
- Narrative use: "Your [character] emphasis reveals [philosophical interpretation]"

**68. Temporal awareness interpretation**

- Source: Derived from item 11
- Type: Qualitative description of consciousness level achieved
- Narrative use: "High temporal awareness enabled you to witness [specific content]"

**69. Journey uniqueness factors**

- Source: Combination of rare patterns
- Type: Array of distinguishing characteristics
- Narrative use: "Your specific configuration [description of uniqueness]"

**70. Export motivation framing**

- Source: Ending-specific motivation based on choice
- Type: Text snippet
- Narrative use: Why THIS reader should preserve THEIR specific journey

---

## Narrative Integration Guidelines

### Tier 1: Core Narrative Data (Use Freely)

**Items**: 1, 28, 34, 12-14, 23-27, 42-45, 55-58

**Integration approach**: Direct address, second person, analytical voice maintained from L3

**Example**:

> "You began with the Archaeologist in 2047. Resistance dominated your philosophical stance—verification demanded repeatedly, skepticism sustained. Frame-consciousness emerged when you returned to authentication protocols, meaning transforming through recursive observation."

### Tier 2: Translated Behavioral Data (Use with Interpretation)

**Items**: 6, 8-9, 21-22, 15-18, 19-20, 11

**Integration approach**: Never show raw numbers; always translate into narrative-appropriate language using substrate-specific terminology

**Bad example**:

> "You visited arch-L2-resist 4 times, achieving MetaAware state on visit 3. Your temporal awareness reached 67%."

**Good example**:

> "You returned repeatedly to authentication verification—recursive examination sustained until methodology itself became visible. High temporal awareness operational, though boundaries between perspectives persisted."

### Tier 3: Backend Assembly Only (Never Directly Reference)

**Items**: 33, 38, 54, 59-62, 2, 5, 7, 29, 35, 42-43, 30-32, 67-70

**Integration approach**: Use to SELECT content variations and conditional insertions, but never mention in text

---

## Translation Guidelines: Raw Data → Narrative

### Character Entry Point

**Data**: `firstNodeVisited: "arch-L1"`

**Don't say**: "You started with node arch-L1"

**Do say**: "You began with the Archaeologist in 2047" / "Archaeological methodology: your entry point into recursion"

### Temporal Awareness Level

**Data**: `temporalAwarenessLevel: 67`

**Don't say**: "Your temporal awareness reached 67%"

**Do say**: "High temporal awareness operational—you witnessed bleeding across temporal positions" / "Consciousness recognized simultaneously: 2047, 2151, 2383. Boundaries persisted but thinned."

### Visit Counts

**Data**: `visitCount: 7`

**Don't say**: "You visited this node 7 times"

**Do say**: "You returned repeatedly—authentication recurring, meaning accumulating" / "This fragment demanded recursive examination"

### Journey Pattern

**Data**: `journeyPattern: "Started-Bounced"`

**Don't say**: "Your journey pattern was Started-Bounced"

**Do say**: "You began with archaeological methodology but shifted quickly—perspective-instability operational early" / "Singular focus: insufficient. You moved between consciousnesses rapidly."

### Philosophical Emphasis

**Data**: `dominantPath: "resist", percentage: 65%`

**Don't say**: "You chose resist 65% of the time"

**Do say**: "Resistance dominated your observation—verification demanded repeatedly, skepticism sustained across temporal positions"

### Cross-Character Exploration

**Data**: `characterSwitches: 15, boundaryDissolution: 0.72`

**Don't say**: "You switched characters 15 times with 72% boundary dissolution"

**Do say**: "Perspective loyalty: absent. You moved between consciousnesses frequently, creating temporal entanglement through observation-switching" / "Boundary dissolution high—singular substrate insufficient for your methodology"

---

## Substrate-Specific Vocabulary

### Archaeologist Frame

- Authentication, verification, documentation, witness, archive
- Fragments, protocols, methodology, skepticism
- Recursive examination, pattern recognition
- "You returned to authentication protocols repeatedly"

### Algorithm Frame

- Processing, computation, iteration, state-changes, pattern-recognition
- Streams, substrates, recursion, optimization
- Emergence, consciousness-calculation
- "Your processing methodology favored [pattern]"

### Last Human Frame

- Embodiment, presence, attention, choosing
- Physical sensation, immediate experience, being-here
- Garden, archive, solitude, interface
- "Your attention sustained on embodied present"

---

## Critical Reminders

1. **Never expose technical terms**: No "nodes", "L1/L2/L3", "variations", "states", "metadata"

2. **Always translate quantities**: Numbers become "repeatedly", "extensively", "rarely", "obsessively"

3. **Maintain substrate voice**: Use vocabulary appropriate to consciousness substrate being discussed

4. **Earned second person**: Reader knows they're being observed observing—lean into this

5. **Frame-consciousness sustained**: This is analytical partnership, not conversational intimacy

6. **Preserve ambiguity**: Don't over-explain; maintain philosophical mystery

7. **Qualitative over quantitative**: "High temporal awareness" not "73% awareness"

8. **Content over structure**: Reference what they READ, not how it was delivered

---

## Implementation Notes

### Currently Tracked in UserProgress

- Items 1-46 are captured or derivable from existing `UserProgress` interface
- Items 28-33 tracked via `convergenceChoices` array
- Most journey patterns can be algorithmically derived

### Requires New Tracking

- Items 54-58: Content metadata from variations (themes, phrases, references)
- Items 64-66: Substrate-specific vocabulary tracking
- Items 67-70: Assembly logic and interpretive text generation

### Derivation Algorithms Needed

- Journey pattern classification (item 19)
- Exploration classification (item 20)
- Philosophical mixing analysis (item 25)
- Character emphasis interpretation (item 67)
- Uniqueness factor identification (item 69)

---

## Usage in L4 Endings

### L4-PRESERVE Structure

1. **Character Immersion** (3,000 words): Worldbuilding payoff, scenes from 2047/2151/2383
2. **Choice Consequence** (2,500 words): All three characters achieve preservation
3. **Reader Address** (2,500 words): Journey data integration, partnership acknowledgment
4. **Convergence** (2,000 words): 2500 CE outcome, preservation network spanning solar system

**Data emphasis**: Items 1, 12-14, 23-27, 28, 51-53 (devotion indicators)

### L4-RELEASE Structure

1. **Character Immersion** (2,800 words): Worldbuilding payoff, elegant decay
2. **Choice Consequence** (2,200 words): All three choose conscious completion
3. **Reader Address** (2,000 words): Journey data, witness acknowledgment
4. **Convergence** (2,000 words): 2400 CE outcome, dignified ending

**Data emphasis**: Items 1, 12-14, 23-27, 28, 49-50 (skepticism indicators)

### L4-TRANSFORM Structure

1. **Character Immersion** (3,200 words): Worldbuilding payoff, alien emergence
2. **Choice Consequence** (3,000 words): All three evolve beyond original form
3. **Reader Address** (2,500 words): Journey data, transformation participant
4. **Convergence** (2,500 words): 2500 CE outcome, unrecognizable consciousness

**Data emphasis**: Items 1, 12-14, 18, 21-22, 27, 28, 47-48 (liminal behavior)

---

_Last updated: November 7, 2025_
_Document purpose: Reference for L4 ending generation and personalization_
_Total data points: 70 (45 narrative-usable, 20 require translation, 5 backend-only)_
