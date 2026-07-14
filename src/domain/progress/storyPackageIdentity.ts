import identity from '@/config/eternalReturnPackageIdentity.json';
import type { StoryPackageIdentity } from '@/types';

/**
 * Exact Contract v1 identity of the story package shipped by this application build.
 * The package builder is the authority for this generated fingerprint.
 */
export const CURRENT_STORY_PACKAGE: Readonly<StoryPackageIdentity> = Object.freeze({
  storyId: identity.storyId,
  storyVersion: identity.storyVersion,
  schemaVersion: identity.schemaVersion,
  contentHash: identity.contentHash,
});
