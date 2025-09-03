import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Prepares test environment and validates services are ready
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test environment setup...');

  // Launch browser for setup validation
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Validate frontend is ready
    console.log('📱 Validating frontend service...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Frontend service ready');

    // Validate backend worker is ready
    console.log('🔧 Validating backend worker...');
    const response = await page.request.get('http://localhost:8787/health');
    if (!response.ok()) {
      throw new Error(`Backend health check failed: ${response.status()}`);
    }
    console.log('✅ Backend worker ready');

    // Clear any existing test data
    console.log('🧹 Clearing test data...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ E2E test environment ready');
  } catch (error) {
    console.error('❌ E2E setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
