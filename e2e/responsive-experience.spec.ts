import { expect, test, type Locator, type Page } from '@playwright/test';

async function prepare2DReader(
  page: Page,
  reducedMotion: 'reduce' | 'no-preference' = 'reduce',
): Promise<void> {
  await page.emulateMedia({ reducedMotion });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-responsive-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-responsive-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    // Onboarding already seen so first-run journeys aren't blocked (>= INTRO_VERSION).
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

async function expectNoHorizontalOverflow(page: Page, scope?: Locator): Promise<void> {
  const documentMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(documentMetrics.scrollWidth).toBeLessThanOrEqual(documentMetrics.clientWidth + 1);

  if (scope) {
    const scopeMetrics = await scope.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(scopeMetrics.scrollWidth).toBeLessThanOrEqual(scopeMetrics.clientWidth + 1);
  }
}

async function expectVisibleMapControlsWithinBounds(
  page: Page,
  mapApplication: Locator,
): Promise<void> {
  const mapBounds = await mapApplication.boundingBox();
  const viewport = page.viewportSize();
  if (!mapBounds || !viewport) {
    throw new Error('Expected measurable map and viewport bounds.');
  }

  const controls = mapApplication.locator('.react-flow__controls button:visible');
  const controlCount = await controls.count();
  expect(controlCount).toBeGreaterThan(0);

  for (let index = 0; index < controlCount; index += 1) {
    const controlBounds = await controls.nth(index).boundingBox();
    if (!controlBounds) {
      throw new Error(`Expected visible bounds for React Flow control ${index + 1}.`);
    }
    expect(controlBounds.x).toBeGreaterThanOrEqual(mapBounds.x - 1);
    expect(controlBounds.y).toBeGreaterThanOrEqual(mapBounds.y - 1);
    expect(controlBounds.x + controlBounds.width).toBeLessThanOrEqual(
      mapBounds.x + mapBounds.width + 1,
    );
    expect(controlBounds.y + controlBounds.height).toBeLessThanOrEqual(
      mapBounds.y + mapBounds.height + 1,
    );
    expect(controlBounds.x).toBeGreaterThanOrEqual(-1);
    expect(controlBounds.y).toBeGreaterThanOrEqual(-1);
    expect(controlBounds.x + controlBounds.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(controlBounds.y + controlBounds.height).toBeLessThanOrEqual(viewport.height + 1);
  }
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
  // The checkbox input is sr-only; toggle it the way a reader does, via its label.
  await settings.locator('label').filter({ hasText: 'Reduce motion' }).click();
  await expect(settings.getByRole('checkbox', { name: /Reduce motion/ })).toBeChecked();
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

  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Experimental 3D view' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

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

  const map = page.getByRole('region', { name: 'Story map' });
  await map.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(map).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test('390x844 reader text sizes remain ordered and avoid horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare2DReader(page);
  await page.goto('/');

  const textSizes = [
    { label: 'Compact', value: 'small' },
    { label: 'Comfortable', value: 'medium' },
    { label: 'Large', value: 'large' },
  ] as const;
  const renderedFontSizes: number[] = [];

  for (const textSize of textSizes) {
    await page.getByRole('button', { name: 'Open reader settings' }).click();
    const settings = page.getByRole('dialog');
    await settings.getByText(textSize.label, { exact: true }).click();
    await expect(settings.getByRole('radio', { name: textSize.label, exact: true })).toBeChecked();
    await expect(page.locator('.archive-shell')).toHaveAttribute('data-text-size', textSize.value);
    await expectNoHorizontalOverflow(page, settings);
    await settings.getByRole('button', { name: 'Close settings' }).click();

    await page.getByRole('button', { name: 'Enter the story through The Archaeologist' }).click();
    const reader = page.getByRole('dialog');
    const scrollRegion = page.getByTestId('story-scroll-region');
    await expect(reader).toBeVisible();
    await expectNoHorizontalOverflow(page, reader);
    await expectNoHorizontalOverflow(page, scrollRegion);
    renderedFontSizes.push(
      await page
        .getByTestId('story-passage')
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element.parentElement ?? element).fontSize),
        ),
    );
    await reader.getByRole('button', { name: 'Return to map' }).click();
  }

  const [compactFontSize, comfortableFontSize, largeFontSize] = renderedFontSizes;
  if (
    compactFontSize === undefined ||
    comfortableFontSize === undefined ||
    largeFontSize === undefined
  ) {
    throw new Error('Expected a rendered font size for every reader text-size preference.');
  }
  expect(comfortableFontSize).toBeGreaterThan(compactFontSize);
  expect(largeFontSize).toBeGreaterThan(comfortableFontSize);
  await expectNoHorizontalOverflow(page);
});

test('200% root text remains navigable at 390x844 without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare2DReader(page, 'no-preference');
  await page.goto('/');
  await page.locator('html').evaluate((element) => {
    element.style.fontSize = '200%';
  });

  await expect
    .poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).fontSize))
    .toBe('32px');
  await expectNoHorizontalOverflow(page);

  const settingsButton = page.getByRole('button', { name: 'Open reader settings' });
  await settingsButton.click();
  const settings = page.getByRole('dialog');
  await expect(settings).toBeVisible();
  await settings.getByText('Large', { exact: true }).click();
  await expect(settings.getByRole('radio', { name: 'Large', exact: true })).toBeChecked();
  await expectNoHorizontalOverflow(page, settings);
  await settings.getByRole('button', { name: 'Close settings' }).click();

  await expect(settingsButton).toBeFocused();
  const perspectiveActions = [
    page.getByRole('button', { name: 'Enter the story through The Archaeologist' }),
    page.getByRole('button', { name: 'Enter the story through The Algorithm' }),
    page.getByRole('button', { name: 'Enter the story through The Last Human' }),
  ] as const;
  for (const perspectiveAction of perspectiveActions) {
    await page.keyboard.press('Tab');
    await expect(perspectiveAction).toBeFocused();
    await expect(perspectiveAction).toBeVisible();
    await expect(perspectiveAction).toBeInViewport({ ratio: 0.5 });
  }

  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(perspectiveActions[0]).toBeFocused();
  await expect(perspectiveActions[0]).toBeInViewport({ ratio: 0.5 });
  await page.keyboard.press('Enter');
  const reader = page.getByRole('dialog');
  const scrollRegion = page.getByTestId('story-scroll-region');
  await expect(reader).toBeVisible();
  await expectNoHorizontalOverflow(page, reader);
  await expectNoHorizontalOverflow(page, scrollRegion);
  await expect
    .poll(() =>
      page
        .getByTestId('story-passage')
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element.parentElement ?? element).fontSize),
        ),
    )
    .toBeGreaterThanOrEqual(40);
  await reader.getByRole('button', { name: 'Return to map' }).click();

  const map = page.getByRole('region', { name: 'Story map' });
  const mapApplication = page.getByRole('application', {
    name: 'Interactive passage constellation',
  });
  await expect(map).toBeVisible();
  await expect(map).toBeInViewport();
  await expect(mapApplication).toBeVisible();
  await expect(mapApplication).toBeInViewport();
  await expect(page.getByTestId('archive-map-status')).toContainText(/passages opened/i);
  await expect(page.getByTestId('archive-map-status-visual')).toBeHidden();
  await expect(mapApplication.locator('.react-flow__controls')).toHaveClass(/horizontal/);
  await expectVisibleMapControlsWithinBounds(page, mapApplication);

  const availableNodes = mapApplication.locator('.react-flow__node[data-id][role="button"]');
  expect(await availableNodes.count()).toBeGreaterThan(0);
  await expect(availableNodes.first()).toBeVisible();
  await map.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(map).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test('app reduced motion takes effect without relying on the system preference', async ({
  page,
}) => {
  await prepare2DReader(page, 'no-preference');
  await page.goto('/');

  const shell = page.locator('.archive-shell');
  const particles = page.getByTestId('story-node-particles');
  await expect(shell).toHaveAttribute('data-reduced-motion', 'false');

  await page.getByRole('button', { name: 'Enter the story through The Archaeologist' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Return to map' }).click();
  await expect(particles.first()).toBeVisible();

  await page.getByRole('button', { name: 'Open reader settings' }).click();
  const settings = page.getByRole('dialog');
  // The checkbox input is sr-only; toggle it the way a reader does, via its label.
  await settings.locator('label').filter({ hasText: 'Reduce motion' }).click();
  await expect(settings.getByRole('checkbox', { name: /Reduce motion/ })).toBeChecked();
  await expect(shell).toHaveAttribute('data-reduced-motion', 'true');
  await expect(particles).toHaveCount(0);
  await expectNoHorizontalOverflow(page, settings);
});
