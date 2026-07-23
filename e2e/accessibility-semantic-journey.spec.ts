import { expect, test, type Locator, type Page } from '@playwright/test';

/** A returning reader with onboarding seen and the 2D (non-WebGL) map forced. */
async function prepareReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-a11y-journey-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-a11y-journey-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

async function tabUntilFocused(page: Page, target: Locator, limit = 12): Promise<void> {
  for (let step = 0; step < limit; step += 1) {
    if (await target.evaluate((el) => el === document.activeElement)) {
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error(`Focus did not reach the target after ${limit} Tab presses.`);
}

test('a reader completes a journey through the linear passage list, without the graph or WebGL', async ({
  page,
}) => {
  await prepareReader(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();

  // This is the DOM 2D surface — the WebGL view is not present.
  await expect(page.getByRole('application', { name: 'Story map (3D view)' })).toHaveCount(0);

  // Expand the linear passage list by keyboard (a non-spatial alternative to graph traversal).
  const indexToggle = page.getByRole('button', { name: 'INDEX' });
  await indexToggle.focus();
  await page.keyboard.press('Enter');
  await expect(indexToggle).toHaveAttribute('aria-pressed', 'true');

  const list = page.getByRole('navigation', { name: 'Passage list' });
  await expect(list).toBeVisible();

  // Open the opening passage from the list, by keyboard — no graph node is ever clicked.
  const opening = list.getByRole('button', { name: /First Documentation/ });
  await opening.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog');
  const title = page.locator('#story-view-title');
  await expect(dialog).toBeVisible();
  await expect(title).toHaveText('First Documentation');

  // Continue the journey by following a branch from inside the reader — still keyboard-only.
  const acceptancePath = dialog.getByRole('button', { name: 'Follow Acceptance Path' });
  await tabUntilFocused(page, acceptancePath);
  await page.keyboard.press('Enter');
  await expect(title).toHaveText('Acceptance Path');

  // The list stays authoritative: back on the map it shows the just-read passage as opened.
  await dialog.getByRole('button', { name: 'Return to map' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // The list was expanded earlier and stays open across the reader round-trip; only
  // expand again if something collapsed it, so we never toggle an open list shut.
  if ((await indexToggle.getAttribute('aria-pressed')) !== 'true') {
    await indexToggle.focus();
    await page.keyboard.press('Enter');
  }
  await expect(list.getByRole('button', { name: /First Documentation/ })).toContainText('Opened');
});
