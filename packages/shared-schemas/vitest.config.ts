import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts'],
    testTimeout: 10000, // Jazz tests can be slower due to sync
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
