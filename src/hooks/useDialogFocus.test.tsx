import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDialogFocus } from './useDialogFocus';

afterEach(cleanup);

function DialogHarness({
  initiallyOpen,
  onClose,
  fallback,
  preferFallback,
}: {
  initiallyOpen: boolean;
  onClose: () => void;
  fallback?: HTMLElement;
  preferFallback?: boolean;
}): ReactElement {
  const [open, setOpen] = useState(initiallyOpen);
  const close = (): void => {
    onClose();
    setOpen(false);
  };
  const ref = useDialogFocus(open, close, {
    initialFocusSelector: '#dialog-title',
    preferFallback,
    restoreFocus: () => fallback ?? null,
  });
  const [showDynamicControl, setShowDynamicControl] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <div ref={ref} role="dialog" tabIndex={-1}>
          <h2 id="dialog-title" tabIndex={-1}>
            Dialog title
          </h2>
          <button type="button">First</button>
          <button type="button" onClick={() => setShowDynamicControl(true)}>
            Add control
          </button>
          <button type="button">Last</button>
          {showDynamicControl && <button type="button">Dynamic</button>}
        </div>
      )}
    </>
  );
}

function LayeredDialogHarness({
  baseModal = false,
  onBaseClose,
  onTopClose,
}: {
  baseModal?: boolean;
  onBaseClose: () => void;
  onTopClose: () => void;
}): ReactElement {
  const [baseOpen, setBaseOpen] = useState(true);
  const [topOpen, setTopOpen] = useState(true);
  const baseRef = useDialogFocus(
    baseOpen,
    () => {
      onBaseClose();
      setBaseOpen(false);
    },
    {
      initialFocusSelector: '#layered-base-title',
      modal: baseModal,
    },
  );
  const topRef = useDialogFocus(
    topOpen,
    () => {
      onTopClose();
      setTopOpen(false);
    },
    { initialFocusSelector: '#layered-top-title' },
  );

  return (
    <>
      {baseOpen && (
        <div
          ref={baseRef}
          role="dialog"
          aria-labelledby="layered-base-title"
          data-testid="layered-base"
          tabIndex={-1}
        >
          <h2 id="layered-base-title" tabIndex={-1}>
            Modeless reader
          </h2>
        </div>
      )}
      {topOpen && (
        <div
          ref={topRef}
          role="dialog"
          aria-labelledby="layered-top-title"
          data-testid="layered-top"
          tabIndex={-1}
        >
          <h2 id="layered-top-title" tabIndex={-1}>
            Reader settings
          </h2>
        </div>
      )}
    </>
  );
}

function ResponsiveDialogHarness({
  modal,
  onClose,
}: {
  modal: boolean;
  onClose: () => void;
}): ReactElement {
  const dialogRef = useDialogFocus(true, onClose, {
    initialFocusSelector: '#responsive-dialog-title',
    modal,
  });

  return (
    <div ref={dialogRef} role="dialog" aria-labelledby="responsive-dialog-title" tabIndex={-1}>
      <h2 id="responsive-dialog-title" tabIndex={-1}>
        Responsive reader
      </h2>
    </div>
  );
}

describe('useDialogFocus', () => {
  it('focuses the requested initial target, isolates the background, traps Tab, and restores focus', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const onClose = vi.fn();
    const view = render(<DialogHarness initiallyOpen onClose={onClose} />);
    const first = view.getByRole('button', { name: 'First' });
    const last = view.getByRole('button', { name: 'Last' });
    const title = view.getByRole('heading', { name: 'Dialog title' });

    expect(document.activeElement).toBe(title);
    expect(outside).toHaveAttribute('inert');
    expect(outside).toHaveAttribute('aria-hidden', 'true');
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(outside);
    expect(outside).not.toHaveAttribute('inert');
    expect(outside).not.toHaveAttribute('aria-hidden');

    view.unmount();
    outside.remove();
  });

  it('queries focusable controls again when dialog content changes', () => {
    const view = render(<DialogHarness initiallyOpen onClose={vi.fn()} />);

    fireEvent.click(view.getByRole('button', { name: 'Add control' }));
    const dynamic = view.getByRole('button', { name: 'Dynamic' });
    dynamic.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(view.getByRole('button', { name: 'First' }));
  });

  it('uses a connected fallback when the original opener disappears', () => {
    const opener = document.createElement('button');
    const fallback = document.createElement('button');
    document.body.append(opener, fallback);
    opener.focus();
    const view = render(<DialogHarness initiallyOpen onClose={vi.fn()} fallback={fallback} />);

    opener.remove();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(fallback);
    view.unmount();
    fallback.remove();
  });

  it('uses the fallback when the page body was active before opening', () => {
    const prior = document.createElement('button');
    document.body.append(prior);
    prior.focus();
    prior.remove();
    const fallback = document.createElement('button');
    document.body.append(fallback);
    expect(document.activeElement).toBe(document.body);
    const view = render(<DialogHarness initiallyOpen onClose={vi.fn()} fallback={fallback} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(fallback);
    view.unmount();
    fallback.remove();
  });

  it('uses the fallback when the original opener becomes invisible', () => {
    const opener = document.createElement('button');
    const fallback = document.createElement('button');
    document.body.append(opener, fallback);
    opener.focus();
    const view = render(<DialogHarness initiallyOpen onClose={vi.fn()} fallback={fallback} />);

    opener.style.visibility = 'hidden';
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(fallback);
    view.unmount();
    opener.remove();
    fallback.remove();
  });

  it('can prefer an explicit destination over a still-connected opener', () => {
    const opener = document.createElement('button');
    const fallback = document.createElement('button');
    document.body.append(opener, fallback);
    opener.focus();
    const view = render(
      <DialogHarness initiallyOpen onClose={vi.fn()} fallback={fallback} preferFallback />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(fallback);
    view.unmount();
    opener.remove();
    fallback.remove();
  });

  it('lets only the topmost surface handle Escape', () => {
    const onBaseClose = vi.fn();
    const onTopClose = vi.fn();
    const view = render(<LayeredDialogHarness onBaseClose={onBaseClose} onTopClose={onTopClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onTopClose).toHaveBeenCalledOnce();
    expect(onBaseClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onBaseClose).toHaveBeenCalledOnce();
    view.unmount();
  });

  it('preserves stack order when an underlying modeless surface becomes modal', () => {
    const onBaseClose = vi.fn();
    const onTopClose = vi.fn();
    const view = render(
      <LayeredDialogHarness baseModal={false} onBaseClose={onBaseClose} onTopClose={onTopClose} />,
    );
    const baseDialog = view.getByTestId('layered-base');
    const topDialog = view.getByTestId('layered-top');
    const baseTitle = view.container.querySelector<HTMLElement>('#layered-base-title');
    const topTitle = view.container.querySelector<HTMLElement>('#layered-top-title');

    expect(document.activeElement).toBe(topTitle);
    expect(baseDialog).toHaveAttribute('inert');
    expect(baseDialog).toHaveAttribute('aria-hidden', 'true');

    view.rerender(
      <LayeredDialogHarness baseModal onBaseClose={onBaseClose} onTopClose={onTopClose} />,
    );

    expect(document.activeElement).toBe(topTitle);
    expect(topDialog).not.toHaveAttribute('inert');
    expect(topDialog).not.toHaveAttribute('aria-hidden');
    expect(baseDialog).toHaveAttribute('inert');
    expect(baseDialog).toHaveAttribute('aria-hidden', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onTopClose).toHaveBeenCalledOnce();
    expect(onBaseClose).not.toHaveBeenCalled();
    expect(view.queryByTestId('layered-top')).not.toBeInTheDocument();
    expect(baseDialog).not.toHaveAttribute('inert');
    expect(baseDialog).not.toHaveAttribute('aria-hidden');
    expect(document.activeElement).toBe(baseTitle);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onBaseClose).toHaveBeenCalledOnce();
    view.unmount();
  });

  it('keeps the top modal isolated when an underlying modal becomes modeless', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    const onBaseClose = vi.fn();
    const onTopClose = vi.fn();
    const view = render(
      <LayeredDialogHarness baseModal onBaseClose={onBaseClose} onTopClose={onTopClose} />,
    );
    const baseDialog = view.getByTestId('layered-base');
    const topDialog = view.getByTestId('layered-top');
    const topTitle = view.container.querySelector<HTMLElement>('#layered-top-title');

    expect(document.activeElement).toBe(topTitle);
    expect(outside).toHaveAttribute('inert');
    expect(baseDialog).toHaveAttribute('inert');

    view.rerender(
      <LayeredDialogHarness baseModal={false} onBaseClose={onBaseClose} onTopClose={onTopClose} />,
    );

    expect(document.activeElement).toBe(topTitle);
    expect(outside).toHaveAttribute('inert');
    expect(outside).toHaveAttribute('aria-hidden', 'true');
    expect(baseDialog).toHaveAttribute('inert');
    expect(baseDialog).toHaveAttribute('aria-hidden', 'true');
    expect(topDialog).not.toHaveAttribute('inert');
    expect(topDialog).not.toHaveAttribute('aria-hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onTopClose).toHaveBeenCalledOnce();
    expect(onBaseClose).not.toHaveBeenCalled();

    view.unmount();
    outside.remove();
  });

  it('moves outside focus into a top surface when it becomes modal', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    const onClose = vi.fn();
    const view = render(<ResponsiveDialogHarness modal={false} onClose={onClose} />);
    const title = view.getByRole('heading', { name: 'Responsive reader' });

    outside.focus();
    expect(document.activeElement).toBe(outside);
    expect(outside).not.toHaveAttribute('inert');

    view.rerender(<ResponsiveDialogHarness modal onClose={onClose} />);

    expect(outside).toHaveAttribute('inert');
    expect(outside).toHaveAttribute('aria-hidden', 'true');
    expect(document.activeElement).toBe(title);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    view.unmount();
    outside.remove();
  });
});
