import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

import type { StoryNode, VisitRecord } from '@/types';

// Custom render function for testing components
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => render(ui, { ...options });

// Re-export testing library functions
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { customRender as render };

// Test utilities and mock data
export const mockNode: StoryNode = {
  id: 'test-001',
  character: 'archaeologist',
  layer: 1,
  title: 'Test Node',
  position: { x: 100, y: 200 },
  content: {
    initial: 'This is the initial content for testing.',
    firstRevisit: 'This is the first revisit content for testing.',
    metaAware: 'This is the meta-aware content for testing.',
  },
  connections: [
    {
      targetId: 'test-002',
      type: 'temporal',
      label: 'Continue',
    },
  ],
  visualState: {
    defaultColor: '#4A90E2',
    size: 30,
    shape: 'circle',
  },
  metadata: {
    estimatedReadTime: 3,
    thematicTags: ['test', 'example'],
    narrativeAct: 1,
    criticalPath: false,
  },
};

export const mockVisitRecord: VisitRecord = {
  visitCount: 1,
  visitTimestamps: ['2025-01-01T00:00:00Z'],
  currentState: 'initial',
  timeSpent: 0,
  lastVisited: '2025-01-01T00:00:00Z',
};

// Helper function to create test nodes
export function createTestNode(overrides: Partial<StoryNode> = {}): StoryNode {
  return {
    ...mockNode,
    ...overrides,
    id: overrides.id || `test-${Math.random().toString(36).substr(2, 9)}`,
  };
}

// Helper function to create test visit records
export function createTestVisitRecord(overrides: Partial<VisitRecord> = {}): VisitRecord {
  return {
    ...mockVisitRecord,
    ...overrides,
  };
}
