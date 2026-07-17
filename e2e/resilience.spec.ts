import { expect, test, type Page } from '@playwright/test';

/**
 * Resilience pass (Batch 8.5): the product must remain readable when optional assets
 * fail, and keep working offline once loaded. Budgets/lazy-loading are covered by
 * performance-boundaries; every ending by phase-3-path-coverage; the WebGL fallback
 * and missing-story recovery by reader-journey; the large-history bound by
 * visitEvents.test (the visit-log cap). These specs fill the optional-asset-failure
 * and offline gaps.
 */
async function prepare(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('narramorph-3d-mode', 'false');
    // Onboarding already seen so first-run journeys aren't blocked by the intro modal.
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

async function openFirstPassage(page: Page): Promise<void> {
  const node = page.locator('.react-flow__node[data-id="arch-L1"]');
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByTestId('story-passage')).toBeVisible();
}

async function closeStory(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('the reader stays readable when the self-hosted fonts fail to load', async ({ page }) => {
  await prepare(page);
  // Block every font request; text must still render via the system-font fallback.
  await page.route('**/fonts/**', (route) => route.abort());
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await openFirstPassage(page);
  await expect(page.getByTestId('story-passage')).not.toBeEmpty();
});

test('the 2D reader stays readable when the optional 3D chunk fails to load', async ({ page }) => {
  await prepare(page);
  // The 3D view is an opt-in enhancement; its chunk failing must not break the 2D path.
  await page.route('**/*NarromorphCanvas*', (route) => route.abort());
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await openFirstPassage(page);
});

test('already-loaded content stays readable offline (no first-party network calls)', async ({
  page,
}) => {
  await prepare(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();

  // Load the passage's lazy chunk once, then drop the connection.
  await openFirstPassage(page);
  await closeStory(page);
  await page.context().setOffline(true);
  try {
    // Re-opening reads from the already-loaded module — no network fetch required.
    await openFirstPassage(page);
  } finally {
    await page.context().setOffline(false);
  }
});

test('the reader survives tab backgrounding without losing the open passage', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();

  await openFirstPassage(page);
  const variationBefore = await page.getByRole('dialog').getAttribute('data-variation-id');

  await page.evaluate(() => {
    for (const state of ['hidden', 'visible']) {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }
  });

  // The open passage and its selected variation are unchanged after backgrounding.
  await expect(page.getByTestId('story-passage')).toBeVisible();
  expect(await page.getByRole('dialog').getAttribute('data-variation-id')).toBe(variationBefore);
});
