import type { CharacterType, StoryNode, UserProgress } from '@/types';

export interface NarrativePathEntry {
  action: 'Encountered' | 'Returned to' | 'Returned again to';
  /** Perspective of the passage, used to pick its record-sheet ink and tag. */
  character: CharacterType | null;
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
      character: node ? node.character : null,
      characterLabel: node ? getCharacterLabel(node.character) : 'Origin unavailable',
      occurrence,
      title: node?.title ?? 'An unindexed passage',
    };
  });

  return entries.slice(-limit);
}

/**
 * The four canonical progress axes (Phase 7.1). Each is a plain count derived
 * from data the store already holds, so the reader's sense of progress is
 * unambiguous instead of spread across near-synonym percentages.
 *
 * - **passagesOpened** — distinct passages the reader has opened, out of the total.
 * - **pathsExplored** — branch passages (layer 2) the reader has followed; the
 *   points where the story diverges. Zero until the reader takes a branch.
 * - **endingsReached** — how many of the story's endings (layer 4) the reader has
 *   reached, out of the total number of endings.
 * - **adaptationsDiscovered** — adaptive decisions the reader has seen (the same
 *   records the adaptation ledger lists).
 */
export interface ProgressSummary {
  passagesOpened: number;
  totalPassages: number;
  pathsExplored: number;
  endingsReached: number;
  totalEndings: number;
  adaptationsDiscovered: number;
}

export function buildProgressSummary(
  progress: Pick<UserProgress, 'visitedNodes' | 'selectionRecords'>,
  nodes: ReadonlyMap<string, StoryNode>,
): ProgressSummary {
  const visitedIds = Object.keys(progress.visitedNodes);
  const visited = new Set(visitedIds);

  let totalEndings = 0;
  let endingsReached = 0;
  let pathsExplored = 0;

  for (const [nodeId, node] of nodes) {
    if (node.layer === 4) {
      totalEndings += 1;
      if (visited.has(nodeId)) {
        endingsReached += 1;
      }
    } else if (node.layer === 2 && visited.has(nodeId)) {
      pathsExplored += 1;
    }
  }

  return {
    // Count only visited IDs that still resolve to a real passage, so a removed
    // node in an old save never inflates the headline count.
    passagesOpened: visitedIds.filter((id) => nodes.has(id)).length,
    totalPassages: nodes.size,
    pathsExplored,
    endingsReached,
    totalEndings,
    adaptationsDiscovered: progress.selectionRecords.length,
  };
}
