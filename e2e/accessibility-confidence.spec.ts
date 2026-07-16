import { expect, test, type Locator, type Page } from '@playwright/test';

async function prepare2DReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-accessibility-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-accessibility-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
  });
}

async function tabUntilFocused(
  page: Page,
  target: Locator,
  options: { reverse?: boolean; limit?: number } = {},
): Promise<void> {
  const { reverse = false, limit = 30 } = options;

  for (let step = 0; step < limit; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      return;
    }
    await page.keyboard.press(reverse ? 'Shift+Tab' : 'Tab');
  }

  throw new Error(`Keyboard focus did not reach the requested element after ${limit} Tab presses.`);
}

test('reader completes the primary journey with keyboard focus kept visible and contained', async ({
  page,
}) => {
  await prepare2DReader(page);
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: 'Skip to story' });
  const progressButton = page.getByRole('button', { name: /Open reading progress/ });
  const settingsButton = page.getByRole('button', { name: 'Open reader settings' });
  const archaeologistEntry = page.getByRole('button', {
    name: 'Enter the story through The Archaeologist',
  });
  const algorithmEntry = page.getByRole('button', {
    name: 'Enter the story through The Algorithm',
  });
  const humanEntry = page.getByRole('button', {
    name: 'Enter the story through The Last Human',
  });
  const map = page.getByRole('region', { name: 'Archive passage map' });
  const storyGraph = page.getByRole('application', {
    name: 'Interactive passage constellation',
  });

  await expect(map).toBeVisible();
  await expect(page.getByRole('application')).toHaveCount(1);
  await expect(map).toHaveAttribute(
    'aria-description',
    'Use the arrow keys to move between available passages. Press Enter or Space to open the selected passage, and Escape to close it.',
  );
  await expect(storyGraph).toHaveAttribute(
    'aria-description',
    'Use the arrow keys to move between available passages. Press Enter or Space to open the selected passage, and Escape to close it.',
  );
  await expect(archaeologistEntry).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(progressButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(settingsButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(archaeologistEntry).toBeFocused();

  await page.keyboard.press('Enter');
  const storyTitle = page.locator('#story-view-title');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(storyTitle).toHaveText('First Documentation');
  await expect(storyTitle).toBeFocused();
  await expect(page.getByTestId('story-passage')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close story view' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('story-scroll-region')).toBeFocused();
  await page.keyboard.press('Tab');
  const firstDisclosure = page.getByRole('dialog').locator('summary', {
    hasText: 'Why this version?',
  });
  await expect(firstDisclosure).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('selection-disclosure')).toHaveAttribute('open', '');
  const acceptancePath = page.getByRole('button', { name: 'Follow Acceptance Path' });
  await tabUntilFocused(page, acceptancePath, { limit: 5 });
  await expect(acceptancePath).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(storyTitle).toHaveText('Acceptance Path');
  await expect(storyTitle).toBeFocused();
  await expect(page.getByTestId('story-passage')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close story view' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('story-scroll-region')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('dialog').locator('summary', { hasText: 'Why this version?' }),
  ).toBeFocused();
  const returnToMap = page.getByRole('button', { name: 'Return to map' });
  await tabUntilFocused(page, returnToMap, { limit: 5 });
  await expect(returnToMap).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(archaeologistEntry).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(algorithmEntry).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(humanEntry).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(map).toBeFocused();

  await page.keyboard.press('ArrowRight');
  const focusedMapNode = page.locator('.react-flow__node[data-id][role="button"]:focus');
  await expect(focusedMapNode).toHaveCount(1);
  await expect(focusedMapNode).toHaveAttribute('aria-current', 'true');
  await expect(focusedMapNode).toHaveAttribute('aria-roledescription', 'passage');
  await expect(focusedMapNode).toHaveCSS('outline-style', 'solid');
  const focusedNodeId = await focusedMapNode.getAttribute('data-id');
  expect(focusedNodeId).not.toBeNull();

  const nodeDescriptionId = await focusedMapNode.getAttribute('aria-describedby');
  expect(nodeDescriptionId).not.toBeNull();
  const nodeDescription = page.locator(`#${nodeDescriptionId}`);
  await expect(nodeDescription).toHaveText(
    'Use the arrow keys to move between available passages. Press Enter or Space to open the selected passage.',
  );
  await expect(nodeDescription).not.toContainText(/move the node|delete/i);

  const mapNodesBeforeDelete = await page
    .locator('.react-flow__node[data-id]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-id')));
  for (const deletionKey of ['Delete', 'Backspace'] as const) {
    await page.keyboard.press(deletionKey);
    await expect(focusedMapNode).toBeFocused();
    expect(
      await page
        .locator('.react-flow__node[data-id]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-id'))),
    ).toEqual(mapNodesBeforeDelete);
  }

  const renderedEdges = page.locator('.react-flow__edge');
  expect(await renderedEdges.count()).toBeGreaterThan(0);
  await expect(renderedEdges.first()).toHaveAttribute('role', 'presentation');
  await expect(renderedEdges.first()).toHaveAttribute('aria-hidden', 'true');
  await expect(renderedEdges.first()).not.toHaveAttribute('aria-label', /.+/);

  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(storyTitle).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator(`.react-flow__node[data-id="${focusedNodeId}"]`)).toBeFocused();

  await tabUntilFocused(page, settingsButton, { reverse: true });
  await expect(settingsButton).toBeFocused();
  await page.keyboard.press('Enter');

  const settingsTitle = page.locator('#settings-title');
  const mainContent = page.locator('#main-content');
  await expect(page.getByRole('dialog', { name: 'Shape the reading room' })).toHaveCount(1);
  await expect(settingsTitle).toBeFocused();
  await expect(mainContent).toHaveAttribute('inert', '');
  await expect(mainContent).toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('Shift+Tab');
  const reduceMotion = page.getByRole('checkbox', { name: /Reduce motion/ });
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close settings' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(settingsButton).toBeFocused();
  await expect(mainContent).not.toHaveAttribute('inert', '');
  await expect(mainContent).not.toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('Shift+Tab');
  await expect(progressButton).toBeFocused();
  await page.keyboard.press('Enter');

  const progressTitle = page.locator('#reading-progress-title');
  const closeProgress = page.getByRole('button', { name: 'Close reading progress' });
  const adaptationLedgerSummary = page.locator('summary', {
    hasText: 'How your journey adapted',
  });
  await expect(page.getByRole('dialog', { name: 'Your path through the archive' })).toHaveCount(1);
  await expect(progressTitle).toBeFocused();
  await expect(mainContent).toHaveAttribute('inert', '');
  await expect(mainContent).toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('Tab');
  await expect(closeProgress).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(adaptationLedgerSummary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('adaptation-ledger')).toHaveAttribute('open', '');
  // The journey-export controls sit after the ledger and remain inside the focus trap.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Export journey (Markdown)' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Print-friendly view' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeProgress).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(progressButton).toBeFocused();
  await expect(mainContent).not.toHaveAttribute('inert', '');
  await expect(mainContent).not.toHaveAttribute('aria-hidden', 'true');
});
