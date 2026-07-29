import { defineConfig } from '@playwright/test';

const sharedUse = {
  baseURL: 'http://127.0.0.1:4174',
  trace: 'retain-on-failure' as const,
  screenshot: 'only-on-failure' as const,
  video: 'retain-on-failure' as const,
};

/**
 * Narrow proxy matrix for the optional 3D enhancement. These projects validate
 * browser-engine, viewport, orientation, and touch contracts; they are not
 * substitutes for branded Safari/Firefox or physical mobile GPU measurements.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'three-dimensional-proxy.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  outputDir: 'output/playwright/3d-proxy-results',
  reporter: [
    ['line'],
    ['html', { outputFolder: 'output/playwright/3d-proxy-report', open: 'never' }],
  ],
  projects: [
    {
      name: 'chromium-desktop-proxy',
      use: {
        ...sharedUse,
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'firefox-desktop-proxy',
      use: {
        ...sharedUse,
        browserName: 'firefox',
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'webkit-desktop-proxy',
      use: {
        ...sharedUse,
        browserName: 'webkit',
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'chromium-mobile-proxy',
      use: {
        ...sharedUse,
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'webkit-mobile-proxy',
      use: {
        ...sharedUse,
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'npm run preview:test:3d-proxy',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
