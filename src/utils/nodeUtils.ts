/**
 * Node utility functions for layer detection and routing
 */

/**
 * Extract layer number from node ID
 *
 * Examples:
 * - "arch-L1" → 1
 * - "algo-L2-accept" → 2
 * - "conv-L3-001" → 3
 * - "hum-L4-final" → 4
 *
 * @param nodeId - The node ID to parse
 * @returns Layer number (1-4), or 1 if not found
 */
export function getNodeLayer(nodeId: string): number {
  const match = nodeId.match(/-L(\d)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Check if node is Layer 3 (convergence)
 *
 * @param nodeId - The node ID to check
 * @returns true if node is L3
 */
export function isL3Node(nodeId: string): boolean {
  return getNodeLayer(nodeId) === 3;
}

/**
 * Check if node is Layer 4 (terminal)
 *
 * @param nodeId - The node ID to check
 * @returns true if node is L4
 */
export function isL4Node(nodeId: string): boolean {
  return getNodeLayer(nodeId) === 4;
}

/**
 * Extract character from node ID
 *
 * Examples:
 * - "arch-L1" → "archaeologist"
 * - "algo-L2-accept" → "algorithm"
 * - "hum-L3-001" → "lastHuman"
 * - "conv-L3-001" → "convergence"
 *
 * @param nodeId - The node ID to parse
 * @returns Character name, or null if not found
 */
export function getNodeCharacter(nodeId: string): string | null {
  if (nodeId.startsWith('arch')) return 'archaeologist';
  if (nodeId.startsWith('algo')) return 'algorithm';
  if (nodeId.startsWith('hum')) return 'lastHuman';
  if (nodeId.startsWith('conv')) return 'convergence';
  return null;
}

/**
 * Check if node is Layer 1 (initial)
 *
 * @param nodeId - The node ID to check
 * @returns true if node is L1
 */
export function isL1Node(nodeId: string): boolean {
  return getNodeLayer(nodeId) === 1;
}

/**
 * Check if node is Layer 2 (philosophy choice)
 *
 * @param nodeId - The node ID to check
 * @returns true if node is L2
 */
export function isL2Node(nodeId: string): boolean {
  return getNodeLayer(nodeId) === 2;
}
