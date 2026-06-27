import { useReducedMotion } from 'framer-motion';

import { useStoryStore } from '@/stores';

export function resolveReducedMotionPreference(
  userPreference: boolean,
  systemPreference: boolean | null,
): boolean {
  return userPreference || systemPreference === true;
}

export function useReducedMotionPreference(): boolean {
  const systemPreference = useReducedMotion();
  const userPreference = useStoryStore((state) => state.preferences.reduceMotion);
  return resolveReducedMotionPreference(userPreference, systemPreference);
}
