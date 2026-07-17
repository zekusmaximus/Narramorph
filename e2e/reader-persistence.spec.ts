import { expect, test, type Page } from '@playwright/test';

/** A returning reader with onboarding already seen and 2D forced. */
async function prepareReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-persistence-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-persistence-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

async function openProgressDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Open reading progress/ }).click();
  await expect(page.getByRole('dialog', { name: 'Your path through the archive' })).toHaveCount(1);
}

test('a reader can export a save, start a new journey, and import the save back', async ({
  page,
}) => {
  await prepareReader(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();

  // Read one passage so there is progress to export, then return to the map.
  await page.locator('.react-flow__node[data-id="arch-L1"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await openProgressDialog(page);
  const passagesOpened = page.getByTestId('progress-passages-opened');
  await expect(passagesOpened).toContainText('1/');

  // Export the machine-readable save file (a real download; nothing is uploaded).
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export save file' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  const savePath = await download.path();
  expect(savePath).toBeTruthy();

  // Starting a new journey is guarded: cancel leaves progress intact.
  await page.getByRole('button', { name: 'Start a new journey' }).click();
  await expect(page.getByRole('group', { name: 'Confirm new journey' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('group', { name: 'Confirm new journey' })).toHaveCount(0);
  await expect(passagesOpened).toContainText('1/');

  // Confirming clears reading progress (preferences are kept).
  await page.getByRole('button', { name: 'Start a new journey' }).click();
  await page.getByRole('button', { name: 'Clear and start new' }).click();
  await expect(passagesOpened).toHaveText(/^0\//);
  await expect(page.getByRole('status').filter({ hasText: 'Started a new journey' })).toBeVisible();

  // Importing the exported save restores the journey after a guarded confirm.
  await page.getByRole('dialog').locator('input[type="file"]').setInputFiles(savePath);
  await expect(page.getByRole('group', { name: 'Confirm import' })).toBeVisible();
  await page.getByRole('button', { name: 'Replace my journey' }).click();
  await expect(passagesOpened).toContainText('1/');
});
