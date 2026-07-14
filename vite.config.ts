import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
    // Public releases omit maps. A future monitoring integration must upload
    // private maps during CI and remove them before publishing dist.
    sourcemap: false,
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
