import type { CharacterType, StoryNode, TransformationState } from '@/types';

const DEFAULT_WORDS_PER_MINUTE = 225;

export interface StoryCharacterTheme {
  accent: string;
  border: string;
  bg: string;
  text: string;
}

export const storyCharacterThemes: Record<CharacterType, StoryCharacterTheme> = {
  archaeologist: {
    accent: 'from-slate-950 via-blue-950 to-slate-950',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  algorithm: {
    accent: 'from-slate-950 via-emerald-950 to-slate-950',
    border: 'border-green-200',
    bg: 'bg-green-50',
    text: 'text-green-800',
  },
  'last-human': {
    accent: 'from-slate-950 via-rose-950 to-slate-950',
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-800',
  },
  'multi-perspective': {
    accent: 'from-slate-950 via-violet-950 to-slate-950',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
  },
};

export function getStateLabel(state: TransformationState): string {
  switch (state) {
    case 'initial':
      return 'First Visit';
    case 'firstRevisit':
      return 'Returning';
    case 'metaAware':
      return 'Meta-Aware';
  }
}

export function getStateGlyph(state: TransformationState): string {
  switch (state) {
    case 'initial':
      return '●';
    case 'firstRevisit':
      return '◑';
    case 'metaAware':
      return '◎';
  }
}

export function formatReadingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes === 0
    ? `${remainingSeconds}s`
    : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Counts words a reader will encounter rather than Markdown punctuation or URLs.
 * The selected variation is passed here at render time, so the estimate follows
 * the actual passage instead of static node metadata.
 */
export function countReadableWords(content: string): number {
  const readableText = content
    .replace(/^---[\s\S]*?\n---\n+/, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#>*_~`|=-]+/g, ' ');

  return readableText.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

export function estimateReadingMinutes(
  content: string,
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE,
): number {
  const wordCount = countReadableWords(content);
  if (wordCount === 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function formatEstimatedReadingTime(content: string): string {
  const wordCount = countReadableWords(content);
  if (wordCount === 0) {
    return 'Brief fragment';
  }
  if (wordCount < DEFAULT_WORDS_PER_MINUTE) {
    return 'Less than 1 min read';
  }
  const minutes = estimateReadingMinutes(content);
  return `${minutes} min read`;
}

export function getAvailableContinuationNodes(
  currentNode: StoryNode,
  nodes: ReadonlyMap<string, StoryNode>,
  canVisitNode: (nodeId: string) => boolean,
): StoryNode[] {
  const seen = new Set<string>();
  return currentNode.connections.flatMap((connection) => {
    if (seen.has(connection.targetId) || !canVisitNode(connection.targetId)) {
      return [];
    }
    const nextNode = nodes.get(connection.targetId);
    if (!nextNode) {
      return [];
    }
    seen.add(connection.targetId);
    return [nextNode];
  });
}
