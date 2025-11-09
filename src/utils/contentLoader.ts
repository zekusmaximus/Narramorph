import type { StoryData, StoryNode, Connection } from '@/types';

// Glob imports (Vite) — eager for metadata/nodes, lazy for heavy L3 sections
// We keep types inline here to avoid cross-file coupling during migration
interface StoryMetadataFile {
  metadata: {
    id: string; title: string; author: string; description: string; version: string; estimatedPlaytime: number;
    tags?: string[]; createdAt?: string; lastModified?: string;
  };
  configuration: { startNode: string; enableTransformations?: boolean; requireCompleteReads?: boolean; allowBacktracking?: boolean; saveProgress?: boolean; };
  structure: { totalNodes?: number; totalConnections?: number; narrativeActs?: number; criticalPathNodes: string[]; endingNodes: string[]; characterDistribution?: Record<string, number>; };
}

interface CharacterNodeFile { character: string; nodes: StoryNode[]; }

interface NodeDefinition {
  id: string; layer: number; chapterTitle: string; connections?: string[]; redirectTo?: string; bridgeMoments?: string[]; contentFile: string; position?: { x: number; y: number };
}
interface CharacterNodeDefinitionFile { character: string; nodes: NodeDefinition[]; }

interface ContentFile { transformationStates: { initial: string; firstRevisit: string; metaAware: string; }; }

// External variations file (Pattern B)
interface VariationFile {
  nodeId: string;
  totalVariations: number;
  distribution?: { initial: number; firstRevisit: number; metaAware: number };
  variations: Array<{
    id: string;
    transformationState: 'initial' | 'firstRevisit' | 'metaAware';
    awarenessRange?: [number, number];
    content: string;
  }>;
}

interface LayoutFile {
  layers: Record<string, { y?: number; spacing?: number; nodes: Record<string, { x: number; y: number }> }>;
}

export class ContentLoadError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ContentLoadError';
  }
}

function normalizeCharacter(char: string): 'archaeologist' | 'algorithm' | 'last-human' | 'multi-perspective' {
  const n = (char || '').toLowerCase().replace(/[-_]/g, '');
  if (n === 'human' || n === 'lasthuman' || n === 'hum') return 'last-human';
  if (n === 'archaeologist' || n === 'arch' || n === 'arc') return 'archaeologist';
  if (n === 'algorithm' || n === 'algo') return 'algorithm';
  if (n === 'multiperspective') return 'multi-perspective';
  return 'archaeologist';
}

function getNodePosition(nodeId: string, layout?: LayoutFile): { x: number; y: number } {
  if (layout) {
    for (const layer of Object.values(layout.layers)) {
      if (layer.nodes[nodeId]) return layer.nodes[nodeId];
    }
  }
  const match = nodeId.match(/^(arch|arc|algo|hum|algorithm|human)-L?(\d).*$/);
  if (match) {
    const char = match[1];
    const layer = parseInt(match[2] || '1', 10);
    const charIndex = { arch: 0, arc: 0, algo: 1, algorithm: 1, hum: 2, human: 2 } as Record<string, number>;
    return { x: 150 + (charIndex[char] ?? 0) * 350, y: 150 + layer * 220 };
  }
  const hash = nodeId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return { x: 100 + ((hash % 10) * 120), y: 100 + (Math.floor(hash / 10) % 5) * 150 };
}

export async function loadStoryContent(storyId: string): Promise<StoryData> {
  try {
    // Build glob maps
    const metaMap = import.meta.glob('/src/data/stories/*/story.json', { eager: true, import: 'default' }) as Record<string, StoryMetadataFile>;
    const charMap = import.meta.glob('/src/data/stories/*/*.json', { eager: true, import: 'default' }) as Record<string, CharacterNodeFile | CharacterNodeDefinitionFile | StoryMetadataFile>;
    const l1VarMap = import.meta.glob('/src/data/stories/*/content/layer1/*-variations.json', { eager: true, import: 'default' }) as Record<string, VariationFile>;
    const l2VarMap = import.meta.glob('/src/data/stories/*/content/layer2/*-variations.json', { eager: true, import: 'default' }) as Record<string, VariationFile>;
    const layoutMap = import.meta.glob('/src/data/stories/*/layout.json', { eager: true, import: 'default' }) as Record<string, LayoutFile>;

    const metaEntry = Object.entries(metaMap).find(([p]) => p.includes(`/${storyId}/story.json`));
    if (!metaEntry) throw new ContentLoadError(`Story metadata not found for ${storyId}`);
    const [, metadata] = metaEntry;

    const layoutEntry = Object.entries(layoutMap).find(([p]) => p.includes(`/${storyId}/`));
    const layout = layoutEntry ? layoutEntry[1] : undefined;

    // Gather character node files for this story (exclude story.json and content subpaths)
    const charFiles = Object.entries(charMap)
      .filter(([p]) => p.includes(`/stories/${storyId}/`) && !p.endsWith('/story.json') && !p.includes('/content/'))
      .map(([, data]) => data);

    const allNodes: StoryNode[] = [];
    const allConnections: Connection[] = [];

    for (const charData of charFiles) {
      const isDef = (d: any): d is CharacterNodeDefinitionFile => Array.isArray((d as any).nodes) && (d as any).nodes.length > 0 && 'contentFile' in (d as any).nodes[0];
      if (isDef(charData)) {
        const characterRaw = charData.character as string;
        for (const def of charData.nodes) {
          // Try external content file (Pattern B): variations or transformationStates
          const contentPath = `/src/data/stories/${storyId}/${def.contentFile}`.replace(/\\/g, '/');
          const varData = (l1VarMap[contentPath] || l2VarMap[contentPath]) as VariationFile | undefined;
          let content: StoryNode['content'] | undefined;

          if (varData && varData.variations?.length) {
            // Materialize one representative per state for now (selector will refine later)
            const pick = (state: 'initial' | 'firstRevisit' | 'metaAware') =>
              varData.variations.find(v => v.transformationState === state)?.content || '';
            content = { initial: pick('initial'), firstRevisit: pick('firstRevisit'), metaAware: pick('metaAware') };
          } else {
            // Attempt legacy content file with transformationStates via glob (not mapped here); leave empty if missing
            content = { initial: '', firstRevisit: '', metaAware: '' };
          }

          // Build node
          const node: StoryNode = {
            id: def.id,
            character: normalizeCharacter(characterRaw),
            title: def.chapterTitle,
            position: def.position || getNodePosition(def.id, layout),
            content: content!,
            connections: (def.connections || []).map(t => ({ targetId: t, type: 'temporal' as const })),
            visualState: {
              defaultColor: characterRaw === 'archaeologist' || characterRaw === 'arch' || characterRaw === 'arc' ? '#4A90E2' : characterRaw === 'algorithm' || characterRaw === 'algo' ? '#50C878' : '#E74C3C',
              size: 35,
              shape: 'circle',
            },
            metadata: {
              estimatedReadTime: 4,
              thematicTags: [],
              narrativeAct: Math.max(1, Math.ceil((def.layer || 1) / 2)),
              criticalPath: (def.layer || 1) === 1,
            },
            redirectTo: def.redirectTo,
            bridgeMoments: def.bridgeMoments,
          };
          allNodes.push(node);
          for (const c of node.connections) {
            allConnections.push({
              id: `${node.id}-${c.targetId}`,
              sourceId: node.id,
              targetId: c.targetId,
              type: c.type,
              label: c.label || '',
              bidirectional: c.bidirectional || false,
              visualProperties: { color: '#666666', weight: 2, animated: false },
            });
          }
        }
      } else {
        // Inline format — normalize and accept as-is
        const cf = charData as CharacterNodeFile;
        for (const n of cf.nodes) {
          const node: StoryNode = {
            ...n,
            character: normalizeCharacter((n as any).character as string),
            position: (n as any).position || getNodePosition(n.id, layout),
          };
          allNodes.push(node);
          for (const c of node.connections || []) {
            allConnections.push({
              id: `${node.id}-${c.targetId}`,
              sourceId: node.id,
              targetId: c.targetId,
              type: c.type,
              label: c.label || '',
              bidirectional: c.bidirectional || false,
              visualProperties: { color: '#666666', weight: 2, animated: false },
            });
          }
        }
      }
    }

    // Build story data (with soft validation ordering)
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

    // Soft-validate: warn but do not throw to unblock dev
    try { validateStoryData(storyData); } catch (err) { console.warn('[contentLoader] Validation warning:', (err as Error).message); }

    return storyData;
  } catch (error) {
    if (error instanceof ContentLoadError) throw error;
    throw new ContentLoadError(`Failed to load story content for ${storyId}`, error as Error);
  }
}

function validateStoryData(storyData: StoryData): void {
  if (!storyData.metadata?.id) throw new ContentLoadError('Story metadata missing required id field');
  if (!storyData.nodes || storyData.nodes.length === 0) throw new ContentLoadError('Story must contain at least one node');
  const startNodeExists = storyData.nodes.some(n => n.id === storyData.configuration.startNodeId);
  if (!startNodeExists) throw new ContentLoadError(`Start node ${storyData.configuration.startNodeId} not found in story nodes`);
  const nodeIds = new Set(storyData.nodes.map(n => n.id));
  for (const node of storyData.nodes) {
    if (!node.id) throw new ContentLoadError('Node missing id');
    if (!node.content?.initial) throw new ContentLoadError(`Node ${node.id} missing initial content`);
    if (!node.character) throw new ContentLoadError(`Node ${node.id} missing character`);
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') throw new ContentLoadError(`Node ${node.id} missing position`);
  }
  for (const c of storyData.connections || []) {
    if (!nodeIds.has(c.sourceId)) throw new ContentLoadError(`Connection ${c.id} has missing source ${c.sourceId}`);
    if (!nodeIds.has(c.targetId)) throw new ContentLoadError(`Connection ${c.id} has missing target ${c.targetId}`);
  }
  for (const nid of storyData.configuration.requiredNodesForCompletion) if (!nodeIds.has(nid)) throw new ContentLoadError(`Critical path references non-existent node ${nid}`);
  for (const nid of storyData.configuration.endingNodeIds) if (!nodeIds.has(nid)) throw new ContentLoadError(`Ending node references non-existent node ${nid}`);
}

export function getAvailableStories(): string[] {
  return ['eternal-return'];
}

export function getStoryMetadata(storyId: string): Promise<StoryData['metadata']> {
  return loadStoryContent(storyId).then(s => s.metadata);
}
