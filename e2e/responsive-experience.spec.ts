import { expect, test, type Page } from '@playwright/test';

async function prepare2DReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-responsive-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-responsive-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
  });
}

test('opening, continuation, preferences, and narrative progress form one reader path', async ({
  page,
}) => {
  await prepare2DReader(page);
  await page.goto('/');

  const archaeologistEntry = page.getByRole('button', {
    name: 'Enter the story through The Archaeologist',
  });
  await expect(archaeologistEntry).toBeVisible();
  await archaeologistEntry.click();

  let reader = page.getByRole('dialog');
  await expect(reader).toContainText('First Documentation');
  await expect(reader).toContainText(/Less than 1 min read|\d+ min read/);

  await reader.getByRole('button', { name: 'Follow Acceptance Path' }).click();
  reader = page.getByRole('dialog');
  await expect(reader).toContainText('Acceptance Path');
  await reader.getByRole('button', { name: 'Return to map' }).click();

  const settingsButton = page.getByRole('button', { name: 'Open reader settings' });
  await settingsButton.click();
  const settings = page.getByRole('dialog');
  await settings.getByText('Large', { exact: true }).click();
  await settings.getByText('Archive', { exact: true }).click();
  await settings.getByRole('checkbox', { name: /Reduce motion/ }).check();
  await expect(page.locator('.archive-shell')).toHaveAttribute('data-reduced-motion', 'true');
  await page.keyboard.press('Escape');
  await expect(settings).toHaveCount(0);
  await expect(settingsButton).toBeFocused();

  await page.reload();
  await page.getByRole('button', { name: 'Open reader settings' }).click();
  await expect(page.getByRole('radio', { name: /Large/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: /Archive/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Reduce motion/ })).toBeChecked();
  await page.getByRole('button', { name: 'Close settings' }).click();

  await page.getByRole('button', { name: /Open reading progress/ }).click();
  const progress = page.getByRole('dialog');
  await expect(progress).toContainText('First Documentation');
  await expect(progress).toContainText('Acceptance Path');
  await expect(progress).not.toContainText('arch-L1');
  await expect(progress).not.toContainText('arch-L2-accept');
});

test('390x844 reader remains usable without overflow and supports keyboard return', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare2DReader(page);
  await page.goto('/');

  await expect(page.getByRole('application', { name: 'Interactive story node map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Experimental 3D' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  const archaeologistEntry = page.getByRole('button', {
    name: 'Enter the story through The Archaeologist',
  });
  await archaeologistEntry.focus();
  await page.keyboard.press('Enter');

  const reader = page.getByRole('dialog');
  await expect(reader).toBeVisible();
  const scrollRegion = page.getByTestId('story-scroll-region');
  await scrollRegion.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect(
    reader.getByRole('progressbar', { name: 'Passage reading progress' }),
  ).toHaveAttribute('aria-valuenow', '100');
  await reader.getByRole('button', { name: 'Return to map' }).click();

  const map = page.getByRole('application', { name: 'Interactive story node map' });
  await map.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(map).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
