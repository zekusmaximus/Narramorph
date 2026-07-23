// eslint-disable-next-line import/no-named-as-default -- axe-core's default export is AxeBuilder
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** A returning reader with onboarding seen and the 2D (non-WebGL) map forced. */
async function prepareReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-a11y-audit-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-a11y-audit-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Fails on any serious/critical WCAG 2.1 A/AA violation on the current page state. */
async function expectNoSeriousViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const seriousOrWorse = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const summary = seriousOrWorse.map((v) => `${v.id} (${v.impact}) — ${v.help}`);
  expect(summary, summary.join('\n')).toEqual([]);
}

test('landing / 2D story map has no serious accessibility violations', async ({ page }) => {
  await prepareReader(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('open reader has no serious accessibility violations', async ({ page }) => {
  await prepareReader(page);
  await page.goto('/');
  await page.locator('.react-flow__node[data-id="arch-L1"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByTestId('story-passage')).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('progress dialog has no serious accessibility violations', async ({ page }) => {
  await prepareReader(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Open reading progress/ }).click();
  await expect(page.getByRole('dialog', { name: 'Your path through the archive' })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('settings dialog has no serious accessibility violations', async ({ page }) => {
  await prepareReader(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open reader settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Shape the reading room' })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('the expanded passage list has no serious accessibility violations', async ({ page }) => {
  // The linear passage list is shared (via PassageListNav) with the 3D SceneNodeList; scanning it
  // on the 2D map covers the same component reliably, without depending on WebGL/GPU availability.
  await prepareReader(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  // Expand by keyboard (a keyboard/SR reader's path), avoiding any pointer-overlap flakiness.
  await page.getByRole('button', { name: 'INDEX' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Passage list' })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('the reader stays operable under forced colours', async ({ page }) => {
  await prepareReader(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await page.locator('.react-flow__node[data-id="arch-L1"]').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const close = page.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeVisible();
  // The control remains operable (not just present) with system colours forced.
  await close.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
