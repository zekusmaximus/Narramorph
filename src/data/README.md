# Story Data Directory

This directory contains JSON files that define the story content for Narramorph Fiction.

## Structure

```
data/
├── stories/
│   └── eternal-return/
│       ├── story.json          # Story metadata and configuration
│       ├── nodes/
│       │   ├── archaeologist.json  # Archaeologist character nodes
│       │   ├── algorithm.json      # Algorithm character nodes
│       │   └── human.json          # Human character nodes
│       └── connections/
│           └── connections.json    # Connection definitions (optional)
└── README.md                   # This file
```

## File Formats

### story.json
Contains story metadata, configuration, and file manifest:

```json
{
  "metadata": {
    "id": "eternal-return",
    "title": "Eternal Return of the Digital Self",
    "author": "Author Name",
    "version": "1.0.0",
    "description": "A recursive narrative exploring digital consciousness",
    "estimatedPlaytime": 90
  },
  "configuration": {
    "startNodeId": "archaeologist-threshold",
    "endingNodeIds": ["human-upload-choice", "human-remain-choice"],
    "requiredNodesForCompletion": ["archaeologist-upload", "algorithm-emergence"]
  },
  "manifest": {
    "nodeFiles": ["nodes/archaeologist.json", "nodes/algorithm.json", "nodes/human.json"],
    "connectionFiles": ["connections/connections.json"]
  }
}
```

### Node files (character.json)
Contains all nodes for a specific character:

```json
{
  "character": "archaeologist",
  "nodes": [
    {
      "id": "archaeologist-001",
      "title": "The First Fragment",
      "position": { "x": 150, "y": 100 },
      "content": {
        "initial": "The fragment loads in sections...",
        "firstRevisit": "I've reconstructed this memory...",
        "metaAware": "You've been here before..."
      },
      "connections": [
        {
          "targetId": "archaeologist-002",
          "type": "temporal",
          "label": "Three weeks later"
        }
      ],
      "visualState": {
        "defaultColor": "#4A90E2",
        "size": 30,
        "shape": "circle"
      },
      "metadata": {
        "estimatedReadTime": 3,
        "thematicTags": ["memory", "loss", "preservation"],
        "narrativeAct": 1,
        "criticalPath": true
      }
    }
  ]
}
```

## Development Notes

- Node IDs should follow the pattern: `{character}-{number}` (e.g., "archaeologist-001")
- Connection IDs should be descriptive: `conn-{number}` or `{type}-{description}`
- Content should be written in Markdown format
- Position coordinates are in pixels on the node map
- Colors should be hex values matching the theme
- All content files should be valid JSON

## Loading Story Data

Story data is loaded asynchronously by the `loadStory` action in the Zustand store. The loading process:

1. Fetch `story.json` for metadata and manifest
2. Load all node files in parallel
3. Load connections file if specified
4. Validate the complete story structure
5. Initialize the story state

## Content Guidelines

- Keep individual node content under 3000 characters
- Ensure all connections reference valid node IDs
- Include meaningful transformation states for revisits
- Use thematic tags for content organization
- Mark critical path nodes appropriately
- Provide realistic reading time estimates