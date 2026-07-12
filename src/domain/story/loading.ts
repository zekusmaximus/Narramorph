import type { Connection, MapViewport, StoryData, StoryNode, UserProgress } from '@/types';
import type { NodeUnlockConfig } from '@/types/Unlock';

export interface StoryLoadingDependencies {
  loadStoryContent: (storyId: string) => Promise<StoryData>;
  loadUnlockConfig: (storyId: string) => Map<string, NodeUnlockConfig>;
  createInitialProgress: () => UserProgress;
}

export interface LoadedStoryState {
  storyData: StoryData;
  nodes: Map<string, StoryNode>;
  connections: Map<string, Connection>;
  progress: UserProgress;
  viewport: Pick<MapViewport, 'bounds' | 'center'> | null;
  unlockConfigs: Map<string, NodeUnlockConfig>;
}

export type StoryLoadingResult =
  | { status: 'loaded'; state: LoadedStoryState }
  | { status: 'failed'; error: Error; cause: unknown };

function calculateViewport(storyData: StoryData): Pick<MapViewport, 'bounds' | 'center'> | null {
  if (storyData.nodes.length === 0) {
    return null;
  }

  const positions = storyData.nodes.map((node) => node.position);
  const minX = Math.min(...positions.map((position) => position.x)) - 100;
  const maxX = Math.max(...positions.map((position) => position.x)) + 100;
  const minY = Math.min(...positions.map((position) => position.y)) - 100;
  const maxY = Math.max(...positions.map((position) => position.y)) + 100;

  return {
    bounds: { minX, maxX, minY, maxY },
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
  };
}

function createStoryLoadingError(error: unknown): Error {
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (error instanceof Error && error.name === 'ContentLoadError') {
    return new Error(`Story loading failed: ${message}`);
  }

  return new Error(`Unexpected error loading story: ${message}`);
}

/**
 * Loads and prepares the complete state transition for a story. All browser and
 * file-loader boundaries are injected, and callers only apply a successful
 * result, preventing partially populated store state on failure.
 */
export async function loadStoryState(
  storyId: string,
  dependencies: StoryLoadingDependencies,
): Promise<StoryLoadingResult> {
  try {
    const storyData = await dependencies.loadStoryContent(storyId);
    const unlockConfigs = dependencies.loadUnlockConfig(storyId);

    return {
      status: 'loaded',
      state: {
        storyData,
        nodes: new Map(storyData.nodes.map((node) => [node.id, node])),
        connections: new Map(
          (storyData.connections ?? []).map((connection) => [connection.id, connection]),
        ),
        progress: dependencies.createInitialProgress(),
        viewport: calculateViewport(storyData),
        unlockConfigs,
      },
    };
  } catch (cause) {
    return {
      status: 'failed',
      error: createStoryLoadingError(cause),
      cause,
    };
  }
}
