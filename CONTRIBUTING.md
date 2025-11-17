# Contributing to Narramorph Fiction

Thank you for your interest in contributing to Narramorph Fiction! This document provides guidelines and information for contributors.

## Development Workflow

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/yourusername/narramorph-fiction.git
   cd narramorph-fiction
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

### Before You Start

- **Read the documentation** in `/docs` to understand the project structure
- **Check existing issues** to see if your idea is already being worked on
- **Create an issue** for new features or bugs to discuss the approach

## Code Standards

### TypeScript

- Use **strict TypeScript** - no `any` types allowed
- Provide explicit types for all function parameters and return values
- Use **JSDoc comments** for all exported functions and components

```typescript
/**
 * Determines the transformation state for a node based on visit history
 * @param nodeId - The unique identifier of the node
 * @param visitRecord - The visit history for this node, if any
 * @returns The current transformation state
 */
export function determineTransformationState(
  nodeId: string,
  visitRecord: VisitRecord | undefined,
): TransformationState {
  // Implementation
}
```

### React Components

- Use **functional components** with hooks only
- Follow the **component structure pattern**:

```typescript
function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState();
  const store = useStoryStore();

  // 2. Derived state (useMemo, calculations)
  const computedValue = useMemo(() => {}, [dependencies]);

  // 3. Event handlers (useCallback)
  const handleClick = useCallback(() => {}, [dependencies]);

  // 4. Effects (useEffect)
  useEffect(() => {}, [dependencies]);

  // 5. Render
  return <div>{/* JSX */}</div>;
}
```

- **Destructure props** in the function signature
- Use **path aliases** for imports (`@/components`, `@/types`, etc.)
- Include **accessibility attributes** (ARIA labels, keyboard support)

### Styling

- Use **Tailwind CSS** utility classes
- Follow **mobile-first** responsive design
- Use **semantic color classes** (character-archaeologist, character-algorithm, etc.)
- Implement **dark mode** support where applicable

```tsx
<div
  className={`
  character-${node.character}
  p-4 rounded-lg
  hover:shadow-lg transition-shadow
  dark:bg-gray-800
`}
>
  Content
</div>
```

### State Management

- Use **Zustand with Immer** for state updates
- **Separate state from side effects**:

```typescript
// ✅ Good
visitNode: (nodeId: string) => {
  set((state) => {
    // State mutations with Immer
    state.progress.visitedNodes[nodeId] = newRecord;
  });

  // Side effects after state update
  get().saveProgress();
},

// ❌ Bad - mixing state and side effects
visitNode: (nodeId: string) => {
  set((state) => {
    state.progress.visitedNodes[nodeId] = newRecord;
    saveToLocalStorage(state); // Side effect in state update
  });
},
```

## Testing

### Writing Tests

- **Write tests** for all new functionality
- Use **React Testing Library** for component tests
- Use **Vitest** for unit tests
- Follow the **AAA pattern** (Arrange, Act, Assert)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Component from './Component';

describe('Component', () => {
  it('calls onClick when button is clicked', () => {
    // Arrange
    const handleClick = vi.fn();
    render(<Component onClick={handleClick} />);

    // Act
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Categories

- **Unit tests**: Individual functions and hooks
- **Component tests**: React component behavior
- **Integration tests**: Multiple components working together
- **Accessibility tests**: Screen reader and keyboard navigation

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Documentation

### Code Documentation

- **JSDoc comments** for all exported functions, types, and components
- **Inline comments** for complex logic only
- **README updates** for new features or breaking changes

### Commit Messages

Use **conventional commit** format:

```
type(scope): description

body (optional)

footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Examples:**

```
feat(store): add visit tracking to Zustand store

Implement visitNode action that records visits, updates transformation
states, and persists to localStorage.

Closes #45

fix(NodeMap): prevent crash on missing node data

Add null check before accessing node properties to handle edge case
where node data hasn't loaded yet.

docs(README): update setup instructions

Add section on environment variables and clarify dependency versions.
```

## Pull Request Process

### Before Submitting

1. **Run validation checks**:

   ```bash
   npm run validate
   ```

2. **Update documentation** if needed
3. **Add tests** for new functionality
4. **Test in multiple browsers** if UI changes
5. **Check accessibility** with screen reader

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets standards

## Screenshots (if applicable)

Include screenshots for UI changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** must pass (tests, linting, type checking)
2. **Code review** by maintainers
3. **Accessibility review** for UI changes
4. **Manual testing** for complex features
5. **Merge** after approval

## Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug** Clear description of the bug

**To Reproduce** Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior** What you expected to happen

**Screenshots** If applicable, add screenshots

**Environment:**

- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context** Any other context about the problem
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?** Clear description of the problem

**Describe the solution you'd like** Clear description of what you want to happen

**Describe alternatives you've considered** Other solutions you've considered

**Additional context** Screenshots, mockups, or examples
```

## Project Structure

### Adding New Components

1. **Create directory** in appropriate location (`src/components/`, `src/pages/`)
2. **Use PascalCase** for component files
3. **Include index.ts** for clean imports
4. **Add to parent index.ts** if needed

```
src/components/NewComponent/
├── NewComponent.tsx
├── NewComponent.test.tsx (if complex)
└── index.ts
```

### Adding New Types

1. **Add to appropriate file** in `src/types/`
2. **Export from index.ts**
3. **Update documentation** if public API

### Adding New Utilities

1. **Add to `src/utils/`**
2. **Include comprehensive tests**
3. **Export from index.ts**

## Story Content

### Writing Story Content

- **Markdown format** for node content
- **Multiple transformation states** (initial, firstRevisit, metaAware)
- **Clear character voice** and consistency
- **Meaningful connections** between nodes

### Content Guidelines

- **Reading time**: 3-5 minutes per node
- **Content length**: Under 3000 characters per transformation state
- **Accessibility**: Clear language, good contrast
- **Narrative flow**: Logical connections and progression

### Adding New Stories

1. **Create story directory** in `src/data/stories/`
2. **Follow JSON schema** from documentation
3. **Validate story structure** with built-in tools
4. **Test thoroughly** for narrative flow

## Performance Guidelines

### React Performance

- **Use React.memo()** for expensive components
- **Memoize callbacks** with useCallback
- **Memoize expensive calculations** with useMemo
- **Avoid inline objects** in render methods

### Bundle Size

- **Import only what you need** from libraries
- **Use dynamic imports** for large components
- **Monitor bundle size** with build tools

### Accessibility Performance

- **Reduce motion** for users with prefers-reduced-motion
- **Lazy load** non-critical content
- **Optimize images** and assets

## Security Guidelines

- **No secrets in code** or configuration files
- **Validate all user input**
- **Sanitize content** before rendering
- **Use HTTPS** for all external requests

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Documentation**: Check `/docs` for detailed information
- **Code Examples**: Look at existing components for patterns

## Recognition

Contributors will be:

- **Listed in CONTRIBUTORS.md**
- **Credited in release notes** for significant contributions
- **Mentioned in documentation** for major features

Thank you for contributing to Narramorph Fiction! 🚀
