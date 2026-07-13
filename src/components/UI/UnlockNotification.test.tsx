import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialPreferences } from '@/domain/progress/progressModel';
import { useStoryStore } from '@/stores/storyStore';
import type { StoryNode } from '@/types';
import type { NodeUnlockConfig } from '@/types/Unlock';

import { UnlockNotificationSystem } from './UnlockNotification';

let animationFrameId = 0;
let animationFrames = new Map<number, FrameRequestCallback>();

function flushAnimationFrames(): void {
  const callbacks = Array.from(animationFrames.values());
  animationFrames.clear();
  act(() => {
    callbacks.forEach((callback) => callback(0));
  });
}

const surfacedNode: StoryNode = {
  id: 'arch-L3',
  character: 'archaeologist',
  layer: 3,
  title: 'The Witnesses Converge',
  position: { x: 0, y: 0 },
  content: { initial: '', firstRevisit: '', metaAware: '' },
  connections: [],
  visualState: { defaultColor: '#fff', size: 1 },
  metadata: {
    estimatedReadTime: 1,
    thematicTags: [],
    narrativeAct: 3,
    criticalPath: true,
  },
};

const unlockConfig: NodeUnlockConfig = {
  nodeId: surfacedNode.id,
  layer: 3,
  defaultLocked: true,
  unlockConditions: [],
  lockedMessage: 'The voices have not met yet.',
  unlockMessage: 'Three lines of memory now touch.',
};

describe('UnlockNotificationSystem', () => {
  const selectNode = vi.fn();
  const openStoryView = vi.fn();

  beforeEach(() => {
    animationFrameId = 0;
    animationFrames = new Map();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      animationFrameId += 1;
      animationFrames.set(animationFrameId, callback);
      return animationFrameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (frameId: number) => {
      animationFrames.delete(frameId);
    });
    selectNode.mockReset();
    openStoryView.mockReset();
    useStoryStore.setState({
      preferences: createInitialPreferences(),
      recentlyUnlockedNodes: [surfacedNode.id],
      nodes: new Map([[surfacedNode.id, surfacedNode]]),
      unlockConfigs: new Map([[surfacedNode.id, unlockConfig]]),
      storyViewOpen: false,
      l3AssemblyViewOpen: false,
      selectNode,
      openStoryView,
      clearUnlockNotifications: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('announces the surfaced passage and exposes one native keyboard action', () => {
    render(<UnlockNotificationSystem />);
    const status = screen.getByRole('status');

    expect(status.textContent).toBe('');
    flushAnimationFrames();
    expect(status.textContent).toContain('A new passage has surfaced: The Witnesses Converge.');
    const action = screen.getByRole('button', {
      name: 'Open newly surfaced passage: The Witnesses Converge',
    });
    fireEvent.click(action);

    expect(selectNode).toHaveBeenCalledWith(surfacedNode.id);
    expect(openStoryView).toHaveBeenCalledWith(surfacedNode.id);
  });

  it('defers both the announcement and action while another reading panel is active', () => {
    useStoryStore.setState({ storyViewOpen: true });
    render(<UnlockNotificationSystem />);

    const status = screen.getByRole('status');
    const actionStack = screen.getByTestId('unlock-notification-stack');
    expect(status.textContent).toBe('');
    expect(actionStack.contains(status)).toBe(false);
    expect(actionStack.classList.contains('invisible')).toBe(true);
  });

  it('mutates the existing live region when the active reading panel closes', () => {
    useStoryStore.setState({ storyViewOpen: true });
    const view = render(<UnlockNotificationSystem />);
    const status = screen.getByRole('status');

    expect(status.textContent).toBe('');
    act(() => {
      useStoryStore.setState({ storyViewOpen: false });
    });
    view.rerender(<UnlockNotificationSystem />);

    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe('');
    flushAnimationFrames();
    expect(status.textContent).toBe('A new passage has surfaced: The Witnesses Converge.');
  });
});
