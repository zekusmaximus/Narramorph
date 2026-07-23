import { expect, test, type Page } from '@playwright/test';

const INTRO_TITLE = 'How to read Narramorph';
const HELP_BUTTON = /reader.s guide/i;

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
    // Deliberately leave the intro-seen key unset to prove the guide never auto-opens.
  });
}

test('first run shows the perspective picker; the guide is on demand and covers begin, interact, path, and revisit', async ({
  page,
}) => {
  await prepareFirstRun(page);
  await page.goto('/');

  // The opening picker IS the onboarding (Accession): the guide never auto-opens,
  // even on a genuinely first-run browser.
  await expect(
    page.getByRole('button', { name: 'Enter the story through The Archaeologist' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toHaveCount(0);

  // The guide opens on demand from the persistent Help "?" in the header.
  await page.getByRole('button', { name: HELP_BUTTON }).click();
  const intro = page.getByRole('dialog', { name: INTRO_TITLE });
  await expect(intro).toBeVisible();
  await expect(intro).toHaveAttribute('aria-modal', 'true');

  // All four required onboarding concepts are explained in text.
  await expect(intro.getByRole('heading', { name: 'Choose a perspective to begin' })).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Open a passage to read it' })).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Your path shapes the story' })).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Return and revisit' })).toBeVisible();

  // The animated node demo carries its meaning in text, not only motion.
  await expect(intro.getByTestId('intro-node-demo')).toBeVisible();

  // Closing the guide returns to the perspective picker underneath.
  await intro.getByTestId('intro-primary-action').click();
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Enter the story through The Archaeologist' }),
  ).toBeVisible();

  // Arriving at the archive records the current intro version as seen, keeping the
  // version gate consistent; the guide still does not open on reload.
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
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toHaveCount(0);

  // Open from the persistent Help "?" in the header.
  await page.getByRole('button', { name: HELP_BUTTON }).click();
  const replay = page.getByRole('dialog', { name: INTRO_TITLE });
  await expect(replay).toBeVisible();
  await expect(replay).toHaveAttribute('data-intro-origin', 'help');
  await expect(replay.getByTestId('intro-primary-action')).toHaveText('Back to the archive');

  // Escape closes it (keyboard completion path), and it can be reopened.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toHaveCount(0);
  await page.getByRole('button', { name: HELP_BUTTON }).click();
  await expect(page.getByRole('dialog', { name: INTRO_TITLE })).toBeVisible();
});

test('reduced-motion readers receive the same static explanation', async ({ page }) => {
  await prepareFirstRun(page, { reducedMotion: true });
  await page.goto('/');

  await page.getByRole('button', { name: HELP_BUTTON }).click();
  const intro = page.getByRole('dialog', { name: INTRO_TITLE });
  await expect(intro).toBeVisible();

  // The demo renders its reduced-motion equivalent, and all four concepts remain.
  await expect(intro.getByTestId('intro-node-demo')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(intro.getByRole('heading', { name: 'Choose a perspective to begin' })).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Return and revisit' })).toBeVisible();
});
