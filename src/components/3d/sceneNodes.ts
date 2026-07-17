import type { CharacterType, StoryNode } from '@/types';

/**
 * The 3D scene and its accessible companion list must show exactly the same nodes
 * in the same order. This shared, pure selector is the single source of that
 * ordering so the canvas and the semantic list can never drift apart.
 */

export interface SceneNodeGroup {
  type: CharacterType;
  nodes: StoryNode[];
}

/** The scene is intentionally capped (the story's L1–L4 spine is ≤19 nodes). */
export const SCENE_NODE_LIMIT = 19;

const SCENE_CHARACTER_ORDER: readonly CharacterType[] = [
  'archaeologist',
  'algorithm',
  'last-human',
];

function nodeSortKey(node: StoryNode): string {
  return node.metadata?.chapterTitle ?? node.title ?? node.id;
}

/**
 * Group nodes by perspective in a stable order, sort each group by layer then
 * title, and cap the total at {@link SCENE_NODE_LIMIT}. Multi-perspective nodes are
 * excluded (they are not placed in the 3D constellation).
 */
export function selectSceneNodeGroups(nodes: readonly StoryNode[]): SceneNodeGroup[] {
  const byCharacter = new Map<CharacterType, StoryNode[]>();
  for (const node of nodes) {
    if (node.character === 'multi-perspective') {
      continue;
    }
    const existing = byCharacter.get(node.character);
    if (existing) {
      existing.push(node);
    } else {
      byCharacter.set(node.character, [node]);
    }
  }

  let remaining = SCENE_NODE_LIMIT;
  const result: SceneNodeGroup[] = [];
  for (const type of SCENE_CHARACTER_ORDER) {
    if (remaining <= 0) {
      break;
    }
    const group = byCharacter.get(type);
    if (!group || group.length === 0) {
      continue;
    }
    const sorted = [...group].sort((a, b) => {
      if (a.layer !== b.layer) {
        return a.layer - b.layer;
      }
      return nodeSortKey(a).localeCompare(nodeSortKey(b));
    });
    const limited = sorted.slice(0, remaining);
    if (limited.length === 0) {
      continue;
    }
    result.push({ type, nodes: limited });
    remaining -= limited.length;
  }

  return result;
}

/** Flattened node ids in scene order (handy for list rendering and tests). */
export function selectSceneNodeIds(nodes: readonly StoryNode[]): string[] {
  return selectSceneNodeGroups(nodes).flatMap((group) => group.nodes.map((node) => node.id));
}
