import { journeyExportFilename } from '@/domain/export/journeyExport';
import { useStoryStore } from '@/stores';
import type { ImportProgressResult } from '@/types';
import { downloadTextFile } from '@/utils/journeyDownload';

export interface JourneySaveFile {
  /** Download the machine-readable JSON save of the current journey (this device → another). */
  exportSaveFile: () => void;
  /** Import a machine-readable save; migration-aware, leaves the current journey intact on failure. */
  importSaveFile: (data: string) => ImportProgressResult;
}

/**
 * Machine-readable save-file actions (Phase 7.4). This is the round-trippable
 * data file — distinct from the literary Markdown/print export in
 * {@link useJourneyExport}. The export builds on-device and downloads locally
 * (nothing is uploaded); the import routes through the store's migration-aware
 * `importProgress`, so an older-schema save file is migrated up on import.
 */
export function useJourneySaveFile(): JourneySaveFile {
  const exportProgress = useStoryStore((state) => state.exportProgress);
  const importProgress = useStoryStore((state) => state.importProgress);
  const storyTitle = useStoryStore((state) => state.storyData?.metadata?.title ?? 'Narramorph');

  const exportSaveFile = (): void => {
    const exportedAt = new Date().toISOString();
    downloadTextFile(
      journeyExportFilename(storyTitle, exportedAt, 'json'),
      'application/json',
      exportProgress(),
    );
  };

  return { exportSaveFile, importSaveFile: importProgress };
}
