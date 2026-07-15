import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import type { SelectionRecord } from '@/types';

import { AdaptationLedger } from './AdaptationLedger';

const record: SelectionRecord = {
  sequence: 2,
  nodeId: 'arch-L1-machine-id',
  passageTitle: 'A Shard in the Dust',
  excerpt: 'Only the prose that was actually encountered.',
  variationId: 'internal-variation-991',
  selectedAt: '2026-07-15T12:00:00.000Z',
  visitNumber: 1,
  reason: {
    contract: 'org.narramorph.selection-reason',
    schemaVersion: '1.0.0',
    selectionKind: 'passage-variation',
    outcome: 'exact',
    templateKey: 'selection.first_visit',
    parameters: {},
    triggers: [{ kind: 'fallback-tier', actual: 'strict' }],
  },
  explanation: 'Historical explanation captured at selection time.',
};

describe('AdaptationLedger', () => {
  afterEach(cleanup);

  it('shows snapshot prose and explanations without machine identifiers', async () => {
    const user = userEvent.setup();
    render(<AdaptationLedger records={[record]} />);

    await user.click(screen.getByText('How your journey adapted'));

    const ledger = screen.getByTestId('adaptation-ledger');
    expect(ledger.textContent).toContain('A Shard in the Dust');
    expect(ledger.textContent).toContain('Only the prose that was actually encountered.');
    expect(ledger.textContent).toContain('Historical explanation captured at selection time.');
    expect(ledger.textContent).not.toContain('arch-L1-machine-id');
    expect(ledger.textContent).not.toContain('internal-variation-991');
    expect(ledger.textContent).not.toContain('fallback-tier');
  });

  it('does not imply unseen future fragments when the history is empty', async () => {
    const user = userEvent.setup();
    render(<AdaptationLedger records={[]} />);
    await user.click(screen.getByText('How your journey adapted'));

    expect(screen.getByTestId('adaptation-ledger').textContent).toContain(
      'Adaptation notes will appear here',
    );
  });
});
