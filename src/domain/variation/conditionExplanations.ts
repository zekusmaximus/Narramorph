import type { JourneyConditionExpression } from '@/types';

export type JourneyConditionCategory = JourneyConditionExpression['kind'];

/**
 * Human-reviewed, reader-safe language for every condition category supported
 * by Story Package 1.1. These templates describe categories only: they never
 * interpolate passage IDs, operands, evidence, or future content.
 */
export const CONDITION_CATEGORY_EXPLANATIONS: Readonly<Record<JourneyConditionCategory, string>> = {
  historyStartsWith: 'This version reflects how your journey began.',
  historyEndsWith: 'This version reflects the passages you encountered most recently.',
  orderSeen: 'This version reflects the order in which you encountered earlier passages.',
  visitedImmediatelyAfter: 'This version reflects the passage you arrived from.',
  withinSteps: 'This version reflects a passage you encountered recently.',
  visitCount: 'This version reflects how often you have returned to an earlier passage.',
  visitedCountAcross: 'This version reflects how often you have revisited this part of the story.',
  all: 'This version reflects a combination of choices and encounters in your journey.',
  any: 'This version reflects one of several patterns in the journey you have already taken.',
  not: 'This version reflects a path your journey has not taken.',
};

export const JOURNEY_CONDITION_CATEGORIES = Object.freeze(
  Object.keys(CONDITION_CATEGORY_EXPLANATIONS) as JourneyConditionCategory[],
);

export function renderConditionCategoryExplanation(category: JourneyConditionCategory): string {
  return CONDITION_CATEGORY_EXPLANATIONS[category];
}
