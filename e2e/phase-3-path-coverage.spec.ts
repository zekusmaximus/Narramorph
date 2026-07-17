import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'narramorph-saved-state';

type Philosophy = 'accept' | 'resist' | 'invest';

interface PathCase {
  philosophy: Philosophy;
  readerLabel: string;
  endingId: 'final-preserve' | 'final-transform' | 'final-release';
  endingTitle: string;
}

const PATH_CASES: PathCase[] = [
  {
    philosophy: 'accept',
    readerLabel: 'acceptance',
    endingId: 'final-preserve',
    endingTitle: 'Preserve the Pattern',
  },
  {
    philosophy: 'invest',
    readerLabel: 'investigation',
    endingId: 'final-transform',
    endingTitle: 'Transform the Pattern',
  },
  {
    philosophy: 'resist',
    readerLabel: 'resistance',
    endingId: 'final-release',
    endingTitle: 'Release the Pattern',
  },
];

async function prepareReader(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('narramorph-phase-3-path-e2e-initialized')) {
      localStorage.clear();
      localStorage.setItem('narramorph-phase-3-path-e2e-initialized', 'true');
    }
    localStorage.setItem('narramorph-3d-mode', 'false');
    // Onboarding already seen so first-run journeys aren't blocked (>= INTRO_VERSION).
    localStorage.setItem('narramorph-intro-seen-version', '999');
  });
}

async function openNode(page: Page, nodeId: string): Promise<void> {
  const node = page.locator(`.react-flow__node[data-id="${nodeId}"]`);
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function closeStory(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function visit(page: Page, nodeId: string): Promise<void> {
  await openNode(page, nodeId);
  await closeStory(page);
}

async function buildDominantPath(page: Page, philosophy: Philosophy): Promise<void> {
  const alternate: Record<Philosophy, Philosophy> = {
    accept: 'resist',
    resist: 'invest',
    invest: 'accept',
  };
  for (const nodeId of ['arch-L1', 'algo-L1', 'hum-L1']) {
    await visit(page, nodeId);
  }
  for (const character of ['arch', 'algo', 'hum']) {
    await visit(page, `${character}-L2-${philosophy}`);
    await visit(page, `${character}-L2-${alternate[philosophy]}`);
  }
  // Reaffirm the target path after the required six distinct L2 passages.
  for (const character of ['arch', 'algo', 'hum']) {
    await visit(page, `${character}-L2-${philosophy}`);
  }

  // Two deeply revisited perspectives satisfy the documented L3 meta-awareness criterion.
  for (const nodeId of ['arch-L1', 'arch-L1', 'algo-L1', 'algo-L1']) {
    await visit(page, nodeId);
  }
}

async function completeConvergence(page: Page, readerLabel: string): Promise<void> {
  const l3Unlock = page.getByTestId('unlock-notification-arch-L3');
  await expect(l3Unlock).toBeVisible();
  await l3Unlock.click();

  const convergence = page.getByRole('dialog', { name: 'The Convergence' });
  const disclosure = convergence.getByTestId('selection-disclosure');
  await disclosure.locator('summary').click();
  const explanation = disclosure.getByTestId('selection-explanation');
  await expect(explanation).toContainText(readerLabel);
  await expect(explanation).not.toContainText(
    /(?:arch|algo|hum|conv)-L3|fallback-tier|variationId/i,
  );
  await convergence.getByRole('heading', { name: 'The Convergence' }).focus();

  for (let section = 2; section <= 4; section += 1) {
    await page.keyboard.press('ArrowRight');
    await expect(
      convergence.getByRole('button', {
        name: new RegExp(`^Current convergence section ${section}:`),
      }),
    ).toHaveAttribute('aria-current', 'step');
  }

  await page.getByTestId('complete-convergence').click();
  await expect(convergence).toBeHidden();
}

for (const pathCase of PATH_CASES) {
  test(`${pathCase.readerLabel} journey reaches ${pathCase.endingTitle} with durable explanations`, async ({
    page,
  }) => {
    await prepareReader(page);
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Story map' })).toBeVisible();

    await buildDominantPath(page, pathCase.philosophy);
    await completeConvergence(page, pathCase.readerLabel);

    const endingUnlock = page.getByTestId(`unlock-notification-${pathCase.endingId}`);
    await expect(endingUnlock).toBeVisible();
    await endingUnlock.click();

    const ending = page.getByRole('dialog', { name: pathCase.endingTitle });
    await expect(ending.getByRole('heading', { name: pathCase.endingTitle })).toBeVisible();
    await expect(ending).not.toContainText(
      /(?:variationId|nodeId|terminalEndpoint|Content Architecture)/,
    );
    const disclosure = ending.getByTestId('selection-disclosure');
    await disclosure.locator('summary').click();
    await expect(disclosure.getByTestId('selection-explanation')).toHaveText(
      `This is the ending you chose: ${pathCase.endingTitle}.`,
    );
    await expect(disclosure).not.toContainText(pathCase.endingId);
    await closeStory(page);

    const savedBeforeReload = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    expect(savedBeforeReload).not.toBeNull();
    const before = JSON.parse(savedBeforeReload as string) as {
      progress: {
        journeyTracking: { dominantPhilosophy: string };
        selectionRecords: Array<{
          nodeId: string;
          explanation: string;
          excerpt: string;
          fragmentLabel?: string;
        }>;
      };
    };
    expect(before.progress.journeyTracking.dominantPhilosophy).toBe(pathCase.philosophy);
    expect(
      before.progress.selectionRecords.filter((record) => record.nodeId === 'arch-L3'),
    ).toHaveLength(4);
    expect(
      before.progress.selectionRecords.find((record) => record.nodeId === pathCase.endingId)
        ?.explanation,
    ).toBe(`This is the ending you chose: ${pathCase.endingTitle}.`);
    expect(
      before.progress.selectionRecords.find((record) => record.nodeId === pathCase.endingId)
        ?.excerpt,
    ).not.toMatch(/(?:variationId|nodeId|terminalEndpoint|Content Architecture)/);

    const explanationSnapshots = before.progress.selectionRecords.map(
      (record) => record.explanation,
    );
    await page.reload();
    const savedAfterReload = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    expect(savedAfterReload).not.toBeNull();
    const after = JSON.parse(savedAfterReload as string) as typeof before;
    expect(after.progress.selectionRecords.map((record) => record.explanation)).toEqual(
      explanationSnapshots,
    );
  });
}
