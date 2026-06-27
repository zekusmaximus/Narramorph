/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  // Add additional environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment Window interface for development-only properties
interface Window {
  performanceMonitor?: import('./utils/performanceMonitor').PerformanceMonitor;
}
