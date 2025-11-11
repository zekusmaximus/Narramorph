/**
 * Philosophy mapping for L2 nodes
 *
 * Maps node IDs to their corresponding philosophy choices.
 * This is used to track the reader's philosophical path through the story.
 */

import type { PathPhilosophy } from '@/types';

/**
 * Map of node IDs to their associated philosophy
 */
export const nodePhilosophyMapping: Record<string, PathPhilosophy> = {
  // Archaeologist L2 nodes
  'arch-L2-accept': 'accept',
  'arch-L2-resist': 'resist',
  'arch-L2-invest': 'invest',

  // Algorithm L2 nodes
  'algo-L2-accept': 'accept',
  'algo-L2-resist': 'resist',
  'algo-L2-invest': 'invest',

  // Last Human L2 nodes
  'hum-L2-accept': 'accept',
  'hum-L2-resist': 'resist',
  'hum-L2-invest': 'invest',
};

/**
 * Get the philosophy associated with a node
 *
 * @param nodeId - The node ID to lookup
 * @returns The philosophy for this node, or null if not a philosophy node
 */
export function getNodePhilosophy(nodeId: string): PathPhilosophy | null {
  return nodePhilosophyMapping[nodeId] || null;
}

/**
 * Check if a node is an L2 philosophy choice node
 *
 * @param nodeId - The node ID to check
 * @returns True if this is an L2 philosophy node
 */
export function isPhilosophyNode(nodeId: string): boolean {
  return nodeId in nodePhilosophyMapping;
}
