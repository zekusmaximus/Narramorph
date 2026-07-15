import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import type { SelectionReason } from '@/types';

import { SelectionDisclosure } from './SelectionDisclosure';

const reason: SelectionReason = {
  contract: 'org.narramorph.selection-reason',
  schemaVersion: '1.0.0',
  selectionKind: 'passage-variation',
  outcome: 'exact',
  templateKey: 'selection.philosophy',
  parameters: { philosophy: 'acceptance' },
  triggers: [{ kind: 'path-philosophy', actual: 'accept', expected: 'accept' }],
};

describe('SelectionDisclosure', () => {
  afterEach(cleanup);

  it('stays quiet until the reader opens the native disclosure', async () => {
    const user = userEvent.setup();
    render(<SelectionDisclosure reason={reason} />);

    const summary = screen.getByText('Why this version?');
    const details = screen.getByTestId('selection-disclosure');
    expect(details.hasAttribute('open')).toBe(false);

    summary.focus();
    expect(document.activeElement).toBe(summary);
    await user.click(summary);

    expect(details.hasAttribute('open')).toBe(true);
    expect(screen.getByTestId('selection-explanation').textContent).toContain(
      'choices that have leaned toward acceptance',
    );
    expect(details.textContent).not.toContain('path-philosophy');
  });

  it('renders nothing when there is no adaptive reason', () => {
    const { container } = render(<SelectionDisclosure reason={null} />);
    expect(container.innerHTML).toBe('');
  });
});
