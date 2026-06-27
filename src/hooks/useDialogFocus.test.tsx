import { fireEvent, render } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useDialogFocus } from './useDialogFocus';

function DialogHarness({
  initiallyOpen,
  onClose,
}: {
  initiallyOpen: boolean;
  onClose: () => void;
}): ReactElement {
  const [open, setOpen] = useState(initiallyOpen);
  const close = (): void => {
    onClose();
    setOpen(false);
  };
  const ref = useDialogFocus(open, close);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <div ref={ref} role="dialog" tabIndex={-1}>
          <button type="button">First</button>
          <button type="button">Last</button>
        </div>
      )}
    </>
  );
}

describe('useDialogFocus', () => {
  it('focuses the dialog, traps Tab, closes on Escape, and restores focus', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const onClose = vi.fn();
    const view = render(<DialogHarness initiallyOpen onClose={onClose} />);
    const first = view.getByRole('button', { name: 'First' });
    const last = view.getByRole('button', { name: 'Last' });
    const dialog = view.getByRole('dialog');

    expect(document.activeElement).toBe(dialog);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(outside);

    view.unmount();
    outside.remove();
  });
});
