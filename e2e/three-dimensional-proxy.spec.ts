import { expect, test, type ConsoleMessage, type Locator, type Page } from '@playwright/test';

const RELEVANT_FAILURE =
  /content security policy|blocked.*blob|worker module|troika|webgl.*(?:fail|error)|(?:fail|error).*webgl|context lost|webglcontextlost|unhandled rejection/i;
const GRAPHICS_FAILURE = /webgl|graphics|context lost/i;

type ProxyOutcome = 'rendered' | 'fallback';

interface RuntimeFailure {
  text: string;
}

async function prepare(page: Page): Promise<RuntimeFailure[]> {
  const failures: RuntimeFailure[] = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error' || RELEVANT_FAILURE.test(message.text())) {
      failures.push({ text: `console(${message.type()}): ${message.text()}` });
    }
  });
  page.on('pageerror', (error) => failures.push({ text: `pageerror: ${error.message}` }));
  return failures;
}

async function waitForProxyOutcome(page: Page): Promise<ProxyOutcome> {
  await expect
    .poll(async () => {
      const sceneReady =
        (await page
          .getByTestId('three-dimensional-scene')
          .getAttribute('data-scene-ready')
          .catch(() => null)) === 'true';
      if (sceneReady) {
        return 'rendered';
      }
      if (
        await page
          .getByTestId('webgl-fallback-status')
          .isVisible()
          .catch(() => false)
      ) {
        return 'fallback';
      }
      return 'pending';
    })
    .toMatch(/rendered|fallback/);

  return (await page
    .getByTestId('three-dimensional-scene')
    .isVisible()
    .catch(() => false))
    ? 'rendered'
    : 'fallback';
}

async function activate(locator: Locator, page: Page, hasTouch: boolean): Promise<void> {
  if (!hasTouch) {
    await locator.click();
    return;
  }

  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + 22);
}

async function setDocumentVisibility(page: Page, state: 'hidden' | 'visible'): Promise<void> {
  await page.evaluate((nextState) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: nextState,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

async function expectCanvasSizedForScene(
  page: Page,
): Promise<{ clientHeight: number; clientWidth: number }> {
  const scene = page.getByTestId('three-dimensional-scene');
  const canvas = scene.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => {
      const [sceneDimensions, canvasDimensions] = await Promise.all([
        scene.evaluate((element) => ({
          clientHeight: element.clientHeight,
          clientWidth: element.clientWidth,
        })),
        canvas.evaluate((element) => {
          const canvasElement = element as HTMLCanvasElement;
          return {
            clientHeight: canvasElement.clientHeight,
            clientWidth: canvasElement.clientWidth,
          };
        }),
      ]);
      return canvasDimensions.clientHeight === sceneDimensions.clientHeight &&
        canvasDimensions.clientWidth === sceneDimensions.clientWidth
        ? sceneDimensions
        : null;
    })
    .not.toBeNull();
  const dimensions = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    return {
      clientHeight: canvasElement.clientHeight,
      clientWidth: canvasElement.clientWidth,
      height: canvasElement.height,
      width: canvasElement.width,
    };
  });
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.height).toBeGreaterThan(0);
  return {
    clientHeight: dimensions.clientHeight,
    clientWidth: dimensions.clientWidth,
  };
}

test('optional 3D renders or returns to a usable 2D reader across the proxy matrix', async ({
  page,
}, testInfo) => {
  const failures = await prepare(page);
  const hasTouch = testInfo.project.use.hasTouch === true;
  await page.goto('/');

  const response = await page.request.get('/');
  const contentSecurityPolicy = response.headers()['content-security-policy'];
  expect(contentSecurityPolicy).toContain("script-src 'self';");
  expect(contentSecurityPolicy).toContain("worker-src 'self';");
  expect(contentSecurityPolicy).not.toMatch(/(?:script|worker)-src[^;]*blob:/);

  const experimental3D = page.getByRole('button', { name: 'Experimental 3D view' });
  try {
    await expect(experimental3D).toBeVisible({ timeout: 30_000 });
  } catch (error) {
    throw new Error(
      `The application did not reach its map controls. Runtime failures: ${JSON.stringify(
        failures,
      )}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
  await activate(experimental3D, page, hasTouch);
  const outcome = await waitForProxyOutcome(page);
  testInfo.annotations.push({
    type: '3d-proxy-outcome',
    description: outcome === 'rendered' ? '3D rendered' : 'clean 2D fallback',
  });
  process.stdout.write(
    `[3d-proxy] ${testInfo.project.name}: ${
      outcome === 'rendered' ? '3D rendered' : 'clean 2D fallback'
    }\n`,
  );

  if (outcome === 'fallback') {
    await expect(page.getByTestId('webgl-fallback-status')).toContainText(
      'The 2D story map is ready instead.',
    );
    await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('narramorph-3d-mode')))
      .toBe('false');
    expect(
      failures.filter(
        ({ text }) =>
          !GRAPHICS_FAILURE.test(text) ||
          /content security policy|blocked.*blob|worker module|troika|unhandled rejection/i.test(
            text,
          ),
      ),
    ).toEqual([]);
    return;
  }

  const scene = page.getByTestId('three-dimensional-scene');
  await expect(scene).toHaveAttribute('data-frameloop', 'demand');
  await expect(page.getByRole('navigation', { name: 'Passage list' })).toBeVisible();
  const initialSceneDimensions = await expectCanvasSizedForScene(page);

  await setDocumentVisibility(page, 'hidden');
  await expect(scene).toHaveAttribute('data-frameloop', 'never');
  await setDocumentVisibility(page, 'visible');
  await expect(scene).toHaveAttribute('data-frameloop', 'demand');

  const initialViewport = page.viewportSize();
  expect(initialViewport).not.toBeNull();
  await page.setViewportSize({
    width: initialViewport?.height ?? 800,
    height: initialViewport?.width ?? 1280,
  });
  const resizedSceneDimensions = await expectCanvasSizedForScene(page);
  expect(resizedSceneDimensions).not.toEqual(initialSceneDimensions);

  const openingPassage = page
    .getByRole('navigation', { name: 'Passage list' })
    .getByRole('button', { name: /First Documentation/ });
  await activate(openingPassage, page, hasTouch);
  const reader = page.getByRole('dialog', { name: 'First Documentation' });
  await expect(reader).toBeVisible();
  await expect(reader.getByRole('region', { name: 'Story passage' })).not.toBeEmpty();
  await activate(reader.getByRole('button', { name: 'Close' }), page, hasTouch);
  await expect(reader).toHaveCount(0);

  // Canvas gestures must not make the plain-DOM escape routes unreachable.
  const canvas = scene.locator('canvas');
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  const x = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) * 0.7;
  const y = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) * 0.55;
  if (hasTouch) {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 30, y + 15);
    await page.mouse.up();
  }

  const returnTo2D = page.getByRole('button', { name: 'Return to 2D map' });
  await expect(returnTo2D).toBeVisible();
  await activate(returnTo2D, page, hasTouch);
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Experimental 3D view' })).toBeVisible();
  expect(failures).toEqual([]);
});
