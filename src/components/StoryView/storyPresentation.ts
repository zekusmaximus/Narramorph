import type { CharacterType, TransformationState } from '@/types';

export interface StoryCharacterTheme {
  accent: string;
  border: string;
  bg: string;
  text: string;
}

export const storyCharacterThemes: Record<CharacterType, StoryCharacterTheme> = {
  archaeologist: {
    accent: 'from-blue-500 to-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  algorithm: {
    accent: 'from-green-500 to-green-600',
    border: 'border-green-200',
    bg: 'bg-green-50',
    text: 'text-green-800',
  },
  'last-human': {
    accent: 'from-red-500 to-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-800',
  },
  'multi-perspective': {
    accent: 'from-purple-500 to-purple-600',
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
