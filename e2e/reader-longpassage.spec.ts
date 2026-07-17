import { expect, test, type Page } from '@playwright/test';

/** A returning reader with onboarding already seen and 2D forced. */
async function prepareReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-longpassage-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-longpassage-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

async function openNode(page: Page, nodeId: string): Promise<void> {
  const node = page.locator(`.react-flow__node[data-id="${nodeId}"]`);
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

function hashOf(page: Page): string {
  return new URL(page.url()).hash;
}

test('the open passage is hash-addressable and browser Back closes the reader', async ({
  page,
}) => {
  await prepareReader(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();

  await openNode(page, 'arch-L1');
  await expect.poll(() => hashOf(page)).toBe('#/passage/arch-L1');

  // Browser Back closes the reader (no modal trap) and returns to the map.
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expect.poll(() => hashOf(page)).toBe('');
});

test('a bookmarked passage deep-links open; an unknown one lands on the map', async ({ page }) => {
  await prepareReader(page);

  // Deep-link straight into an available opening passage.
  await page.goto('/#/passage/arch-L1');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Recovered passage');
  // Back from a bookmarked passage returns to the map, not off-site.
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();

  // An unknown / not-yet-reachable passage clears the hash and lands on the map.
  await page.goto('/#/passage/not-a-real-node');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => hashOf(page)).toBe('');

  // A locked L2 passage (its L1 unread) also refuses to deep-link open.
  await page.goto('/#/passage/arch-L2-accept');
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('an interrupted long read resumes the same passage and scroll position', async ({ page }) => {
  await prepareReader(page);
  await page.goto('/');
  await openNode(page, 'arch-L1');

  const region = page.getByTestId('story-scroll-region');
  await region.evaluate((el) => {
    el.scrollTop = 700;
    el.dispatchEvent(new Event('scroll'));
  });
  const saved = await region.evaluate((el) => el.scrollTop);
  expect(saved).toBeGreaterThan(600);

  // The back-to-top control appears once the reader is scrolled down.
  await expect(page.getByTestId('back-to-top')).toBeVisible();

  // Reload mid-read: the hash restores the same passage AND the scroll offset.
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  const restored = page.getByTestId('story-scroll-region');
  await expect.poll(() => restored.evaluate((el) => el.scrollTop)).toBeGreaterThan(saved - 20);

  // Back to top returns to the start.
  await page.getByTestId('back-to-top').click();
  await expect.poll(() => restored.evaluate((el) => el.scrollTop)).toBeLessThan(50);
});
