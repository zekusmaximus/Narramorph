import type { Edge, MarkerType } from '@xyflow/react';
import type { StoryNode, ConnectionType, UserProgress } from '@/types';

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
 * Get edge color based on connection type
 */
export function getEdgeColor(connectionType: ConnectionType): string {
  const colors: Record<ConnectionType, string> = {
    temporal: '#3b82f6', // blue
    consciousness: '#10b981', // green
    recursive: '#ef4444', // red
    hidden: '#9ca3af', // gray
  };
  return colors[connectionType] || '#9ca3af';
}

/**
 * Get edge style based on connection type
 */
export function getEdgeStyle(connectionType: ConnectionType): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    strokeWidth: 2,
    stroke: getEdgeColor(connectionType),
  };

  if (connectionType === 'recursive') {
    return {
      ...baseStyle,
      strokeDasharray: '5,5',
    };
  }

  if (connectionType === 'hidden') {
    return {
      ...baseStyle,
      strokeDasharray: '2,4',
      opacity: 0.5,
    };
  }

  return baseStyle;
}

/**
 * Convert story connections to React Flow edges
 */
export function convertToReactFlowEdges(
  storyNodes: Map<string, StoryNode>,
  _progress: UserProgress
): Edge[] {
  const edges: Edge[] = [];

  for (const node of storyNodes.values()) {
    for (const connection of node.connections || []) {
      const edgeId = `${node.id}-${connection.targetId}`;

      // For now, show all connections - later we can add reveal logic
      // const isRevealed = progress.unlockedConnections.includes(edgeId);
      // if (!isRevealed && connection.revealConditions) continue;

      edges.push({
        id: edgeId,
        source: node.id,
        target: connection.targetId,
        type: getEdgeType(connection.type),
        animated: connection.type === 'recursive',
        label: connection.label,
        style: getEdgeStyle(connection.type),
        markerEnd: {
          type: 'arrowclosed' as MarkerType,
          color: getEdgeColor(connection.type),
        },
        labelStyle: {
          fill: '#374151',
          fontWeight: 600,
          fontSize: 12,
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.95,
        },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
      });

      // Add bidirectional edge if specified
      if (connection.bidirectional) {
        edges.push({
          id: `${connection.targetId}-${node.id}`,
          source: connection.targetId,
          target: node.id,
          type: getEdgeType(connection.type),
          animated: connection.type === 'recursive',
          style: getEdgeStyle(connection.type),
          markerEnd: {
            type: 'arrowclosed' as MarkerType,
            color: getEdgeColor(connection.type),
          },
        });
      }
    }
  }

  return edges;
}
