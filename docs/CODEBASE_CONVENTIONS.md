# Narramorph Fiction Codebase Conventions

This document establishes and tracks coding patterns, naming conventions, and architectural decisions for the project. Update this as new patterns emerge during development.

## File Organization

### Directory Structure
narramorph-fiction/
├── src/
│   ├── components/          # React components
│   │   ├── NodeMap/         # Node visualization components
│   │   ├── StoryView/       # Story reading components
│   │   ├── UI/              # Reusable UI components
│   │   └── Layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand state management
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── data/                # Story content (JSON)
│   ├── styles/              # Global styles
│   └── pages/               # Top-level page components
├── public/                  # Static assets
└── tests/                   # Test files

### File Naming

- **Components**: PascalCase with `.tsx` extension
  - `NodeMap.tsx`, `StoryView.tsx`, `Button.tsx`
  
- **Hooks**: camelCase starting with `use`, `.ts` extension
  - `useNodeState.ts`, `useKeyboardNavigation.ts`
  
- **Utilities**: camelCase with `.ts` extension
  - `transformations.ts`, `validation.ts`, `storage.ts`
  
- **Types**: PascalCase with `.ts` extension
  - `Node.ts`, `Store.ts`, `Story.ts`
  
- **Tests**: Match source file name with `.test.ts` or `.test.tsx`
  - `NodeMap.test.tsx`, `transformations.test.ts`

### Component File Structure

One component per file. Complex components get their own directory:
components/
NodeMap/
NodeMap.tsx           # Main component
Node.tsx              # Child component
Connection.tsx        # Child component
NodeMap.module.css    # Component-specific styles (if needed)
index.ts              # Re-exports

## Naming Conventions

### Variables and Functions

- **camelCase** for variables and functions
```typescript
  const visitCount = 0;
  function calculateTransformationState() {}

PascalCase for React components and classes

typescript  function NodeMap() {}
  class DataValidator {}

SCREAMING_SNAKE_CASE for constants

typescript  const MAX_NODE_COUNT = 100;
  const DEFAULT_ZOOM_LEVEL = 1.0;
Event Handlers
Prefix with handle:
typescriptconst handleNodeClick = () => {};
const handleKeyPress = () => {};
const handleSave = () => {};
Boolean Variables
Prefix with is, has, should, can:
typescriptconst isVisible = true;
const hasTransform = false;
const shouldAnimate = true;
const canNavigate = false;
Type Names

Interfaces: Descriptive nouns in PascalCase

typescript  interface StoryNode {}
  interface UserProgress {}
  interface VisitRecord {}

Types: Descriptive, often with Type suffix for unions

typescript  type TransformationState = 'initial' | 'firstRevisit' | 'metaAware';
  type ConnectionType = 'temporal' | 'consciousness' | 'recursive';

Enums: PascalCase for name, SCREAMING_SNAKE_CASE for values

typescript  enum CharacterType {
    ARCHAEOLOGIST = 'archaeologist',
    ALGORITHM = 'algorithm',
    HUMAN = 'human'
  }
IDs and Keys

Node IDs: {character}-{number}

archaeologist-001, algorithm-015, human-042


Connection IDs: conn-{number} or descriptive

conn-001, recursive-loop-001


Transformation IDs: Descriptive kebab-case

recursive-recognition, memory-convergence



TypeScript Conventions
Strict Mode
TypeScript strict mode enabled. All code must:

Have explicit types (no implicit any)
Handle null and undefined explicitly
Use strict null checks

Type Definitions
Prefer interfaces for objects:
typescriptinterface NodeVisualState {
  defaultColor: string;
  size: number;
  shape?: NodeShape;
}
Use type aliases for unions, primitives, functions:
typescripttype TransformationState = 'initial' | 'firstRevisit' | 'metaAware';
type ValidationFunction = (node: StoryNode) => boolean;
Export types from dedicated files:
typescript// src/types/Node.ts
export interface StoryNode { /*...*/ }
export type TransformationState = /*...*/;
Function Signatures
Always type parameters and return values:
typescriptfunction determineTransformationState(
  nodeId: string,
  visitRecord: VisitRecord | undefined,
  node: StoryNode
): TransformationState {
  // implementation
}
Use arrow functions for callbacks:
typescriptconst handleClick = (nodeId: string): void => {
  // implementation
};
Optional Properties
Use ? for optional properties, avoid | undefined unless semantically different:
typescriptinterface NodeConnection {
  targetId: string;
  label?: string;  // Optional
  type: ConnectionType;
}
React Patterns
Functional Components Only
Use functional components with hooks. No class components:
typescript// ✅ Good
function NodeMap({ nodes }: NodeMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  return <div>{/* ... */}</div>;
}

// ❌ Bad
class NodeMap extends React.Component {
  // Don't use classes
}
Component Structure
Standard component order:
typescript// 1. Imports
import { useState } from 'react';
import { StoryNode } from '@/types/Node';

// 2. Types/Interfaces
interface NodeMapProps {
  nodes: StoryNode[];
  onNodeClick: (id: string) => void;
}

// 3. Component
function NodeMap({ nodes, onNodeClick }: NodeMapProps) {
  // 3a. Hooks
  const [selected, setSelected] = useState<string | null>(null);
  const store = useStoryStore();
  
  // 3b. Derived state
  const visibleNodes = useMemo(() => 
    nodes.filter(n => /* ... */), 
    [nodes]
  );
  
  // 3c. Event handlers
  const handleClick = useCallback((id: string) => {
    setSelected(id);
    onNodeClick(id);
  }, [onNodeClick]);
  
  // 3d. Effects
  useEffect(() => {
    // side effects
  }, []);
  
  // 3e. Render
  return <div>{/* ... */}</div>;
}

// 4. Export
export default NodeMap;
Props Destructuring
Always destructure props in function signature:
typescript// ✅ Good
function Node({ id, title, onClick }: NodeProps) {}

// ❌ Bad
function Node(props: NodeProps) {
  const { id, title } = props;
}
Hooks Usage
useState: For local component state
typescriptconst [count, setCount] = useState<number>(0);
useEffect: For side effects, always include dependency array
typescriptuseEffect(() => {
  // side effect
  return () => {
    // cleanup
  };
}, [dependencies]);
useMemo: For expensive calculations
typescriptconst expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
useCallback: For memoized callbacks passed to children
typescriptconst handleClick = useCallback((id: string) => {
  // handler
}, [/* dependencies */]);
Custom Hooks
Create custom hooks for reusable logic:
typescript// src/hooks/useNodeState.ts
export function useNodeState(nodeId: string) {
  const store = useStoryStore();
  
  const nodeState = useMemo(() => {
    return store.getNodeState(nodeId);
  }, [nodeId, store]);
  
  const visitNode = useCallback(() => {
    store.visitNode(nodeId);
  }, [nodeId, store]);
  
  return { nodeState, visitNode };
}
State Management (Zustand)
Store Structure
One main store for application state:
typescript// src/stores/storyStore.ts
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface StoryStore {
  // State
  nodes: Map<string, StoryNode>;
  progress: UserProgress;
  
  // Actions
  visitNode: (nodeId: string) => void;
  saveProgress: () => void;
}

export const useStoryStore = create<StoryStore>()(
  immer((set, get) => ({
    // Initial state
    nodes: new Map(),
    progress: { /* ... */ },
    
    // Actions
    visitNode: (nodeId: string) => {
      set((state) => {
        // Mutations via immer
      });
      get().saveProgress(); // Side effects
    },
    
    saveProgress: () => {
      // Implementation
    }
  }))
);
Action Patterns
Use immer for state mutations:
typescriptvisitNode: (nodeId: string) => {
  set((state) => {
    // Direct mutation works with immer
    state.progress.visitedNodes[nodeId] = {
      visitCount: 1,
      currentState: 'initial'
    };
  });
}
Side effects after state updates:
typescriptvisitNode: (nodeId: string) => {
  set((state) => {
    // State update
  });
  
  // Side effects use get()
  get().saveProgress();
  get().checkUnlocks();
}
Error handling in actions:
typescriptvisitNode: (nodeId: string) => {
  const node = get().nodes.get(nodeId);
  
  if (!node) {
    console.error(`Node not found: ${nodeId}`);
    return; // Early return on error
  }
  
  // Continue with valid data
}
Selectors
Create selector functions for derived state:
typescriptinterface StoryStore {
  // ... state
  
  // Selectors
  getNodeState: (node Id: string) => NodeUIState;
getVisitCount: (nodeId: string) => number;
getTransformationState: (nodeId: string) => TransformationState;
}// Implementation
const useStoryStore = create<StoryStore>()(
immer((set, get) => ({
// ... state and actionsgetNodeState: (nodeId: string) => {
  const state = get();
  const node = state.nodes.get(nodeId);
  const visitRecord = state.progress.visitedNodes[nodeId];  // Compute and return derived state
  return {
    id: nodeId,
    visited: !!visitRecord,
    visitCount: visitRecord?.visitCount || 0,
    currentState: visitRecord?.currentState || 'initial',
    // ... more properties
  };
}
}))
);

## Styling Conventions

### Tailwind CSS

Primary styling method using utility classes:
```tsx// ✅ Good - Tailwind utilities
<div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
  <span className="text-lg font-semibold text-gray-900">Title</span>
</div>// ❌ Bad - Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  <span style={{ fontSize: '18px' }}>Title</span>
</div>
```
Conditional Classes
Use template literals for conditional classes:
<div className={`
  base-class 
  ${isActive ? 'bg-blue-500' : 'bg-gray-500'}
  ${isLarge ? 'text-xl' : 'text-base'}
`}>
  Content
</div>
```
Or use a utility function:
import { clsx } from 'clsx';<div className={clsx(
  'base-class',
  isActive && 'bg-blue-500',
  isLarge && 'text-xl'
)}>
  Content
</div>
```
Responsive Design
Mobile-first approach with Tailwind breakpoints:
<div className="
  text-sm         // mobile
  md:text-base    // tablet
  lg:text-lg      // desktop
">
  Responsive text
</div>
```
Animations
Use Framer Motion for animations:
import { motion } from 'framer-motion';<motion.div
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.9 }}
transition={{ duration: 0.2 }}


Animated content
</motion.div>

## Error Handling

### Try-Catch Blocks

Use for operations that may fail:
```typescriptasync function loadStory(storyId: string): Promise<StoryData | null> {
try {
const response = await fetch(/data/stories/${storyId}/story.json);if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}const data = await response.json();
return data;
} catch (error) {
console.error('Failed to load story:', error);
// Handle error appropriately
return null;
}
}

### Validation

Validate external data before use:
```typescriptfunction validateNode(data: any): data is StoryNode {
return (
typeof data.id === 'string' &&
typeof data.title === 'string' &&
data.content &&
typeof data.content.initial === 'string' &&
Array.isArray(data.connections)
);
}function loadNodes(data: any[]): StoryNode[] {
return data.filter(validateNode);
}

### Error Boundaries (React)

Wrap components that may fail:
```tsximport { ErrorBoundary } from 'react-error-boundary';function ErrorFallback({ error }: { error: Error }) {
return (
<div className="p-4 bg-red-100 text-red-900">
<h2>Something went wrong</h2>
<pre>{error.message}</pre>
</div>
);
}<ErrorBoundary FallbackComponent={ErrorFallback}>
  <NodeMap />
</ErrorBoundary>
```
Testing Conventions
Test File Organization
Mirror source structure:
src/
components/
NodeMap.tsx
utils/
transformations.tstests/
components/
NodeMap.test.tsx
utils/
transformations.test.ts

### Test Structure

Use describe/it pattern:
```typescriptimport { describe, it, expect } from 'vitest';describe('determineTransformationState', () => {
it('returns "initial" for first visit', () => {
const result = determineTransformationState(
'node-001',
undefined,
[],
mockNode
);expect(result).toBe('initial');
});it('returns "firstRevisit" for second visit', () => {
const visitRecord: VisitRecord = {
visitCount: 1,
currentState: 'initial',
visitTimestamps: ['2025-01-01T00:00:00Z'],
timeSpent: 0,
lastVisited: '2025-01-01T00:00:00Z'
};const result = determineTransformationState(
  'node-001',
  visitRecord,
  [],
  mockNode
);expect(result).toBe('firstRevisit');
});it('handles special transformations', () => {
// Test implementation
});
});

### Component Testing

Use React Testing Library:
```typescriptimport { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';describe('NodeMap', () => {
it('renders nodes', () => {
const nodes = [
{ id: 'node-001', title: 'Test Node', /* ... */ }
];render(<NodeMap nodes={nodes} />);expect(screen.getByText('Test Node')).toBeInTheDocument();
});it('calls onNodeClick when node is clicked', () => {
const handleClick = vi.fn();
const nodes = [{ id: 'node-001', title: 'Test Node', /* ... */ }];render(<NodeMap nodes={nodes} onNodeClick={handleClick} />);fireEvent.click(screen.getByText('Test Node'));expect(handleClick).toHaveBeenCalledWith('node-001');
});
});

### Mock Data

Create reusable test fixtures:
```typescript// tests/fixtures/nodes.ts
export const mockNode: StoryNode = {
id: 'test-001',
character: 'archaeologist',
title: 'Test Node',
position: { x: 0, y: 0 },
content: {
initial: 'Initial content',
firstRevisit: 'First revisit content',
metaAware: 'Meta-aware content'
},
connections: [],
visualState: {
defaultColor: '#4A90E2',
size: 30
},
metadata: {
estimatedReadTime: 3,
thematicTags: ['test'],
narrativeAct: 1,
criticalPath: false
}
};

## Comments and Documentation

### JSDoc for Public APIs

Document all exported functions and types:
```typescript/**

Determines the transformation state for a node based on visit history
and unlock conditions.

@param nodeId - The unique identifier of the node
@param visitRecord - The visit history for this node, if any
@param unlockedTransformations - Array of special transformations unlocked
@param node - The node definition
@returns The current transformation state

@example



const state = determineTransformationState(
'archaeologist-001',
visitRecord,
[],
node
);
// Returns: 'firstRevisit'




*/
export function determineTransformationState(
nodeId: string,
visitRecord: VisitRecord | undefined,
unlockedTransformations: UnlockedTransformation[],
node: StoryNode
): TransformationState {
// Implementation
}

### Inline Comments

Use sparingly for complex logic:
```typescriptfunction checkSpecialTransformations(nodeId: string) {
// Check each node's unlock conditions
for (const node of nodes) {
if (!node.unlockConditions) continue;// Special transformations require ALL prerequisite nodes visited
const hasPrerequisites = transform.requiredPriorNodes.every(
  id => progress.visitedNodes[id] // Already visited
);if (!hasPrerequisites) continue;// Unlock the transformation
unlockTransformation(node.id, transform.id);
}
}

### TODO Comments

Avoid in production code. If necessary, include context and ticket reference:
```typescript// TODO(#123): Optimize this for large graphs
// Current implementation re-renders all nodes. Consider virtualization
// when node count exceeds 100. See performance investigation in ticket.

## Import Conventions

### Import Order

1. External libraries (React, third-party)
2. Internal aliases (types, utils, components)
3. Relative imports
4. CSS/styles
```typescript// 1. External
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';// 2. Internal (using path aliases)
import { StoryNode, TransformationState } from '@/types/Node';
import { useStoryStore } from '@/stores/storyStore';
import { Button } from '@/components/UI/Button';// 3. Relative
import { NodeVisual } from './NodeVisual';
import { calculatePosition } from './utils';// 4. Styles
import './NodeMap.css';

### Path Aliases

Configure in `tsconfig.json`:
```json{
"compilerOptions": {
"baseUrl": ".",
"paths": {
"@/": ["src/"],
"@/components/": ["src/components/"],
"@/types/": ["src/types/"],
"@/utils/": ["src/utils/"],
"@/stores/": ["src/stores/"],
"@/hooks/": ["src/hooks/"]
}
}
}

Use in imports:
```typescriptimport { StoryNode } from '@/types/Node';
import { Button } from '@/components/UI/Button';
import { useNodeState } from '@/hooks/useNodeState';

## Performance Best Practices

### React Optimization

**Memoize expensive calculations**:
```typescriptconst sortedNodes = useMemo(() => {
return nodes.sort((a, b) => a.position.x - b.position.x);
}, [nodes]);

**Memoize callbacks passed to children**:
```typescriptconst handleNodeClick = useCallback((nodeId: string) => {
visitNode(nodeId);
}, [visitNode]);

**Memoize components that rarely change**:
```typescriptconst Node = React.memo(({ id, title, onClick }: NodeProps) => {
return <div onClick={() => onClick(id)}>{title}</div>;
});

### Avoid Unnecessary Re-renders

**Split state appropriately**:
```typescript// ❌ Bad - causes re-render of entire component
const [state, setState] = useState({
nodes: [],
selected: null,
viewport: {}
});// ✅ Good - independent state updates
const [nodes, setNodes] = useState([]);
const [selected, setSelected] = useState(null);
const [viewport, setViewport] = useState({});

### Lazy Loading

Load heavy components lazily:
```typescriptimport { lazy, Suspense } from 'react';const StoryView = lazy(() => import('./components/StoryView'));function App() {
return (
<Suspense fallback={<div>Loading...</div>}>
<StoryView />
</Suspense>
);
}

## Accessibility

### Keyboard Navigation

Support keyboard for all interactions:
```tsx<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Interactive element
</div>
```
ARIA Labels
Provide context for screen readers:
<button
aria-label="Visit archaeologist node 001"
aria-pressed={isSelected}


  <NodeIcon />
</button><div
  role="region"
  aria-label="Story node map"
  aria-describedby="map-description"
>
  <p id="map-description" className="sr-only">
    Interactive map showing story nodes. Use arrow keys to navigate.
  </p>
  {/* Map content */}
</div>
```
Focus Management
Ensure visible focus indicators:
/* Global focus styles */
*:focus-visible {
outline: 2px solid theme('colors.blue.500');
outline-offset: 2px;
}

### Semantic HTML

Use appropriate elements:
```tsx// ✅ Good
<button onClick={handleClick}>Click me</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>// ❌ Bad
<div onClick={handleClick}>Click me</div>
<div className="nav">...</div>
<div className="main">...</div>
```
Git Commit Conventions
Commit Message Format
<type>(<scope>): <subject><body><footer>
```
Types:

feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting, no logic change)
refactor: Code refactoring
test: Adding or updating tests
chore: Build process, dependencies, tooling

Examples:
feat(store): add visit tracking to Zustand storeImplement visitNode action that records visits, updates transformation
states, and persists to localStorage.Closes #45fix(NodeMap): prevent crash on missing node dataAdd null check before accessing node properties to handle edge case
where node data hasn't loaded yet.docs(README): update setup instructionsAdd section on environment variables and clarify dependency versions.

### Branch Naming

- Feature: `feature/visit-tracking`
- Bug fix: `fix/node-rendering-crash`
- Documentation: `docs/api-documentation`
- Refactor: `refactor/state-management`

## Code Review Checklist

Before submitting code for review, verify:

- [ ] TypeScript strict mode compliance (no `any`, proper types)
- [ ] All functions have JSDoc comments
- [ ] No TODO comments in production code
- [ ] Error handling for all async operations
- [ ] Tests written and passing
- [ ] Accessibility requirements met (keyboard nav, ARIA labels)
- [ ] Performance considerations addressed (memoization where needed)
- [ ] Follows established patterns from this document
- [ ] No console.logs in production code (use proper logging)
- [ ] Responsive design tested on multiple screen sizes
- [ ] Browser compatibility verified

## Common Patterns Library

### Loading States
```typescriptfunction DataComponent() {
const [data, setData] = useState<Data | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);useEffect(() => {
async function load() {
try {
setLoading(true);
const result = await fetchData();
setData(result);
} catch (err) {
setError(err as Error);
} finally {
setLoading(false);
}
}load();
}, []);if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;return <DataDisplay data={data} />;
}

### Modal Pattern
```typescriptfunction Modal({ isOpen, onClose, children }: ModalProps) {
useEffect(() => {
if (!isOpen) return;const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') onClose();
};document.addEventListener('keydown', handleEscape);
return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);if (!isOpen) return null;return (
<div 
   className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
   onClick={onClose}
 >
<div
className="bg-white rounded-lg p-6 max-w-2xl"
onClick={(e) => e.stopPropagation()}
>
{children}
</div>
</div>
);
}

### Debounced Input
```typescriptfunction useDebounce<T>(value: T, delay: number): T {
const [debouncedValue, setDebouncedValue] = useState<T>(value);useEffect(() => {
const handler = setTimeout(() => {
setDebouncedValue(value);
}, delay);return () => clearTimeout(handler);
}, [value, delay]);return debouncedValue;
}// Usage
function SearchInput() {
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);useEffect(() => {
if (debouncedQuery) {
performSearch(debouncedQuery);
}
}, [debouncedQuery]);return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

## Anti-Patterns to Avoid

### ❌ Direct State Mutation
```typescript// Bad
const node = state.nodes.get(id);
node.visitCount++; // Direct mutation// Good
set((state) => {
const node = state.nodes.get(id);
if (node) {
node.visitCount++; // Safe with immer
}
});

### ❌ Prop Drilling
```typescript// Bad - passing props through many levels
<GrandParent data={data}>
<Parent data={data}>
<Child data={data} />
</Parent>
</GrandParent>// Good - use context or store
const data = useStoryStore((state) => state.data);

### ❌ Massive Components
```typescript// Bad - 500+ line component doing everything// Good - split into smaller, focused components
function NodeMap() {
return (
<div>
<NodeMapControls />
<NodeMapCanvas />
<NodeMapMiniMap />
</div>
);
}

### ❌ Magic Numbers
```typescript// Bad
if (visitCount >= 3) { /* ... */ }// Good
const META_AWARE_THRESHOLD = 3;
if (visitCount >= META_AWARE_THRESHOLD) { /* ... */ }

## Project-Specific Patterns

### Node State Determination

Standard pattern for determining node state:
```typescriptfunction getNodeCurrentState(nodeId: string): TransformationState {
const visitRecord = progress.visitedNodes[nodeId];// Check special transformations first
const hasSpecialTransform = specialTransformations.some(
t => t.nodeId === nodeId
);
if (hasSpecialTransform) return 'metaAware';// Standard visit-based transformation
const visitCount = visitRecord?.visitCount || 0;
if (visitCount === 0) return 'initial';
if (visitCount === 1) return 'firstRevisit';
return 'metaAware';
}

### localStorage Interaction

Standard pattern for localStorage operations:
```typescriptfunction saveToStorage<T>(key: string, data: T): boolean {
try {
const json = JSON.stringify(data);
localStorage.setItem(key, json);
return true;
} catch (error) {
if (error instanceof Error && error.name === 'QuotaExceededError') {
console.warn('Storage quota exceeded');
// Handle quota exceeded
} else {
console.error('Failed to save to storage:', error);
}
return false;
}
}function loadFromStorage<T>(key: string): T | null {
try {
const json = localStorage.getItem(key);
if (!json) return null;
return JSON.parse(json) as T;
} catch (error) {
console.error('Failed to load from storage:', error);
return null;
}
}

---

## Living Document

This document evolves with the project. When establishing new patterns:

1. Document the pattern here with examples
2. Note the rationale for the decision
3. Update related documentation (ADRs, README)
4. Ensure team consistency moving forward

**Last Updated**: [Initial creation]
**Next Review**: [After Phase 1 completion]