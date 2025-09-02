/**
 * Global test setup for Jazz testing environment
 * This file is automatically run before all tests via vitest.config.ts
 */

import { beforeEach } from 'vitest';

// Global test configuration
beforeEach(() => {
  // Reset any global state if needed
  // Individual tests will call setupJazzTestEnvironment() as needed
});
