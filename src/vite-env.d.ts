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

  // Type-safe glob imports
  glob: {
    <Module = Record<string, unknown>>(
      pattern: string | string[],
      options?: {
        as?: 'raw' | 'url';
        eager?: boolean;
        import?: string;
        exhaustive?: boolean;
      },
    ): Record<string, Module>;
  };
}
