import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'narramorph-saved-state';

async function prepare2DReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    // Treat onboarding as already seen so first-run journeys aren't blocked by
    // the intro modal (any value >= INTRO_VERSION suppresses the auto-open).
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

async function openNode(page: Page, nodeId: string): Promise<void> {
  const node = page.locator(`.react-flow__node[data-id="${nodeId}"]`);
  await expect(node).toBeVisible();
  await expect(node).toHaveAttribute('role', 'button');
  await node.click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function closeStory(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close story view' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function visitAndClose(page: Page, nodeId: string): Promise<void> {
  await openNode(page, nodeId);
  await closeStory(page);
}

test('reader completes L1 through L4, avoids repeat variations, and restores progress', async ({
  page,
}) => {
  await prepare2DReader(page);
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Archive passage map' })).toBeVisible();

  await visitAndClose(page, 'arch-L1');
  await visitAndClose(page, 'algo-L1');
  await visitAndClose(page, 'hum-L1');
  for (const nodeId of [
    'arch-L2-accept',
    'arch-L2-resist',
    'algo-L2-accept',
    'algo-L2-resist',
    'hum-L2-accept',
    'hum-L2-resist',
  ]) {
    await visitAndClose(page, nodeId);
  }

  await openNode(page, 'arch-L1');
  await expect(page.getByRole('dialog')).toContainText('Returning');
  const archReturningVariation = await page.getByRole('dialog').getAttribute('data-variation-id');
  expect(archReturningVariation).not.toBeNull();
  await closeStory(page);

  await openNode(page, 'arch-L1');
  await expect(page.getByRole('dialog')).toContainText('Meta-Aware');
  const archMetaVariation = await page.getByRole('dialog').getAttribute('data-variation-id');
  expect(archMetaVariation).not.toBeNull();
  expect(archMetaVariation).not.toBe(archReturningVariation);
  await closeStory(page);

  await visitAndClose(page, 'algo-L1');
  await openNode(page, 'algo-L1');
  await expect(page.getByRole('dialog')).toContainText('Meta-Aware');
  await closeStory(page);

  const l3Unlock = page.getByTestId('unlock-notification-arch-L3');
  const storyMap = page.locator('[role="region"][aria-label="Archive passage map"]');
  await expect(l3Unlock).toBeVisible();
  await l3Unlock.focus();
  await expect(l3Unlock).toBeFocused();
  await page.keyboard.press('Enter');

  const convergenceDialog = page.getByRole('dialog', { name: 'The Convergence' });
  await expect(convergenceDialog).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'The Convergence' })).toBeFocused();
  await expect(storyMap).toHaveAttribute('inert', '');
  await expect(storyMap).toHaveAttribute('aria-hidden', 'true');
  await expect(l3Unlock).toBeHidden();
  await expect(page.locator('[data-testid^="unlock-notification-"]:visible')).toHaveCount(0);

  for (let section = 2; section <= 4; section += 1) {
    await page.keyboard.press('ArrowRight');
    await expect(
      convergenceDialog.getByRole('button', {
        name: new RegExp(`^Current convergence section ${section}:`),
      }),
    ).toHaveAttribute('aria-current', 'step');
  }

  const completeConvergence = page.getByTestId('complete-convergence');
  await completeConvergence.focus();
  await expect(completeConvergence).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('l3-assembly')).toBeHidden();
  await expect(storyMap).not.toHaveAttribute('inert', '');
  await expect(storyMap).not.toHaveAttribute('aria-hidden', 'true');

  const l3MapReturnTargets = page.locator(
    '.react-flow__node[data-id="arch-L3"], [role="region"][aria-label="Archive passage map"]',
  );
  await expect
    .poll(() =>
      l3MapReturnTargets.evaluateAll((targets) =>
        targets.some((target) => target === document.activeElement),
      ),
    )
    .toBe(true);

  const endingUnlock = page.getByTestId('unlock-notification-final-preserve');
  await expect(endingUnlock).toBeVisible();
  await endingUnlock.click();
  await expect(page.getByRole('dialog')).toContainText('Preserve the Pattern');
  await expect(page.getByRole('dialog')).toContainText('[END]');
  await closeStory(page);

  const savedBeforeReload = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  expect(savedBeforeReload).not.toBeNull();
  expect(
    JSON.parse(savedBeforeReload as string).progress.visitedNodes['final-preserve'].visitCount,
  ).toBe(1);

  await page.reload();
  const savedAfterReload = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  expect(savedAfterReload).not.toBeNull();
  expect(
    JSON.parse(savedAfterReload as string).progress.visitedNodes['final-preserve'].visitCount,
  ).toBe(1);
  await expect(page.getByTestId('story-node-arch-L1')).toHaveCount(0);
  await openNode(page, 'final-preserve');
  await expect(page.getByRole('dialog')).toContainText('Visit #2');
});

test('missing story provides a retryable recovery state', async ({ page }) => {
  await prepare2DReader(page);
  await page.goto('/?story=missing-story');

  const recovery = page.getByTestId('story-load-error');
  await expect(recovery).toContainText('Story unavailable');
  await expect(recovery.getByRole('button', { name: 'Retry' })).toBeVisible();
});

test('unavailable WebGL falls back to the 2D reader', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('narramorph-3d-mode', 'true');
    localStorage.setItem('narramorph-intro-seen-version', '999');
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        return null;
      }
      return original.call(this, type as never, ...(args as []));
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto('/');
  await expect(page.getByTestId('webgl-fallback-status')).toContainText(
    'The 2D story map is ready instead.',
  );
  await expect(page.getByRole('region', { name: 'Archive passage map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Experimental 3D' })).toBeVisible();
});
