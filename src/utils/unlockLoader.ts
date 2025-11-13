/**
 * Unlock Configuration Loader
 *
 * Loads unlock configuration files using Vite glob import
 */

import type { UnlockConfigFile, NodeUnlockConfig } from '@/types/Unlock';

/**
 * Load unlock configuration using Vite glob import
 */
const unlockConfigFiles = import.meta.glob<UnlockConfigFile>(
  '/src/data/stories/*/unlock-config.json',
  { eager: true, import: 'default' },
);

/**
 * Load unlock configuration for a story
 *
 * @param storyId - Story identifier (e.g., "eternal-return")
 * @returns Map of nodeId to unlock config
 */
export function loadUnlockConfig(storyId: string): Map<string, NodeUnlockConfig> {
  const configMap = new Map<string, NodeUnlockConfig>();

  // Find matching config file
  for (const [path, configFile] of Object.entries(unlockConfigFiles)) {
    if (path.includes(`/${storyId}/`)) {
      // Add all node configs to map
      for (const nodeConfig of configFile.nodes) {
        configMap.set(nodeConfig.nodeId, nodeConfig);
      }

      console.log(`[UnlockLoader] Loaded ${configFile.nodes.length} unlock configs for ${storyId}`);
      return configMap;
    }
  }

  console.warn(`[UnlockLoader] No unlock config found for story: ${storyId}`);
  return configMap;
}
