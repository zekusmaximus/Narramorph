import type { StoryData, StoryNode, Connection } from '@/types';

interface StoryMetadataFile {
  metadata: {
    id: string;
    title: string;
    author: string;
    description: string;
    version: string;
    estimatedPlaytime: number;
    tags: string[];
    createdAt: string;
    lastModified: string;
  };
  configuration: {
    startNode: string;
    enableTransformations: boolean;
    requireCompleteReads: boolean;
    allowBacktracking: boolean;
    saveProgress: boolean;
  };
  structure: {
    totalNodes: number;
    totalConnections: number;
    narrativeActs: number;
    criticalPathNodes: string[];
    endingNodes: string[];
    characterDistribution: Record<string, number>;
  };
  themes: {
    primary: string[];
    secondary: string[];
    motifs: string[];
  };
}

interface CharacterNodeFile {
  character: string;
  nodes: StoryNode[];
}

interface NodeDefinition {
  id: string;
  layer: number;
  chapterTitle: string;
  connections?: string[];
  redirectTo?: string;
  bridgeMoments?: string[];
  contentFile: string;
}

interface CharacterNodeDefinitionFile {
  character: string;
  nodes: NodeDefinition[];
}

interface ContentFile {
  transformationStates: {
    initial: string;
    firstRevisit: string;
    metaAware: string;
  };
}

export class ContentLoadError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ContentLoadError';
  }
}

export async function loadStoryContent(storyId: string): Promise<StoryData> {
  try {
    const basePath = `/src/data/stories/${storyId}`;

    // Load story metadata
    const metadataResponse = await fetch(`${basePath}/story.json`);
    if (!metadataResponse.ok) {
      throw new ContentLoadError(`Failed to load story metadata for ${storyId}: ${metadataResponse.statusText}`);
    }

    const metadata: StoryMetadataFile = await metadataResponse.json();

    // Load character node files
    const characterFiles = ['archaeologist', 'algorithm', 'human'];
    const nodePromises = characterFiles.map(async (character) => {
      try {
        const response = await fetch(`${basePath}/${character}.json`);
        if (!response.ok) {
          throw new ContentLoadError(`Failed to load ${character} nodes: ${response.statusText}`);
        }
        const data = await response.json();

        // Check if this is the new format (with contentFile) or old format (with inline content)
        if (data.nodes && data.nodes.length > 0 && 'contentFile' in data.nodes[0]) {
          // New format - load content from separate files
          const nodeDefinitions = data as CharacterNodeDefinitionFile;
          const nodesWithContent = await Promise.all(
            nodeDefinitions.nodes.map(async (nodeDef) => {
              const contentResponse = await fetch(`${basePath}/${nodeDef.contentFile}`);
              if (!contentResponse.ok) {
                throw new ContentLoadError(`Failed to load content file ${nodeDef.contentFile}: ${contentResponse.statusText}`);
              }
              const contentData: ContentFile = await contentResponse.json();

              // Build full StoryNode
              return {
                id: nodeDef.id,
                character: character as 'archaeologist' | 'algorithm' | 'human',
                title: nodeDef.chapterTitle,
                position: { x: 0, y: 0 }, // Position will be set later
                content: contentData.transformationStates,
                connections: (nodeDef.connections || []).map(targetId => ({
                  targetId,
                  type: 'temporal' as const,
                })),
                visualState: {
                  defaultColor: character === 'archaeologist' ? '#4A90E2' :
                               character === 'algorithm' ? '#50C878' : '#E74C3C',
                  size: 35,
                  shape: 'circle' as const,
                },
                metadata: {
                  estimatedReadTime: 4,
                  thematicTags: [],
                  narrativeAct: Math.ceil(nodeDef.layer / 2),
                  criticalPath: nodeDef.layer === 1,
                },
                redirectTo: nodeDef.redirectTo,
                bridgeMoments: nodeDef.bridgeMoments,
              } as StoryNode;
            })
          );
          return { character, nodes: nodesWithContent };
        } else {
          // Old format - use as-is
          return data as CharacterNodeFile;
        }
      } catch (error) {
        console.warn(`Optional character file ${character}.json not found for story ${storyId}`);
        return { character, nodes: [] };
      }
    });

    const characterData = await Promise.all(nodePromises);

    // Combine all nodes and extract connections
    const allNodes: StoryNode[] = [];
    const allConnections: Connection[] = [];

    characterData.forEach(({ nodes }) => {
      nodes.forEach((node) => {
        allNodes.push(node);

        // Extract connections from each node
        if (node.connections) {
          node.connections.forEach((connection) => {
            allConnections.push({
              id: `${node.id}-${connection.targetId}`,
              sourceId: node.id,
              targetId: connection.targetId,
              type: connection.type,
              label: connection.label || '',
              bidirectional: connection.bidirectional || false,
              visualProperties: {
                color: '#666666',
                weight: 2,
                animated: false,
              },
            });
          });
        }
      });
    });

    // Build the complete story data structure
    const storyData: StoryData = {
      metadata: {
        id: metadata.metadata.id,
        title: metadata.metadata.title,
        author: metadata.metadata.author,
        description: metadata.metadata.description,
        version: metadata.metadata.version,
        estimatedPlaytime: metadata.metadata.estimatedPlaytime,
      },
      nodes: allNodes,
      connections: allConnections,
      configuration: {
        startNodeId: metadata.configuration.startNode,
        endingNodeIds: metadata.structure.endingNodes,
        requiredNodesForCompletion: metadata.structure.criticalPathNodes,
      },
    };

    // Validate story data
    validateStoryData(storyData);

    return storyData;

  } catch (error) {
    if (error instanceof ContentLoadError) {
      throw error;
    }
    throw new ContentLoadError(`Failed to load story content for ${storyId}`, error as Error);
  }
}

function validateStoryData(storyData: StoryData): void {
  // Validate basic structure
  if (!storyData.metadata?.id) {
    throw new ContentLoadError('Story metadata missing required id field');
  }

  if (!storyData.nodes || storyData.nodes.length === 0) {
    throw new ContentLoadError('Story must contain at least one node');
  }

  // Validate start node exists
  const startNodeExists = storyData.nodes.some(node => node.id === storyData.configuration.startNodeId);
  if (!startNodeExists) {
    throw new ContentLoadError(`Start node ${storyData.configuration.startNodeId} not found in story nodes`);
  }

  // Validate node structure
  storyData.nodes.forEach((node, index) => {
    if (!node.id) {
      throw new ContentLoadError(`Node at index ${index} missing required id field`);
    }

    if (!node.content?.initial) {
      throw new ContentLoadError(`Node ${node.id} missing required initial content`);
    }

    if (!node.character) {
      throw new ContentLoadError(`Node ${node.id} missing required character field`);
    }

    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      throw new ContentLoadError(`Node ${node.id} missing valid position coordinates`);
    }
  });

  // Validate connections reference existing nodes
  const nodeIds = new Set(storyData.nodes.map(node => node.id));
  if (storyData.connections) {
    storyData.connections.forEach((connection) => {
      if (!nodeIds.has(connection.sourceId)) {
        throw new ContentLoadError(`Connection ${connection.id} references non-existent source node ${connection.sourceId}`);
      }

      if (!nodeIds.has(connection.targetId)) {
        throw new ContentLoadError(`Connection ${connection.id} references non-existent target node ${connection.targetId}`);
      }
    });
  }

  // Validate critical path nodes exist
  storyData.configuration.requiredNodesForCompletion.forEach((nodeId: string) => {
    if (!nodeIds.has(nodeId)) {
      throw new ContentLoadError(`Critical path references non-existent node ${nodeId}`);
    }
  });

  // Validate ending nodes exist
  storyData.configuration.endingNodeIds.forEach((nodeId: string) => {
    if (!nodeIds.has(nodeId)) {
      throw new ContentLoadError(`Ending node references non-existent node ${nodeId}`);
    }
  });
}

export function getAvailableStories(): string[] {
  // In a real implementation, this would scan the stories directory
  // For now, return the known story ID
  return ['eternal-return'];
}

export function getStoryMetadata(storyId: string): Promise<StoryData['metadata']> {
  return loadStoryContent(storyId).then(story => story.metadata);
}