import { expect, test, type Locator, type Page } from '@playwright/test';

const SAVE_KEY = 'narramorph-saved-state';

async function prepareReader(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-phase-3-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-phase-3-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    // Onboarding already seen so first-run journeys aren't blocked (>= INTRO_VERSION).
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

async function expectNoHorizontalOverflow(page: Page, locator: Locator): Promise<void> {
  const dimensions = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  const pageDimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(pageDimensions.scrollWidth).toBeLessThanOrEqual(pageDimensions.clientWidth + 1);
}

test('reader explanation persists as a safe visited-only ledger snapshot', async ({ page }) => {
  await prepareReader(page);
  await page.goto('/');

  await page.getByRole('button', { name: 'Enter the story through The Archaeologist' }).click();
  const reader = page.getByRole('dialog', { name: 'First Documentation' });
  const disclosure = reader.getByTestId('selection-disclosure');
  const disclosureSummary = disclosure.locator('summary');
  await expect(disclosureSummary).toHaveText('Why this version?');
  await disclosureSummary.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('open', '');

  const explanation = (await disclosure.getByTestId('selection-explanation').innerText()).trim();
  expect(explanation).toMatch(/^This version /);
  await expect(disclosure).not.toContainText('arch-L1');
  await expect(disclosure).not.toContainText(/internal|exact-|fallback-tier/i);
  await expectNoHorizontalOverflow(page, reader);

  await reader.getByRole('button', { name: 'Return to map' }).click();
  const storedBeforeReload = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  expect(storedBeforeReload).not.toBeNull();
  const journey = JSON.parse(storedBeforeReload as string) as {
    progress: {
      selectionRecords: Array<{
        passageTitle: string;
        explanation: string;
        excerpt: string;
      }>;
    };
  };
  expect(journey.progress.selectionRecords).toHaveLength(1);
  expect(journey.progress.selectionRecords[0]).toMatchObject({
    passageTitle: 'First Documentation',
    explanation,
  });
  expect(journey.progress.selectionRecords[0]?.excerpt.length).toBeGreaterThan(0);

  await page.reload();
  await page.locator('html').evaluate((element) => {
    element.style.fontSize = '200%';
  });
  await page.getByRole('button', { name: /Open reading progress/ }).click();
  const progress = page.getByRole('dialog', { name: 'Your path through the archive' });
  const ledger = progress.getByTestId('adaptation-ledger');
  const ledgerSummary = ledger.locator('summary');
  await ledgerSummary.focus();
  await page.keyboard.press('Enter');

  await expect(ledger).toHaveAttribute('open', '');
  await expect(ledger).toContainText('First Documentation');
  await expect(ledger).toContainText(explanation);
  await expect(ledger).not.toContainText('arch-L1');
  await expect(ledger).not.toContainText(/internal|fallback-tier/i);
  await expectNoHorizontalOverflow(page, progress);
});
