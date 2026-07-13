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

/**
 * Get edge color based on connection type - Cyberpunk palette
 */
export function getEdgeColor(connectionType: ConnectionType): string {
  const colors: Record<ConnectionType, string> = {
    temporal: '#00e5ff', // Cyan - time flow
    consciousness: '#7c4dff', // Purple - neural bridge
    recursive: '#39ff14', // Green - loop
    hidden: '#455a64', // Dark gray - locked
  };
  return colors[connectionType] || '#455a64';
}

/**
 * Get edge style based on connection type
 */
export function getEdgeStyle(connectionType: ConnectionType): CSSProperties {
  const baseColor = getEdgeColor(connectionType);

  const baseStyle: CSSProperties = {
    strokeWidth: 2,
    stroke: baseColor,
    filter: `drop-shadow(0 0 4px ${baseColor})`,
  };

  if (connectionType === 'recursive') {
    return {
      ...baseStyle,
      strokeDasharray: '8,4',
      strokeWidth: 2.5,
      filter: `drop-shadow(0 0 6px ${baseColor})`,
    };
  }

  if (connectionType === 'consciousness') {
    return {
      ...baseStyle,
      strokeWidth: 3,
      filter: `drop-shadow(0 0 8px ${baseColor}) drop-shadow(0 0 12px ${baseColor}40)`,
    };
  }

  if (connectionType === 'hidden') {
    return {
      ...baseStyle,
      strokeDasharray: '2,6',
      strokeWidth: 1,
      opacity: 0.3,
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
          : ({
              stroke: '#455a64',
              strokeWidth: 1,
              strokeDasharray: '5,5',
              opacity: 0.35,
            } as CSSProperties),
        markerEnd: {
          type: 'arrowclosed' as MarkerType,
          color: isUnlocked ? getEdgeColor(connection.type) : '#455a64',
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
          stroke: '#455a64',
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
            : ({
                stroke: '#455a64',
                strokeWidth: 1,
                strokeDasharray: '5,5',
                opacity: 0.35,
              } as CSSProperties),
          markerEnd: {
            type: 'arrowclosed' as MarkerType,
            color: isUnlocked ? getEdgeColor(connection.type) : '#455a64',
          },
        });
      }
    }
  }

  return edges;
}
