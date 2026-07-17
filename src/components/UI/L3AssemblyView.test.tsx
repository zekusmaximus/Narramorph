import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStoryStore } from '@/stores/storyStore';
import type { L3Assembly, L3AssemblySection } from '@/types';

import { L3AssemblyView } from './L3AssemblyView';

function createSection(character: L3AssemblySection['character']): L3AssemblySection {
  return {
    character,
    variationId: `${character}-section`,
    content: `${character} remembers the convergence.`,
    wordCount: 4,
    matchTier: 'exact-context',
    metadata: { wordCount: 4 },
  };
}

const assembly: L3Assembly = {
  arch: createSection('arch'),
  algo: createSection('algo'),
  hum: createSection('hum'),
  conv: createSection('conv'),
  totalWordCount: 16,
  metadata: {
    journeyPattern: 'started-stayed',
    pathPhilosophy: 'accept',
    awarenessLevel: 'high',
    synthesisPattern: 'single-dominant',
  },
};

function Harness({ onClose }: { onClose: () => void }): ReactElement {
  const [open, setOpen] = useState(true);
  const close = (): void => {
    onClose();
    setOpen(false);
  };

  return (
    <>
      <div role="region" aria-label="Story map" tabIndex={0}>
        <div role="application" aria-label="Interactive passage constellation">
          <div className="react-flow__node" data-id="arch-L3" tabIndex={0}>
            Archaeologist convergence
          </div>
        </div>
      </div>
      {open && <L3AssemblyView assembly={assembly} onClose={close} />}
    </>
  );
}

describe('L3AssemblyView', () => {
  beforeEach(() => {
    useStoryStore.setState({ selectedNode: 'arch-L3', activeVisit: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('focuses and contains the convergence, announces section changes, and restores map focus', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    const dialog = screen.getByRole('dialog', { name: 'The Convergence' });
    const title = screen.getByRole('heading', { name: 'The Convergence' });
    const map = document.querySelector<HTMLElement>('[role="region"][aria-label="Story map"]');
    expect(document.activeElement).toBe(title);
    expect(map).not.toBeNull();
    expect(map).toHaveAttribute('inert');
    expect(screen.getByRole('region', { name: 'Archaeologist Perspective' })).toHaveAttribute(
      'tabindex',
      '0',
    );

    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(
      screen.getByRole('button', { name: /Current convergence section 2: Algorithm Perspective/ }),
    ).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Convergence section 2 of 4: Algorithm Perspective',
    );

    opener.remove();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByText('Archaeologist convergence'));
  });
});
