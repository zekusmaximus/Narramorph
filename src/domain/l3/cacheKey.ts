import type { JourneyPattern, PathPhilosophy, SynthesisPattern } from '@/types';

export function generateL3CacheKey(
  journeyPattern: JourneyPattern,
  pathPhilosophy: PathPhilosophy,
  awarenessLevel: 'low' | 'medium' | 'high',
  synthesisPattern: SynthesisPattern,
): string {
  return `${journeyPattern}_${pathPhilosophy}_${awarenessLevel}_${synthesisPattern}`;
}
