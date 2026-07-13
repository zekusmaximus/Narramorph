import type { CharacterType, StoryNode, VisitRecord } from '@/types';

interface Point {
  x: number;
  y: number;
}
export interface AtmosphereZone extends Point {
  id: string;
  character: CharacterType;
}
export interface ReadingPathPoint extends Point {
  key: string;
  character: CharacterType;
  opacity: number;
}
export interface NeuralNetworkPoint extends Point {
  id: string;
}
export interface DiscoveryPoint extends Point {
  key: string;
  character: CharacterType;
}
export interface NodeMapAtmosphereModel {
  zones: AtmosphereZone[];
  readingPathPoints: ReadingPathPoint[];
  neuralNetworkPoints: NeuralNetworkPoint[];
  discoveryPoints: DiscoveryPoint[];
}

export function buildNodeMapAtmosphereModel(input: {
  storyNodes: Map<string, StoryNode>;
  readingPath: string[];
  visitedNodes: Record<string, VisitRecord>;
}): NodeMapAtmosphereModel {
  const zones = Array.from(input.storyNodes.values()).map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    character: node.character,
  }));

  const readingPathPoints = input.readingPath
    .slice(-5)
    .map((nodeId, index) => {
      const node = input.storyNodes.get(nodeId);
      if (node === undefined) {
        return null;
      }
      return {
        key: `${nodeId}-${index}`,
        x: node.position.x,
        y: node.position.y,
        character: node.character,
        opacity: 0.1 + index * 0.1,
      };
    })
    .filter((point): point is ReadingPathPoint => point !== null);

  const neuralNetworkPoints = Array.from(input.storyNodes.values())
    .filter((node) => node.character === 'algorithm' && input.visitedNodes[node.id] !== undefined)
    .map((node) => ({ id: node.id, x: node.position.x, y: node.position.y }));

  const discoveryPoints = Object.keys(input.visitedNodes)
    .map((nodeId) => {
      const node = input.storyNodes.get(nodeId);
      if (node === undefined) {
        return null;
      }
      return { key: nodeId, x: node.position.x, y: node.position.y, character: node.character };
    })
    .filter((point): point is DiscoveryPoint => point !== null);

  return { zones, readingPathPoints, neuralNetworkPoints, discoveryPoints };
}
