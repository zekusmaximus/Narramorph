import type { CharacterType, TransformationState } from '@/types';

export interface StoryNodeTheme {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  rgb: string;
  gradient: string;
  glowColor: string;
  glowSecondary: string;
  glow: string;
  pulseGlow: string;
}

export const STORY_NODE_THEMES: Record<CharacterType, StoryNodeTheme> = {
  archaeologist: {
    primary: '#00e5ff',
    secondary: '#0097a7',
    tertiary: '#ffa726',
    accent: '#b0bec5',
    rgb: '0, 229, 255',
    gradient: 'from-cyan-400 via-cyan-600 to-teal-700',
    glowColor: '#00e5ff',
    glowSecondary: '#ffa726',
    glow: '0 0 30px #00e5ff, 0 0 60px rgba(0, 229, 255, 0.5), 0 0 100px rgba(255, 167, 38, 0.25), inset 0 0 20px #ffa726',
    pulseGlow:
      '0 0 40px #00e5ff, 0 0 80px rgba(0, 229, 255, 0.6), 0 0 120px rgba(255, 167, 38, 0.3)',
  },
  algorithm: {
    primary: '#39ff14',
    secondary: '#76ff03',
    tertiary: '#7c4dff',
    accent: '#e8f5e9',
    rgb: '57, 255, 20',
    gradient: 'from-green-400 via-green-500 to-purple-600',
    glowColor: '#39ff14',
    glowSecondary: '#7c4dff',
    glow: '0 0 40px #39ff14, 0 0 80px rgba(57, 255, 20, 0.5), 0 0 120px rgba(124, 77, 255, 0.25), 0 0 5px #ffffff',
    pulseGlow:
      '0 0 50px #39ff14, 0 0 100px rgba(57, 255, 20, 0.6), 0 0 150px rgba(124, 77, 255, 0.4)',
  },
  'last-human': {
    primary: '#d32f2f',
    secondary: '#b71c1c',
    tertiary: '#ff6e40',
    accent: '#fafafa',
    rgb: '211, 47, 47',
    gradient: 'from-red-600 via-red-700 to-red-900',
    glowColor: '#d32f2f',
    glowSecondary: '#ff6e40',
    glow: '0 0 50px #d32f2f, 0 0 90px rgba(211, 47, 47, 0.5), 0 0 130px rgba(255, 110, 64, 0.25), inset 0 0 30px #fafafa',
    pulseGlow:
      '0 0 60px #d32f2f, 0 0 110px rgba(211, 47, 47, 0.6), 0 0 160px rgba(255, 110, 64, 0.4)',
  },
  'multi-perspective': {
    primary: '#9c27b0',
    secondary: '#7b1fa2',
    tertiary: '#ce93d8',
    accent: '#f3e5f5',
    rgb: '156, 39, 176',
    gradient: 'from-purple-500 via-purple-600 to-purple-800',
    glowColor: '#9c27b0',
    glowSecondary: '#ce93d8',
    glow: '0 0 45px #9c27b0, 0 0 85px rgba(156, 39, 176, 0.5), 0 0 125px rgba(206, 147, 216, 0.25), inset 0 0 25px #f3e5f5',
    pulseGlow:
      '0 0 55px #9c27b0, 0 0 105px rgba(156, 39, 176, 0.6), 0 0 155px rgba(206, 147, 216, 0.4)',
  },
};

export function getCharacterIcon(character: CharacterType): string {
  switch (character) {
    case 'archaeologist':
      return '🔍';
    case 'algorithm':
      return '🧠';
    case 'last-human':
      return '👤';
    case 'multi-perspective':
      return '🔮';
  }
}

export function getTransformationBadge(state: TransformationState): string | null {
  if (state === 'firstRevisit') {
    return '◇';
  }
  if (state === 'metaAware') {
    return '◈';
  }
  return null;
}
