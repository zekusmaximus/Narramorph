import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'narramorph-saved-state';

async function prepareReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-phase-2-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-phase-2-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
  });
}

for (const profile of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile 390x844', width: 390, height: 844 },
] as const) {
  test(`Phase 2 vertical slice completes by keyboard and restores on ${profile.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await prepareReader(page);
    await page.goto('/');

    const entry = page.getByRole('button', {
      name: 'Enter the story through The Archaeologist',
    });
    await entry.focus();
    await page.keyboard.press('Enter');

    let reader = page.getByRole('dialog');
    await expect(reader).toContainText('First Documentation');
    const continuation = reader.getByRole('button', { name: 'Follow Acceptance Path' });
    await continuation.focus();
    await page.keyboard.press('Enter');

    reader = page.getByRole('dialog');
    await expect(reader).toContainText('Acceptance Path');
    await page.keyboard.press('Escape');
    await expect(reader).toHaveCount(0);

    const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    expect(saved).not.toBeNull();
    const journey = JSON.parse(saved as string) as {
      appVersion: string;
      storyPackage: {
        storyId: string;
        storyVersion: string;
        schemaVersion: string;
        contentHash: string;
      };
      progress: {
        readingPath: string[];
        visitedNodes: Record<string, { visitCount: number }>;
      };
    };
    expect(journey.appVersion).toBe('0.1.0');
    expect(journey.storyPackage).toMatchObject({
      storyId: 'eternal-return',
      storyVersion: '1.1.0',
      schemaVersion: '1.1.0',
      contentHash: 'd596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062',
    });
    expect(journey.progress.readingPath.slice(0, 2)).toEqual(['arch-L1', 'arch-L2-accept']);
    expect(journey.progress.visitedNodes['arch-L1']?.visitCount).toBe(1);
    expect(journey.progress.visitedNodes['arch-L2-accept']?.visitCount).toBe(1);

    await page.reload();
    await page.getByRole('button', { name: /Open reading progress/ }).click();
    const progress = page.getByRole('dialog');
    await expect(progress).toContainText('First Documentation');
    await expect(progress).toContainText('Acceptance Path');

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });
}
