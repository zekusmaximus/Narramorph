import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

const RELEVANT_FAILURE =
  /content security policy|blocked.*blob|worker module|troika|webgl.*(?:fail|error)|context lost|webglcontextlost|unhandled rejection/i;

async function prepare(page: Page): Promise<string[]> {
  const failures: string[] = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error' && RELEVANT_FAILURE.test(message.text())) {
      failures.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  return failures;
}

test('3D opens under the production CSP and recovers from context loss', async ({ page }) => {
  const failures = await prepare(page);
  await page.goto('/');

  const response = await page.request.get('/');
  expect(response.headers()['content-security-policy']).toContain("script-src 'self';");
  expect(response.headers()['content-security-policy']).not.toMatch(/script-src[^;]*blob:/);

  await page.getByRole('button', { name: 'Experimental 3D view' }).click();
  const scene = page.getByTestId('three-dimensional-scene');
  await expect(scene).toHaveAttribute('data-scene-ready', 'true');

  const passageList = page.getByRole('navigation', { name: 'Passage list' });
  await expect(passageList).toBeVisible();
  await expect(passageList.getByRole('button', { name: /First Documentation/ })).toBeEnabled();
  expect(failures).toEqual([]);

  await scene.locator('canvas').dispatchEvent('webglcontextlost');
  await expect(page.getByTestId('webgl-fallback-status')).toContainText(
    'The 2D story map is ready instead.',
  );
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Experimental 3D view' })).toBeVisible();
});
