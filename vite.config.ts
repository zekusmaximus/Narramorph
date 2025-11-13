import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and React DOM into separate chunk
          'react-vendor': ['react', 'react-dom'],
          // Split Zustand and Immer into state management chunk
          'state-vendor': ['zustand', 'immer'],
          // Split React Flow into separate chunk for better caching
          'flow-vendor': ['@xyflow/react'],
          // Split Framer Motion into separate chunk
          'animation-vendor': ['framer-motion'],
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
  define: {
    // Ensure process.env is available for environment variables
    'process.env': process.env,
  },
  // Optimize dependencies for faster cold starts
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'immer', '@xyflow/react', 'framer-motion', 'clsx'],
  },
});
