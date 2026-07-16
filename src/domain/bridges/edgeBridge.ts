import type { Connection, ConditionContext, EdgeBridge, EdgeBridgeAlternative } from '@/types';

import { evaluateJourneyCondition } from '../variation/conditions';

/**
 * Bounds that keep condition-aware edge prose from becoming an unbounded second content system.
 * These are enforced by `validateEdgeBridges`; authored bridges that exceed them are a content
 * error, not a silent truncation.
 */
export const EDGE_BRIDGE_LIMITS = {
  /** Maximum alternative phrasings a single edge may offer. */
  maxAlternativesPerEdge: 6,
  /** Maximum characters in one resolved bridge fragment. */
  maxContentLength: 400,
} as const;

export interface ResolvedBridge {
  /** Stable ID of the selected bridge alternative, for the visit-event log. */
  bridgeId: string;
  /** The short Markdown fragment to render at passage entry. */
  content: string;
}

/**
 * Deterministically selects one alternative for an edge bridge.
 *
 * - An alternative qualifies when it has no condition, or its journey condition matches.
 * - Among qualifying alternatives the highest `priority` wins; ties keep the earliest author order.
 * - When none qualifies, the bridge is omitted if `omitWhenUnmatched` is set, otherwise the first
 *   authored alternative is the deterministic fallback.
 *
 * Returns `null` when the bridge has no alternatives or is deliberately omitted.
 */
export function resolveEdgeBridge(
  bridge: EdgeBridge | undefined,
  context: ConditionContext,
): ResolvedBridge | null {
  if (!bridge || bridge.alternatives.length === 0) {
    return null;
  }

  const qualifying = bridge.alternatives.filter(
    (alternative) =>
      alternative.condition === undefined ||
      evaluateJourneyCondition(alternative.condition, context).matched,
  );

  let chosen: EdgeBridgeAlternative | undefined;
  if (qualifying.length === 0) {
    if (bridge.omitWhenUnmatched) {
      return null;
    }
    chosen = bridge.alternatives[0];
  } else {
    // Reduce keeps the earliest element on a priority tie because the comparison is strict.
    chosen = qualifying.reduce((best, alternative) =>
      (alternative.priority ?? 0) > (best.priority ?? 0) ? alternative : best,
    );
  }

  if (!chosen) {
    return null;
  }
  return { bridgeId: chosen.id, content: chosen.content };
}

/**
 * Resolves the bridge prose for the edge the reader just crossed, from `fromNodeId` into
 * `toNodeId`. A connection matches when it links the two nodes in that direction, or in reverse
 * when the connection is bidirectional. Returns `null` when there is no crossed edge, no matching
 * connection, or the matching connection has no bridge to show.
 */
export function resolveEntryBridge(
  connections: ReadonlyMap<string, Connection>,
  fromNodeId: string | null | undefined,
  toNodeId: string,
  context: ConditionContext,
): ResolvedBridge | null {
  if (!fromNodeId) {
    return null;
  }

  for (const connection of connections.values()) {
    const forward = connection.sourceId === fromNodeId && connection.targetId === toNodeId;
    const reverse =
      connection.bidirectional &&
      connection.sourceId === toNodeId &&
      connection.targetId === fromNodeId;
    if (forward || reverse) {
      return resolveEdgeBridge(connection.bridge, context);
    }
  }

  return null;
}

export interface EdgeBridgeValidationIssue {
  connectionId: string;
  message: string;
}

/**
 * Enforces the edge-prose bounds. Returns one issue per violation; an empty array means every
 * bridge is within limits. Bridges are optional, so connections without a bridge are skipped.
 */
export function validateEdgeBridges(
  connections: Iterable<Connection>,
): EdgeBridgeValidationIssue[] {
  const issues: EdgeBridgeValidationIssue[] = [];

  for (const connection of connections) {
    const bridge = connection.bridge;
    if (!bridge) {
      continue;
    }

    if (bridge.alternatives.length === 0) {
      issues.push({ connectionId: connection.id, message: 'Edge bridge has no alternatives.' });
      continue;
    }

    if (bridge.alternatives.length > EDGE_BRIDGE_LIMITS.maxAlternativesPerEdge) {
      issues.push({
        connectionId: connection.id,
        message: `Edge bridge has ${bridge.alternatives.length} alternatives; the limit is ${EDGE_BRIDGE_LIMITS.maxAlternativesPerEdge}.`,
      });
    }

    for (const alternative of bridge.alternatives) {
      if (alternative.content.length > EDGE_BRIDGE_LIMITS.maxContentLength) {
        issues.push({
          connectionId: connection.id,
          message: `Bridge alternative "${alternative.id}" is ${alternative.content.length} characters; the limit is ${EDGE_BRIDGE_LIMITS.maxContentLength}.`,
        });
      }
    }
  }

  return issues;
}
