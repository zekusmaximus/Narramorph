import type { CharacterType, StoryNode } from '@/types';

export interface NarrativePathEntry {
  action: 'Encountered' | 'Returned to' | 'Returned again to';
  characterLabel: string;
  occurrence: number;
  title: string;
}

function getCharacterLabel(character: CharacterType): string {
  switch (character) {
    case 'archaeologist':
      return 'The Archaeologist';
    case 'algorithm':
      return 'The Algorithm';
    case 'last-human':
      return 'The Last Human';
    case 'multi-perspective':
      return 'The Convergence';
  }
}

/**
 * Translates the stored node-id trail at the presentation boundary. Occurrences
 * are counted before the list is shortened, so a return remains a return even
 * when its first encounter is outside the visible window.
 */
export function buildNarrativePath(
  readingPath: string[],
  nodes: ReadonlyMap<string, StoryNode>,
  limit = 10,
): NarrativePathEntry[] {
  if (limit <= 0) {
    return [];
  }
  const occurrences = new Map<string, number>();
  const entries = readingPath.map((nodeId): NarrativePathEntry => {
    const occurrence = (occurrences.get(nodeId) ?? 0) + 1;
    occurrences.set(nodeId, occurrence);
    const node = nodes.get(nodeId);

    return {
      action:
        occurrence === 1 ? 'Encountered' : occurrence === 2 ? 'Returned to' : 'Returned again to',
      characterLabel: node ? getCharacterLabel(node.character) : 'Origin unavailable',
      occurrence,
      title: node?.title ?? 'An unindexed archive fragment',
    };
  });

  return entries.slice(-limit);
}
