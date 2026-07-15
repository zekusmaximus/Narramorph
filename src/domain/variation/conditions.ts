import type {
  ConditionContext,
  ConditionEvaluation,
  JourneyConditionExpression,
  NumericComparison,
} from '@/types';

function compare(actual: number, comparison: NumericComparison, expected: number): boolean {
  switch (comparison) {
    case 'eq':
      return actual === expected;
    case 'ne':
      return actual !== expected;
    case 'gt':
      return actual > expected;
    case 'gte':
      return actual >= expected;
    case 'lt':
      return actual < expected;
    case 'lte':
      return actual <= expected;
  }
}

function hasNonEmptyPassageIds(passageIds: readonly string[]): boolean {
  return passageIds.length > 0 && passageIds.every((passageId) => passageId.length > 0);
}

function startsWith(history: readonly string[], expected: readonly string[]): boolean {
  return (
    hasNonEmptyPassageIds(expected) &&
    expected.every((passageId, index) => history[index] === passageId)
  );
}

function endsWith(history: readonly string[], expected: readonly string[]): boolean {
  if (!hasNonEmptyPassageIds(expected) || expected.length > history.length) {
    return false;
  }
  const offset = history.length - expected.length;
  return expected.every((passageId, index) => history[offset + index] === passageId);
}

function appearsInOrder(history: readonly string[], expected: readonly string[]): boolean {
  if (!hasNonEmptyPassageIds(expected)) {
    return false;
  }
  let cursor = 0;
  for (const passageId of expected) {
    const index = history.indexOf(passageId, cursor);
    if (index < 0) {
      return false;
    }
    cursor = index + 1;
  }
  return true;
}

function evaluateLeaf(
  condition: Exclude<JourneyConditionExpression, { kind: 'all' | 'any' | 'not' }>,
  context: ConditionContext,
): ConditionEvaluation {
  const history = context.readingPath;
  let matched = false;
  let actual: string | number | boolean | string[] = [...history];
  let expected: string | number | boolean | string[] = false;

  switch (condition.kind) {
    case 'historyStartsWith':
      matched = startsWith(history, condition.passageIds);
      expected = condition.passageIds;
      break;
    case 'historyEndsWith':
      matched = endsWith(history, condition.passageIds);
      expected = condition.passageIds;
      break;
    case 'orderSeen':
      matched = appearsInOrder(history, condition.passageIds);
      expected = condition.passageIds;
      break;
    case 'visitedImmediatelyAfter': {
      expected = [condition.beforePassageId, condition.afterPassageId];
      matched = history.some(
        (passageId, index) =>
          passageId === condition.afterPassageId &&
          index > 0 &&
          history[index - 1] === condition.beforePassageId,
      );
      break;
    }
    case 'withinSteps': {
      expected = condition.steps;
      const lastIndex = history.lastIndexOf(condition.passageId);
      actual = lastIndex < 0 ? -1 : history.length - 1 - lastIndex;
      matched = Number.isInteger(condition.steps) && condition.steps >= 0 && lastIndex >= 0;
      matched = matched && actual <= condition.steps;
      break;
    }
    case 'visitCount': {
      actual = context.visitCounts[condition.passageId] ?? 0;
      expected = condition.value;
      matched = compare(actual, condition.comparison, condition.value);
      break;
    }
    case 'visitedCountAcross': {
      actual = hasNonEmptyPassageIds(condition.passageIds)
        ? condition.passageIds.reduce(
            (total, passageId) => total + (context.visitCounts[passageId] ?? 0),
            0,
          )
        : 0;
      expected = condition.value;
      matched =
        hasNonEmptyPassageIds(condition.passageIds) &&
        new Set(condition.passageIds).size === condition.passageIds.length &&
        compare(actual, condition.comparison, condition.value);
      break;
    }
  }

  return {
    matched,
    evidence: [{ kind: condition.kind, matched, actual, expected }],
  };
}

/**
 * Evaluates a serialized journey condition against an explicit progress snapshot.
 * Malformed empty composition and path operands fail closed.
 */
export function evaluateJourneyCondition(
  condition: JourneyConditionExpression,
  context: ConditionContext,
): ConditionEvaluation {
  if (condition.kind === 'all') {
    if (condition.conditions.length === 0) {
      return { matched: false, evidence: [] };
    }
    const evaluations = condition.conditions.map((child) =>
      evaluateJourneyCondition(child, context),
    );
    return {
      matched: evaluations.every((evaluation) => evaluation.matched),
      evidence: evaluations.flatMap((evaluation) => evaluation.evidence),
    };
  }

  if (condition.kind === 'any') {
    if (condition.conditions.length === 0) {
      return { matched: false, evidence: [] };
    }
    const evaluations = condition.conditions.map((child) =>
      evaluateJourneyCondition(child, context),
    );
    const firstMatch = evaluations.find((evaluation) => evaluation.matched);
    return {
      matched: !!firstMatch,
      evidence: firstMatch?.evidence ?? evaluations.flatMap((evaluation) => evaluation.evidence),
    };
  }

  if (condition.kind === 'not') {
    const evaluation = evaluateJourneyCondition(condition.condition, context);
    return { matched: !evaluation.matched, evidence: evaluation.evidence };
  }

  return evaluateLeaf(condition, context);
}
