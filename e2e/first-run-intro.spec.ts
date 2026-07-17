import { expect, test, type Page } from '@playwright/test';

const INTRO_TITLE = 'How to read Narramorph';

/** A genuinely first-run browser: storage cleared, onboarding NOT pre-seen. */
async function prepareFirstRun(
  page: Page,
  options: { reducedMotion?: boolean } = {},
): Promise<void> {
  if (options.reducedMotion) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
  await page.addInitScript(() => {
    // Clear only on the first load of the context, not on reload — otherwise the
    // reload below would wipe the intro-seen marker we are trying to assert.
    if (!localStorage.getItem('narramorph-first-run-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-first-run-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    // Deliberately leave the intro-seen key unset so the first-run intro shows.
  });
}

test('first run shows an accessible intro covering how to begin, interact, path, and revisit', async ({
  page,
}) => {
  await prepareFirstRun(page);
  await page.goto('/');

  const intro = page.getByRole('dialog', { name: INTRO_TITLE });
  await expect(intro).toBeVisible();
  await expect(intro).toHaveAttribute('aria-modal', 'true');

  // All four required onboarding concepts are explained in text.
  await expect(intro.getByRole('heading', { name: 'Choose a perspective to begin' })).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Open a fragment to read it' })).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Your path shapes the story' })).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Return and revisit' })).toBeVisible();

  // The animated node demo carries its meaning in text, not only motion.
  await expect(intro.getByTestId('intro-node-demo')).toBeVisible();

  // Skip dismisses the intro and reveals the perspective picker underneath.
  await intro.getByRole('button', { name: 'Skip introduction' }).click();
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Enter the story through The Archaeologist' }),
  ).toBeVisible();

  // A minimal seen-version was persisted; the intro does not re-show on reload.
  const seen = await page.evaluate(() => localStorage.getItem('narramorph-intro-seen-version'));
  expect(seen).not.toBeNull();
  expect(Number.parseInt(seen ?? '', 10)).toBeGreaterThanOrEqual(1);

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Enter the story through The Archaeologist' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toHaveCount(0);
});

test('the guide can be replayed on demand from the Help entry', async ({ page }) => {
  await prepareFirstRun(page);
  await page.goto('/');

  const intro = page.getByRole('dialog', { name: INTRO_TITLE });
  await expect(intro).toBeVisible();
  await intro.getByTestId('intro-primary-action').click();
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toHaveCount(0);

  // Reopen from the persistent Help "?" in the header.
  await page.getByRole('button', { name: /reader.s guide/i }).click();
  const replay = page.getByRole('dialog', { name: INTRO_TITLE });
  await expect(replay).toBeVisible();
  await expect(replay).toHaveAttribute('data-intro-origin', 'help');
  await expect(replay.getByTestId('intro-primary-action')).toHaveText('Back to the archive');

  // Escape closes it (keyboard completion path).
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toHaveCount(0);
});

test('reduced-motion readers receive the same static explanation', async ({ page }) => {
  await prepareFirstRun(page, { reducedMotion: true });
  await page.goto('/');

  const intro = page.getByRole('dialog', { name: INTRO_TITLE });
  await expect(intro).toBeVisible();

  // The demo renders its reduced-motion equivalent, and all four concepts remain.
  await expect(intro.getByTestId('intro-node-demo')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(intro.getByRole('heading', { name: 'Choose a perspective to begin' })).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Return and revisit' })).toBeVisible();
});
