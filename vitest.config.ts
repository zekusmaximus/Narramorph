import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: 'jsdom',
    // setupFiles: './tests/setup.ts',
    css: true,
    // Test file discovery pattern
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Pool configuration - use threads for better compatibility
    pool: 'threads',
    // Server configuration
    server: {
      deps: {
        inline: ['zustand'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        'src/main.tsx',
        'dist/',
        'build/',
        'coverage/',
        '.eslintrc.json',
        'vite.config.ts',
        'vitest.config.ts',
        'tailwind.config.js',
        'postcss.config.js',
      ],
      include: [
        'src/domain/**/*.ts',
        'src/repositories/**/*.ts',
        'src/stores/storyStore.ts',
        'src/utils/{conditionEvaluator,contentLoader,l3Assembly,nodeUtils,unlockEvaluator,validateRuntimeContent,variationLoader}.ts',
        'src/components/StoryView/storyPresentation.ts',
        'src/components/NodeMap/{atmospherePresentation,edgeUtils,storyNodePresentation}.ts',
      ],
      // Vitest reads these keys directly; a nested Jest-style `global` key is treated as a
      // file glob, matches nothing, and silently disables enforcement.
      thresholds: {
        branches: 75,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
    // Mock browser APIs that might be used in tests
    env: {
      NODE_ENV: 'test',
    },
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
});
