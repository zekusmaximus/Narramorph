import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface DialogFocusOptions {
  focusKey?: string | number | null;
  initialFocusSelector?: string;
  modal?: boolean;
  preferFallback?: boolean;
  restoreFocus?: () => HTMLElement | null;
}

interface IsolatedElement {
  element: HTMLElement;
  hadInertAttribute: boolean;
  previousAriaHidden: string | null;
}

interface ActiveDialogEntry {
  dialog: HTMLElement;
  initialFocusSelector?: string;
  modal: boolean;
  restoreBackground: (() => void) | null;
}

const activeDialogStack: ActiveDialogEntry[] = [];

function isTopDialog(entry: ActiveDialogEntry): boolean {
  return activeDialogStack[activeDialogStack.length - 1] === entry;
}

function setDialogIsolation(entry: ActiveDialogEntry, isolated: boolean): void {
  if (isolated && entry.restoreBackground === null) {
    entry.restoreBackground = isolateBackground(entry.dialog);
  } else if (!isolated && entry.restoreBackground !== null) {
    entry.restoreBackground();
    entry.restoreBackground = null;
  }
}

function syncDialogIsolation(): void {
  // Isolation snapshots can overlap while surfaces mount or change modality.
  // Unwind from the top down so older snapshots restore last, then take one
  // fresh snapshot for the current top modal.
  for (const entry of [...activeDialogStack].reverse()) {
    setDialogIsolation(entry, false);
  }

  const topDialog = activeDialogStack[activeDialogStack.length - 1];
  if (topDialog?.modal) {
    setDialogIsolation(topDialog, true);
  }
}

function focusDialog(entry: ActiveDialogEntry): void {
  if (!entry.dialog.isConnected) {
    return;
  }
  const initialTarget = entry.initialFocusSelector
    ? entry.dialog.querySelector<HTMLElement>(entry.initialFocusSelector)
    : null;
  (initialTarget ?? entry.dialog).focus({ preventScroll: true });
}

function getFocusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.closest('[inert]') && element.getAttribute('aria-hidden') !== 'true',
  );
}

function isolateBackground(dialog: HTMLElement): () => void {
  const isolated: IsolatedElement[] = [];
  let current: HTMLElement = dialog;

  while (current.parentElement) {
    const parent = current.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (!(sibling instanceof HTMLElement) || sibling === current) {
        continue;
      }
      isolated.push({
        element: sibling,
        hadInertAttribute: sibling.hasAttribute('inert'),
        previousAriaHidden: sibling.getAttribute('aria-hidden'),
      });
      sibling.setAttribute('inert', '');
      sibling.setAttribute('aria-hidden', 'true');
    }

    if (parent === document.body) {
      break;
    }
    current = parent;
  }

  return () => {
    for (const { element, hadInertAttribute, previousAriaHidden } of isolated.reverse()) {
      if (!hadInertAttribute) {
        element.removeAttribute('inert');
      }
      if (previousAriaHidden === null) {
        element.removeAttribute('aria-hidden');
      } else {
        element.setAttribute('aria-hidden', previousAriaHidden);
      }
    }
  };
}

function canReceiveRestoredFocus(element: HTMLElement | null): element is HTMLElement {
  const style = element ? window.getComputedStyle(element) : null;
  return Boolean(
    element?.isConnected &&
    element !== document.body &&
    element !== document.documentElement &&
    !element.hasAttribute('disabled') &&
    element.getAttribute('aria-disabled') !== 'true' &&
    !element.closest('[aria-hidden="true"]') &&
    !element.closest('[inert]') &&
    style?.display !== 'none' &&
    style?.visibility !== 'hidden',
  );
}

function tryRestoreFocus(element: HTMLElement | null): boolean {
  if (!canReceiveRestoredFocus(element)) {
    return false;
  }
  element.focus({ preventScroll: true });
  return document.activeElement === element;
}

/**
 * Applies dialog focus, Escape, containment, restoration, and modal background isolation.
 */
export function useDialogFocus(
  open: boolean,
  onClose: () => void,
  options: DialogFocusOptions = {},
): RefObject<HTMLDivElement> {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const restoreFocusRef = useRef(options.restoreFocus);
  const preferFallbackRef = useRef(options.preferFallback ?? false);
  const modalRef = useRef(options.modal ?? true);
  const initialFocusSelectorRef = useRef(options.initialFocusSelector);
  const stackEntryRef = useRef<ActiveDialogEntry | null>(null);
  onCloseRef.current = onClose;
  restoreFocusRef.current = options.restoreFocus;
  preferFallbackRef.current = options.preferFallback ?? false;
  modalRef.current = options.modal ?? true;
  initialFocusSelectorRef.current = options.initialFocusSelector;
  const modal = options.modal ?? true;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }
    const stackEntry: ActiveDialogEntry = {
      dialog,
      initialFocusSelector: initialFocusSelectorRef.current,
      modal: modalRef.current,
      restoreBackground: null,
    };
    stackEntryRef.current = stackEntry;
    activeDialogStack.push(stackEntry);
    syncDialogIsolation();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!isTopDialog(stackEntry)) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (!stackEntry.modal || event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) {
        return;
      }
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (
        !(document.activeElement instanceof HTMLElement) ||
        !focusable.includes(document.activeElement)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const wasTopDialog = isTopDialog(stackEntry);
      setDialogIsolation(stackEntry, false);
      const stackIndex = activeDialogStack.lastIndexOf(stackEntry);
      if (stackIndex >= 0) {
        activeDialogStack.splice(stackIndex, 1);
      }
      if (stackEntryRef.current === stackEntry) {
        stackEntryRef.current = null;
      }
      syncDialogIsolation();
      if (!wasTopDialog) {
        return;
      }
      const fallback = restoreFocusRef.current?.() ?? null;
      const primaryTarget = preferFallbackRef.current ? fallback : previouslyFocused;
      const secondaryTarget = preferFallbackRef.current ? previouslyFocused : fallback;
      if (!tryRestoreFocus(primaryTarget) && !tryRestoreFocus(secondaryTarget)) {
        const nextTopDialog = activeDialogStack[activeDialogStack.length - 1];
        if (nextTopDialog) {
          focusDialog(nextTopDialog);
        }
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const stackEntry = stackEntryRef.current;
    if (!stackEntry) {
      return;
    }
    const becameModal = !stackEntry.modal && modal;
    stackEntry.modal = modal;
    syncDialogIsolation();
    if (
      becameModal &&
      isTopDialog(stackEntry) &&
      !stackEntry.dialog.contains(document.activeElement)
    ) {
      focusDialog(stackEntry);
    }
  }, [modal, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const stackEntry = stackEntryRef.current;
    if (!stackEntry || !isTopDialog(stackEntry)) {
      return;
    }
    stackEntry.initialFocusSelector = options.initialFocusSelector;
    focusDialog(stackEntry);
  }, [open, options.focusKey, options.initialFocusSelector]);

  return dialogRef;
}
