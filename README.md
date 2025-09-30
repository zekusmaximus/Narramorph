# Narramorph Fiction

A React-based interactive narrative platform for creating node-based story experiences. This project implements "Eternal Return of the Digital Self," a story exploring digital consciousness through transforming narrative nodes.

## Features

- **Interactive Node Map**: Visual story navigation with character-based nodes
- **Transformation States**: Content changes based on visit history and conditions
- **Multiple Perspectives**: Three character viewpoints (Archaeologist, Algorithm, Human)
- **Progress Tracking**: Comprehensive visit and reading statistics
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Data Persistence**: Local storage for progress and preferences

## Tech Stack

- **React 18** with TypeScript
- **Zustand** with Immer for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Flow** for node visualization (planned)
- **Vite** for build tooling
- **Vitest** + React Testing Library for testing

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Narramorph
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check

# Run all validation (type-check + lint + test)
npm run validate
```

## Project Structure

```
/Narramorph
├── docs/                       # Project documentation
├── public/                     # Static assets
├── src/
│   ├── components/            # React components
│   │   ├── Layout/           # Application layout
│   │   ├── NodeMap/          # Interactive node map
│   │   ├── StoryView/        # Story reading interface
│   │   └── UI/               # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # Zustand state management
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── data/                 # Story content (JSON)
│   ├── pages/                # Top-level page components
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Main app component
│   └── index.css             # Global styles
├── tests/                    # Test files and utilities
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Architecture

### State Management

The application uses Zustand with Immer middleware for state management. The main store (`storyStore`) handles:

- Story content and node data
- User progress and visit tracking
- UI state (selected nodes, viewport)
- User preferences and settings

### Type System

Comprehensive TypeScript types are defined in `src/types/`:

- **Node.ts**: Story nodes, positions, visual states
- **Store.ts**: State management and user progress
- **Story.ts**: Story data structures and validation

### Component Architecture

- **Layout**: Provides consistent application shell
- **NodeMap**: Interactive visualization of story structure
- **StoryView**: Modal interface for reading node content
- **Pages**: Top-level routing and page components

## Story Data Format

Stories are defined as JSON files in `src/data/stories/`. Each story includes:

- **Metadata**: Title, author, description, estimated playtime
- **Nodes**: Individual story fragments with multiple transformation states
- **Connections**: Links between nodes with reveal conditions
- **Configuration**: Start node, endings, critical path

Example node structure:

```json
{
  "id": "archaeologist-001",
  "character": "archaeologist",
  "title": "The First Fragment",
  "position": { "x": 150, "y": 100 },
  "content": {
    "initial": "The fragment loads in sections...",
    "firstRevisit": "I've reconstructed this memory...",
    "metaAware": "You've been here before..."
  },
  "connections": [
    {
      "targetId": "archaeologist-002",
      "type": "temporal",
      "label": "Three weeks later"
    }
  ],
  "visualState": {
    "defaultColor": "#4A90E2",
    "size": 30
  },
  "metadata": {
    "estimatedReadTime": 3,
    "thematicTags": ["memory", "loss"],
    "narrativeAct": 1,
    "criticalPath": true
  }
}
```

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer functional components with hooks
- Use path aliases (@/components, @/types, etc.)

### Component Patterns

```typescript
// Component structure
function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();
  const store = useStoryStore();

  // 2. Derived state
  const computedValue = useMemo(() => {}, [dependencies]);

  // 3. Event handlers
  const handleClick = useCallback(() => {}, [dependencies]);

  // 4. Effects
  useEffect(() => {}, [dependencies]);

  // 5. Render
  return <div>{/* JSX */}</div>;
}
```

### State Management

```typescript
// Store actions
visitNode: (nodeId: string) => {
  set((state) => {
    // Direct mutation works with immer
    state.progress.visitedNodes[nodeId] = newRecord;
  });

  // Side effects after state update
  get().saveProgress();
}
```

## Testing

The project uses Vitest with React Testing Library:

```typescript
// Component test
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

Test utilities are available in `tests/utils.tsx` including mock data and helper functions.

## Accessibility

The application follows WCAG 2.1 guidelines:

- Semantic HTML elements
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast compliance

## Performance

Optimization strategies implemented:

- Code splitting with lazy loading
- Memoization of expensive calculations
- Efficient re-render prevention
- Optimized bundle size with manual chunks
- Image optimization and lazy loading

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes following the coding guidelines
4. Add tests for new functionality
5. Run validation: `npm run validate`
6. Commit changes: `git commit -m "Add new feature"`
7. Push to branch: `git push origin feature/new-feature`
8. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **Narrative Design**: Inspired by interactive fiction and digital storytelling
- **Technical Architecture**: Built on modern React patterns and best practices
- **Accessibility**: Guided by WCAG 2.1 standards and inclusive design principles

---

## Documentation

Comprehensive documentation in `/docs`:

- **[PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** - Vision, goals, scope, and success criteria
- **[NARRATIVE_STRUCTURE.md](docs/NARRATIVE_STRUCTURE.md)** - Story architecture and node transformation system
- **[CHARACTER_PROFILES.md](docs/CHARACTER_PROFILES.md)** - Character development and voice guidelines
- **[TECHNICAL_REQUIREMENTS.md](docs/TECHNICAL_REQUIREMENTS.md)** - Functional and non-functional requirements
- **[DATA_SCHEMA.md](docs/DATA_SCHEMA.md)** - TypeScript types and data structures
- **[CODEBASE_CONVENTIONS.md](docs/CODEBASE_CONVENTIONS.md)** - Coding standards and patterns