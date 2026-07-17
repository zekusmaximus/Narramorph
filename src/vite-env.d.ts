/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  /** Sentry DSN (Batch 8.3). Absent → error reporting is fully inert. */
  readonly VITE_SENTRY_DSN?: string;
  /** Release identity for error reports, e.g. `narramorph@0.1.0+<sha>` (CI-set). */
  readonly VITE_APP_RELEASE?: string;
  // Add additional environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment Window interface for development-only properties
interface Window {
  performanceMonitor?: import('./utils/performanceMonitor').PerformanceMonitor;
}
