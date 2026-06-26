/**
 * Resolve a story-relative content definition to the absolute key produced by Vite's glob import.
 */
export function resolveStoryContentPath(storyId: string, contentFile: string): string {
  const normalizedStoryId = storyId.trim();
  const normalizedContentFile = contentFile.trim().replace(/\\/g, '/').replace(/^\/+/, '');

  if (!normalizedStoryId) {
    throw new Error('Story id is required to resolve a content path');
  }
  if (!normalizedContentFile) {
    throw new Error('Content file is required to resolve a content path');
  }
  if (normalizedContentFile.split('/').includes('..')) {
    throw new Error(`Content path cannot traverse outside its story: ${contentFile}`);
  }

  return `/src/data/stories/${normalizedStoryId}/${normalizedContentFile}`;
}
