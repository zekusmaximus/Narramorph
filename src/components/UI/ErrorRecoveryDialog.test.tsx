import '@testing-library/jest-dom/vitest';
import { fireEvent, render } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { expect, it, vi } from 'vitest';

import { ErrorRecoveryDialog } from './ErrorRecoveryDialog';

function Harness({ onReturn }: { onReturn: () => void }): ReactElement {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button type="button" data-story-map-focus-target>
        Story map
      </button>
      {open && (
        <ErrorRecoveryDialog
          onReturnToMap={() => {
            onReturn();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

it('contains focus, closes with Escape, and restores the story map', () => {
  const onReturn = vi.fn();
  const view = render(<Harness onReturn={onReturn} />);
  const map = view.getByText('Story map');
  const title = view.getByRole('heading', { name: 'This passage could not be opened' });

  expect(view.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
  expect(title).toHaveFocus();
  expect(map).toHaveAttribute('inert');
  expect(map).toHaveAttribute('aria-hidden', 'true');

  fireEvent.keyDown(document, { key: 'Tab' });
  expect(view.getByRole('button', { name: 'Return to map' })).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(view.getByRole('button', { name: 'Return to map' })).toHaveFocus();

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onReturn).toHaveBeenCalledOnce();
  expect(view.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(map).toHaveFocus();
  expect(map).not.toHaveAttribute('inert');
  expect(map).not.toHaveAttribute('aria-hidden');
});
