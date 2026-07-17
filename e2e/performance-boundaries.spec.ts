import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

interface BrowserPerformanceMetrics {
  lcpMs: number;
  cls: number;
  events: Array<{ name: string; duration: number; interactionId: number }>;
  longTasks: number[];
}

declare global {
  interface Window {
    __narramorphPerformanceMetrics: BrowserPerformanceMetrics;
  }
}

interface PerformanceBudget {
  lcpMs: number;
  cls: number;
  storyInteractionMs: number;
  mapInteractionMs: number;
}

const performanceBudgets = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'config/performance-budgets.json'), 'utf8'),
) as {
  budgets: {
    desktop: PerformanceBudget;
    midRangeMobile: PerformanceBudget;
  };
};

const profiles = [
  {
    name: 'desktop',
    budget: performanceBudgets.budgets.desktop,
    viewport: { width: 1440, height: 900 },
    mobileThrottle: false,
  },
  {
    name: 'mid-range mobile',
    budget: performanceBudgets.budgets.midRangeMobile,
    viewport: { width: 412, height: 915 },
    mobileThrottle: true,
  },
] as const;

async function prepareProfile(page: Page, profile: (typeof profiles)[number]): Promise<void> {
  await page.setViewportSize(profile.viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('narramorph-3d-mode', 'false');
    // Onboarding already seen so first-run journeys aren't blocked (>= INTRO_VERSION).
    localStorage.setItem('narramorph-intro-seen-version', '999');

    const metrics: BrowserPerformanceMetrics = {
      lcpMs: 0,
      cls: 0,
      events: [],
      longTasks: [],
    };
    window.__narramorphPerformanceMetrics = metrics;

    if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          metrics.lcpMs = lastEntry.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    }

    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };
          if (!layoutShift.hadRecentInput) {
            metrics.cls += layoutShift.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }

    if (PerformanceObserver.supportedEntryTypes.includes('event')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const event = entry as PerformanceEntry & { interactionId: number };
          metrics.events.push({
            name: event.name,
            duration: event.duration,
            interactionId: event.interactionId,
          });
        }
      }).observe({
        type: 'event',
        buffered: true,
        durationThreshold: 16,
      } as PerformanceObserverInit);
    }

    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      new PerformanceObserver((list) => {
        metrics.longTasks.push(...list.getEntries().map((entry) => entry.duration));
      }).observe({ type: 'longtask', buffered: true });
    }
  });

  if (profile.mobileThrottle) {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await session.send('Network.enable');
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 1_600_000 / 8,
      uploadThroughput: 750_000 / 8,
      connectionType: 'cellular4g',
    });
  }
}

async function resourceNames(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    performance.getEntriesByType('resource').map((entry) => new URL(entry.name).pathname),
  );
}

async function eventCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__narramorphPerformanceMetrics.events.length);
}

async function maximumEventDuration(
  page: Page,
  startingAt: number,
  names: string[],
): Promise<number> {
  return page.evaluate(
    ({ index, eventNames }) =>
      Math.max(
        0,
        ...window.__narramorphPerformanceMetrics.events
          .slice(index)
          .filter((event) => eventNames.includes(event.name))
          .map((event) => event.duration),
      ),
    { index: startingAt, eventNames: names },
  );
}

for (const profile of profiles) {
  test(`${profile.name} stays within performance and request boundaries`, async ({ page }) => {
    await prepareProfile(page, profile);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const map = page.getByRole('region', { name: 'Story map' });
    await expect(map).toBeVisible();
    await page.waitForTimeout(500);

    const initialResources = await resourceNames(page);
    expect(
      initialResources.filter((name) =>
        /NarromorphCanvas|ContentPanel3D|variations|final-(preserve|release|transform)/i.test(name),
      ),
    ).toEqual([]);

    const loadingMetrics = await page.evaluate(() => window.__narramorphPerformanceMetrics);
    expect(loadingMetrics.lcpMs).toBeGreaterThan(0);
    expect(loadingMetrics.lcpMs).toBeLessThanOrEqual(profile.budget.lcpMs);
    expect(loadingMetrics.cls).toBeLessThanOrEqual(profile.budget.cls);

    // Delay only the optional requests so loading semantics remain observable without
    // changing the cache behavior used for the initial-load measurement above.
    await page.route('**/*arch-L1-variations*.js', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.continue();
    });
    await page.route('**/*NarromorphCanvas*.js', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.continue();
    });

    const mapEventStart = await eventCount(page);
    await map.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.react-flow__node[data-id][role="button"]:focus')).toHaveCount(1);
    expect(
      await maximumEventDuration(page, mapEventStart, ['keydown', 'keyup']),
    ).toBeLessThanOrEqual(profile.budget.mapInteractionMs);

    const storyEventStart = await eventCount(page);
    await page.getByRole('button', { name: 'Enter the story through The Archaeologist' }).click();
    const dialog = page.getByRole('dialog', { name: 'First Documentation' });
    await expect(dialog).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByTestId('story-passage-loading')).toHaveRole('status');
    await expect(page.locator('#story-view-title')).toBeFocused();
    await expect(page.getByTestId('story-passage')).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-busy', 'false');
    expect(await maximumEventDuration(page, storyEventStart, ['click'])).toBeLessThanOrEqual(
      profile.budget.storyInteractionMs,
    );

    const storyResources = await resourceNames(page);
    expect(storyResources.filter((name) => /arch-L1-variations/i.test(name))).toHaveLength(1);
    expect(storyResources.some((name) => /NarromorphCanvas|ContentPanel3D/i.test(name))).toBe(
      false,
    );

    await dialog.getByRole('button', { name: 'Return to map' }).click();
    const modeToggle = page.locator('button[aria-describedby="experimental-3d-description"]');
    await expect(modeToggle).toHaveText('Experimental 3D view');
    await modeToggle.click();
    await expect(page.getByTestId('three-dimensional-loading')).toHaveRole('status');
    await expect(modeToggle).toBeFocused();
    await expect
      .poll(async () => (await resourceNames(page)).some((name) => /NarromorphCanvas/i.test(name)))
      .toBe(true);

    const spatialView = page
      .getByRole('application', { name: 'Story map (3D view)' })
      .or(page.getByTestId('webgl-fallback-status'));
    await expect(spatialView).toBeVisible();
  });
}
