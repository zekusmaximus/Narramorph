import { beforeEach, describe, expect, it } from 'vitest';

import { createInitialProgress } from '@/domain/progress/progressModel';
import type { SelectionReason, StoryNode } from '@/types';

import { useStoryStore } from './storyStore';

const node: StoryNode = {
  id: 'arch-test',
  character: 'archaeologist',
  layer: 1,
  title: 'A Test Fragment',
  position: { x: 0, y: 0 },
  content: { initial: 'Reader prose', firstRevisit: 'Return prose', metaAware: 'Aware prose' },
  connections: [],
  visualState: { defaultColor: '#4A90E2', size: 30 },
  metadata: {
    estimatedReadTime: 1,
    thematicTags: [],
    narrativeAct: 1,
    criticalPath: false,
  },
};

const passageReason: SelectionReason = {
  contract: 'org.narramorph.selection-reason',
  schemaVersion: '1.0.0',
  selectionKind: 'passage-variation',
  outcome: 'exact',
  templateKey: 'selection.first_visit',
  parameters: {},
  triggers: [],
};

describe('story selection ledger', () => {
  beforeEach(() => {
    const progress = createInitialProgress();
    const selectedAt = '2026-07-15T12:00:00.000Z';
    progress.readingPath = [node.id];
    progress.visitedNodes[node.id] = {
      visitCount: 1,
      visitTimestamps: [selectedAt],
      currentState: 'initial',
      timeSpent: 0,
      lastVisited: selectedAt,
      variationId: null,
      recentVariationIds: [],
    };
    useStoryStore.setState({
      nodes: new Map([[node.id, node]]),
      progress,
      activeVisit: { nodeId: node.id, startTime: Date.now() },
    });
  });

  it('persists one explanation snapshot for duplicate effects', () => {
    const selection = {
      variationId: 'arch-test-internal-001',
      passageTitle: node.title,
      content: '# Reader prose with **emphasis**.',
      reason: passageReason,
    };

    useStoryStore.getState().recordActiveVisitSelection(selection);
    useStoryStore.getState().recordActiveVisitSelection(selection);

    const progress = useStoryStore.getState().progress;
    expect(progress.selectionRecords).toHaveLength(1);
    expect(progress.selectionRecords[0]).toMatchObject({
      sequence: 1,
      passageTitle: node.title,
      excerpt: 'Reader prose with emphasis.',
      visitNumber: 1,
      explanation: 'This version meets you on your first visit to this passage.',
    });
    expect(progress.visitedNodes[node.id]?.variationId).toBe('arch-test-internal-001');
  });

  it('records separate L3 fragments without replacing the visit variation', () => {
    const l3Reason: SelectionReason = {
      ...passageReason,
      selectionKind: 'l3-section',
      templateKey: 'selection.l3_assembly',
      parameters: { journey: 'the path taken', philosophy: 'acceptance' },
    };

    useStoryStore.getState().recordActiveVisitSelection({
      variationId: 'l3-arch-internal',
      passageTitle: 'The Convergence',
      fragmentLabel: 'Archaeologist Perspective',
      content: 'Only this section.',
      reason: l3Reason,
    });

    const progress = useStoryStore.getState().progress;
    expect(progress.selectionRecords).toHaveLength(1);
    expect(progress.selectionRecords[0]?.fragmentLabel).toBe('Archaeologist Perspective');
    expect(progress.visitedNodes[node.id]?.variationId).toBeNull();
  });
});
