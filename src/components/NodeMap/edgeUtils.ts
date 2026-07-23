import type { Edge, MarkerType } from '@xyflow/react';
import type { CSSProperties } from 'react';

import type { StoryNode, ConnectionType } from '@/types';

/**
 * Get React Flow edge type based on connection type
 */
export function getEdgeType(connectionType: ConnectionType): string {
  const types: Record<ConnectionType, string> = {
    temporal: 'smoothstep',
    consciousness: 'default',
    recursive: 'step',
    hidden: 'straight',
  };
  return types[connectionType] || 'smoothstep';
}

/** Neutral hairline for locked / hidden edges (Accession). */
const EDGE_HIDDEN = '#3b4a54';

/**
 * Edge colour by connection type, drawn from the unified perspective / neutral
 * tokens (the neon "cyberpunk" palette is gone). Kept as literals here because
 * React Flow styles are plain CSS, not Tailwind classes; values mirror
 * `--perspective-*` and `--surface-*`.
 */
export function getEdgeColor(connectionType: ConnectionType): string {
  const colors: Record<ConnectionType, string> = {
    temporal: '#4A90E2', // archaeologist / time flow
    consciousness: '#B07CC9', // convergence ink / neural bridge
    recursive: '#50C878', // algorithm / loop
    hidden: EDGE_HIDDEN, // neutral hairline - locked
  };
  return colors[connectionType] || EDGE_HIDDEN;
}

/**
 * Edge style by connection type. Flat 2px strokes, no drop-shadow glows — hierarchy
 * comes from colour, dash, and opacity, not bloom.
 */
export function getEdgeStyle(connectionType: ConnectionType): CSSProperties {
  const baseColor = getEdgeColor(connectionType);

  const baseStyle: CSSProperties = {
    strokeWidth: 2,
    stroke: baseColor,
  };

  if (connectionType === 'recursive') {
    return {
      ...baseStyle,
      strokeDasharray: '8,4',
    };
  }

  if (connectionType === 'hidden') {
    return {
      ...baseStyle,
      strokeDasharray: '2,6',
      strokeWidth: 1,
      opacity: 0.35,
    };
  }

  return baseStyle;
}

/**
 * Convert story connections to React Flow edges
 */
export function convertToReactFlowEdges(
  storyNodes: Map<string, StoryNode>,
  unlockedConnections: readonly string[],
  reduceMotion = false,
): Edge[] {
  const edges: Edge[] = [];

  for (const node of storyNodes.values()) {
    for (const connection of node.connections || []) {
      const edgeId = `${node.id}-${connection.targetId}`;
      const isUnlocked = unlockedConnections.includes(edgeId);

      edges.push({
        id: edgeId,
        source: node.id,
        target: connection.targetId,
        ariaRole: 'presentation',
        // React Flow's runtime treats null as the explicit opt-out for its
        // generated "Edge from …" label, though its public type omits null.
        ariaLabel: null as unknown as string,
        domAttributes: {
          'aria-hidden': true,
          'aria-roledescription': undefined,
        },
        deletable: false,
        focusable: false,
        selectable: false,
        type: getEdgeType(connection.type),
        animated: !reduceMotion && isUnlocked && connection.type === 'recursive',
        label: connection.label,
        style: isUnlocked
          ? getEdgeStyle(connection.type)
          : {
              stroke: '#3b4a54',
              strokeWidth: 1,
              strokeDasharray: '5,5',
              opacity: 0.35,
            },
        markerEnd: {
          type: 'arrowclosed' as MarkerType,
          color: isUnlocked ? getEdgeColor(connection.type) : '#3b4a54',
        },
        labelStyle: {
          fill: '#e0e0e0',
          fontWeight: 600,
          fontSize: 11,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        labelBgStyle: {
          fill: '#0a0e12',
          fillOpacity: 0.95,
          stroke: '#3b4a54',
          strokeWidth: 1,
        },
        labelBgPadding: [8, 6] as [number, number],
        labelBgBorderRadius: 2,
      });

      // Add bidirectional edge if specified
      if (connection.bidirectional) {
        edges.push({
          id: `${connection.targetId}-${node.id}`,
          source: connection.targetId,
          target: node.id,
          ariaRole: 'presentation',
          // See the forward-edge accessibility note above.
          ariaLabel: null as unknown as string,
          domAttributes: {
            'aria-hidden': true,
            'aria-roledescription': undefined,
          },
          deletable: false,
          focusable: false,
          selectable: false,
          type: getEdgeType(connection.type),
          animated: !reduceMotion && isUnlocked && connection.type === 'recursive',
          style: isUnlocked
            ? getEdgeStyle(connection.type)
            : {
                stroke: '#3b4a54',
                strokeWidth: 1,
                strokeDasharray: '5,5',
                opacity: 0.35,
              },
          markerEnd: {
            type: 'arrowclosed' as MarkerType,
            color: isUnlocked ? getEdgeColor(connection.type) : '#3b4a54',
          },
        });
      }
    }
  }

  return edges;
}
