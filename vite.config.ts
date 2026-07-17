import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// The opt-in error-monitoring SDK (Batch 8.3) is bundled only when a DSN is set at
// build time; without it the dynamic import is dead-code-eliminated. We isolate the
// SDK in its own lazily-loaded chunk only in that DSN build, so default/gate builds
// produce no empty orphan chunk.
const monitoringConfigured = Boolean(process.env.VITE_SENTRY_DSN);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: process.env.PLAYWRIGHT_TEST !== '1',
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    manifest: true,
    // Public releases omit maps (bundle:check enforces publicSourceMapCount: 0).
    // For error monitoring (Batch 8.3), CI sets SENTRY_UPLOAD=true to emit HIDDEN
    // maps (not referenced by the JS), then scripts/upload-sourcemaps.mjs uploads
    // them privately to Sentry and DELETES them from dist before publishing. The
    // default (no flag) stays false so local builds never ship or measure maps.
    sourcemap: process.env.SENTRY_UPLOAD === 'true' ? 'hidden' : false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const modulePath = id.replace(/\\/g, '/');
          if (!modulePath.includes('/node_modules/')) {
            return undefined;
          }
          if (
            modulePath.includes('/node_modules/react/') ||
            modulePath.includes('/node_modules/react-dom/') ||
            modulePath.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (
            modulePath.includes('/node_modules/zustand/') ||
            modulePath.includes('/node_modules/immer/')
          ) {
            return 'state-vendor';
          }
          if (monitoringConfigured && modulePath.includes('/node_modules/@sentry/')) {
            // Isolate the opt-in error-monitoring SDK so it is lazily loaded (only
            // after consent) and never merged into the initial bundle.
            return 'sentry-vendor';
          }
          if (modulePath.includes('/node_modules/framer-motion/')) {
            return 'animation-vendor';
          }
          if (modulePath.includes('/node_modules/@xyflow/')) {
            return 'flow-vendor';
          }
          return undefined;
        },
      },
    },
    // Increase chunk size warning limit for better performance
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/stores': resolve(__dirname, 'src/stores'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/pages': resolve(__dirname, 'src/pages'),
      '@/data': resolve(__dirname, 'src/data'),
    },
  },
  // Optimize dependencies for faster cold starts
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'immer', '@xyflow/react', 'framer-motion', 'clsx'],
  },
});
