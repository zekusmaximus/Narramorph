import { describe, expect, it } from 'vitest';

import {
  CONDITION_CATEGORY_EXPLANATIONS,
  JOURNEY_CONDITION_CATEGORIES,
  renderConditionCategoryExplanation,
} from './conditionExplanations';

const SHIPPED_SCHEMA_CATEGORIES = [
  'historyStartsWith',
  'historyEndsWith',
  'orderSeen',
  'visitedImmediatelyAfter',
  'withinSteps',
  'visitCount',
  'visitedCountAcross',
  'all',
  'any',
  'not',
] as const;

describe('condition-category explanations', () => {
  it('has one human-reviewed template for every Story Package 1.1 category', () => {
    expect([...JOURNEY_CONDITION_CATEGORIES].sort()).toEqual([...SHIPPED_SCHEMA_CATEGORIES].sort());
    expect(Object.values(CONDITION_CATEGORY_EXPLANATIONS)).toHaveLength(
      SHIPPED_SCHEMA_CATEGORIES.length,
    );
  });

  it.each(SHIPPED_SCHEMA_CATEGORIES)('renders %s without raw condition data', (category) => {
    const rendered = renderConditionCategoryExplanation(category);

    expect(rendered).toMatch(/^This version /);
    expect(rendered).not.toMatch(/[{}[\]"]/);
    expect(rendered).not.toMatch(/(?:passageIds|passageId|comparison|conditions|kind|steps)/i);
    expect(rendered).not.toMatch(/(?:arch|algo|hum)-L[1-4]|final-(?:preserve|transform|release)/i);
  });
});
