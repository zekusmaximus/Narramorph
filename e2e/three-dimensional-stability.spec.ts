import { expect, test, type ConsoleMessage, type Page, type TestInfo } from '@playwright/test';

const RELEVANT_FAILURE =
  /content security policy|blocked.*blob|worker module|troika|webgl.*(?:fail|error)|(?:fail|error).*webgl|context lost|webglcontextlost|unhandled rejection/i;
const EXPECTED_CONTEXT_LOSS = /(?:three\.webglrenderer:\s*)?context lost/i;
const EXPECTED_INITIALIZATION_FAILURE = /webgl|error creating webgl context/i;

interface RuntimeFailure {
  phase: 'normal' | 'intentional-context-loss';
  text: string;
}

async function prepare(page: Page): Promise<{
  failures: RuntimeFailure[];
  beginIntentionalContextLoss: () => void;
}> {
  const failures: RuntimeFailure[] = [];
  let phase: RuntimeFailure['phase'] = 'normal';
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
  page.on('console', (message: ConsoleMessage) => {
    if (RELEVANT_FAILURE.test(message.text())) {
      failures.push({ phase, text: `console(${message.type()}): ${message.text()}` });
    }
  });
  page.on('pageerror', (error) => failures.push({ phase, text: `pageerror: ${error.message}` }));
  return {
    failures,
    beginIntentionalContextLoss: () => {
      phase = 'intentional-context-loss';
    },
  };
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

test('3D opens under the production CSP and recovers from context loss', async ({
  page,
}, testInfo) => {
  const runtime = await prepare(page);
  await page.goto('/');

  const response = await page.request.get('/');
  expect(response.headers()['content-security-policy']).toContain("script-src 'self';");
  expect(response.headers()['content-security-policy']).not.toMatch(/script-src[^;]*blob:/);

  await page.getByRole('button', { name: 'Experimental 3D view' }).click();
  const scene = page.getByTestId('three-dimensional-scene');
  await expect(scene).toHaveAttribute('data-scene-ready', 'true');

  const passageList = page.getByRole('navigation', { name: 'Passage list' });
  await expect(passageList).toBeVisible();
  const openingPassage = passageList.getByRole('button', { name: /First Documentation/ });
  await expect(openingPassage).toBeEnabled();
  await openingPassage.focus();
  await page.keyboard.press('Enter');

  const reader = page.getByRole('dialog', { name: 'First Documentation' });
  await expect(reader).toBeVisible();
  await expect(reader.getByRole('region', { name: 'Story passage' })).not.toBeEmpty();
  await page.keyboard.press('Escape');
  await expect(reader).toHaveCount(0);
  await expect(openingPassage).toBeFocused();

  // The canvas shares the same adapter: arrows select, Enter opens, and Escape
  // returns focus to the canvas rather than stranding it in the removed dialog.
  await scene.focus();
  await page.keyboard.press('ArrowRight');
  const keyboardTarget = passageList.locator('button[aria-current="true"]');
  await expect(keyboardTarget).toHaveCount(1);
  await expect(keyboardTarget).toBeEnabled();
  await page.keyboard.press('Enter');
  const keyboardReader = page.getByRole('dialog');
  await expect(keyboardReader).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(keyboardReader).toHaveCount(0);
  await expect(scene).toBeFocused();

  const navigationControls = page.getByRole('complementary', {
    name: '3D navigation controls',
  });
  const focusControl = navigationControls.getByRole('button', {
    name: 'Focus selected passage',
  });
  await expect(focusControl).toBeEnabled();
  await focusControl.click();
  await expect(navigationControls.getByRole('status')).toContainText(
    'Focused the three-dimensional view',
  );
  await navigationControls.getByRole('button', { name: 'Reset 3D view' }).click();
  await expect(navigationControls.getByRole('status')).toContainText(
    'Three-dimensional view reset to the overview.',
  );
  await navigationControls.getByText('3D legend').click();
  await expect(navigationControls.getByLabel('3D map legend')).toContainText('Arrowheads point');

  await expect(scene).toHaveAttribute('data-scene-ready', 'true');
  expect(runtime.failures).toEqual([]);

  await attachScreenshot(page, testInfo, 'three-dimensional-scene');

  runtime.beginIntentionalContextLoss();
  await scene.locator('canvas').dispatchEvent('webglcontextlost');
  await expect(page.getByTestId('webgl-fallback-status')).toContainText(
    'The 2D story map is ready instead.',
  );
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Experimental 3D view' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('narramorph-3d-mode')))
    .toBe('false');

  const unexpectedFailures = runtime.failures.filter(
    (failure) =>
      failure.phase !== 'intentional-context-loss' || !EXPECTED_CONTEXT_LOSS.test(failure.text),
  );
  expect(unexpectedFailures).toEqual([]);
  await attachScreenshot(page, testInfo, 'three-dimensional-recovery');
});

test('renderer initialization failure preserves the usable 2D reader', async ({ page }) => {
  const runtime = await prepare(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    const probeCanvases = new WeakSet<HTMLCanvasElement>();
    let probeSelected = false;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        if (!probeSelected) {
          probeCanvases.add(this);
          probeSelected = true;
        }
        if (!probeCanvases.has(this)) {
          return null;
        }
      }
      return original.call(this, type as never, ...(args as []));
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Experimental 3D view' }).click();

  await expect(page.getByTestId('webgl-fallback-status')).toContainText(
    'The 2D story map is ready instead.',
  );
  await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('narramorph-3d-mode')))
    .toBe('false');

  const indexToggle = page.getByRole('button', { name: 'INDEX' });
  await indexToggle.click();
  const passageList = page.getByRole('navigation', { name: 'Passage list' });
  const openingPassage = passageList.getByRole('button', { name: /First Documentation/ });
  await expect(openingPassage).toBeEnabled();
  await openingPassage.click();
  await expect(page.getByRole('dialog', { name: 'First Documentation' })).toBeVisible();

  expect(
    runtime.failures.some((failure) => EXPECTED_INITIALIZATION_FAILURE.test(failure.text)),
  ).toBe(true);
  expect(
    runtime.failures.filter((failure) =>
      /content security policy|troika|worker module/i.test(failure.text),
    ),
  ).toEqual([]);
});
