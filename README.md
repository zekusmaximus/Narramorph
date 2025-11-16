# Narramorph Fiction: Eternal Return of the Digital Self

An interactive narrative exploring digital consciousness through three temporal perspectives: an Archaeologist in 2047, an Algorithm in 2151, and the Last Human in 2383. Reader choices shape a personalized journey through 1,233 narrative variations, culminating in one of three philosophical endpoints.

**Current Status**: 99.8% complete (1,230/1,233 variations)

- ✅ Layer 1 & 2: 960 variations complete
- ✅ Layer 3: 270 modular variations complete
- ⚠️ Layer 4: 3 terminal variations in progress

---

## What is Narramorph?

Narramorph is an interactive fiction platform built on a **12-node branching architecture** across 4 narrative layers:

- **Layer 1** (3 nodes): Choose your entry point—Archaeologist, Algorithm, or Last Human
- **Layer 2** (9 nodes): Philosophical branches—accept, resist, or invest in the recursive nature of consciousness
- **Layer 3** (modular): Personalized convergence assembled from 270 variations based on your unique journey
- **Layer 4** (3 endings): Terminal philosophical resolution—preserve, release, or transform

### Key Features

- **Dynamic Content**: Each node contains 80 variations that transform based on visit history and temporal awareness
- **Journey Personalization**: L3 convergence and L4 ending selected algorithmically from reader's exploration pattern
- **Temporal Awareness System**: Content evolves as readers recognize recursive patterns (0-100 scale)
- **Voice Synthesis**: Three distinct narrative voices converge into unified consciousness by L4

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/zekusmaximus/Narramorph.git
cd Narramorph

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser to `http://localhost:5173`

### Development Commands

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run test           # Run tests
npm run test:ui        # Run tests with UI
npm run type-check     # TypeScript type checking
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix linting issues + format code
npm run lint:ci        # Lint with zero warnings allowed
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
npm run validate       # Full validation: type-check + lint + test
```

### Code Quality & Automation

Narramorph enforces strict code quality standards through automation:

**TypeScript Strict Mode**

- Full `strict: true` with additional flags:
  - `noUncheckedIndexedAccess` - Array/object access safety
  - `noImplicitReturns` - Explicit return statements
- Zero tolerance: `npm run type-check` must pass with 0 errors

**ESLint Configuration**

- Modern TypeScript patterns enforced:
  - Consistent type imports (`import type { ... }`)
  - Explicit function return types for exported functions
  - Import cycle detection
  - Zero `any` tolerance (except truly dynamic code paths)
- Pre-commit hooks run `eslint --fix` on staged files

**Automated Checks**

- **Pre-commit**: Husky + lint-staged automatically lint and format staged files
- **CI**: GitHub Actions runs type-check, lint, format:check, and tests on all PRs
- **Local validation**: Run `npm run validate` before pushing

**VS Code Integration**

- Recommended extensions installed automatically
- Format on save enabled
- ESLint auto-fix on save
- TypeScript workspace SDK configured

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines.

---

## 3D Visualization Mode

Narramorph includes an experimental 3D visualization mode that renders the story nodes as interactive spheres in 3D space.

### Enabling 3D Mode

Create a `.env.local` file in the project root:

```bash
VITE_ENABLE_3D=true
```

Or set the environment variable when running:

```bash
VITE_ENABLE_3D=true npm run dev
```

**Requirements**:

- WebGL-compatible browser
- Modern GPU recommended for optimal performance
- Automatic fallback to 2D mode if WebGL is unavailable

### Controls

**Mouse/Trackpad**:

- **Left Click + Drag**: Rotate camera around scene
- **Right Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out
- **Click Node**: Open story content panel

**Keyboard**:

- **Escape**: Close story content panel
- **Arrow Keys**: Manual camera navigation (via OrbitControls)

### Features

- **Spatial Layout**: Nodes arranged in circular patterns by character perspective
- **Character Layers**: Three temporal layers along z-axis (Past, Present, Future)
- **Visual States**: Color-coded node states (visited, active, locked, unvisited)
- **Smooth Transitions**: Camera animates to selected nodes with spring physics
- **Atmospheric Fog**: Depth perception enhancement
- **Performance Monitor**: FPS counter (development mode only)

### Architecture

See detailed 3D architecture documentation: [src/components/3d/README.md](src/components/3d/README.md)

**Key Technologies**:

- Three.js for 3D rendering
- React Three Fiber for React integration
- React Spring for smooth animations
- Zustand for spatial state management

---

## Tech Stack

- **React 18** + TypeScript
- **Zustand** with Immer for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Three.js** + React Three Fiber for 3D visualization
- **Vite** for build tooling
- **Vitest** + React Testing Library for testing

---

## Project Structure

```
/Narramorph
├── docs/                       # Comprehensive project documentation
├── L1/                         # Layer 1 content (240 variations)
├── L2/                         # Layer 2 content (720 variations)
├── L3/                         # Layer 3 modular content (270 variations)
├── L4/                         # Layer 4 terminal variations (3)
├── src/
│   ├── algorithms/            # L3/L4 selection algorithms
│   ├── components/
│   │   ├── 3d/               # Three.js 3D visualization components
│   │   ├── NodeMap/          # 2D React Flow node map
│   │   ├── StoryView/        # Story content display
│   │   └── UI/               # UI components
│   ├── stores/                # Zustand state management
│   ├── types/                 # TypeScript type definitions
│   └── data/                  # Story content (JSON)
├── scripts/                   # Validation and utility scripts
└── tests/                     # Test files
```

---

## Documentation

Comprehensive documentation in [`/docs`](docs/):

### Overview & Architecture

- **[PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** - Vision, scope, and current status (99.8% complete)
- **[NARRATIVE_STRUCTURE.md](docs/NARRATIVE_STRUCTURE.md)** - 12-node architecture, transformation states, L3/L4 systems
- **[DEVELOPMENT_STATE_TRACKER.md](docs/DEVELOPMENT_STATE_TRACKER.md)** - Phase tracking and completion status

### Technical Documentation

- **[DATA_SCHEMA.md](docs/DATA_SCHEMA.md)** - TypeScript types, JSON formats, selection algorithms
- **[CODEBASE_CONVENTIONS.md](docs/CODEBASE_CONVENTIONS.md)** - Implementation patterns, helpful scripts, performance
- **[TECHNICAL_REQUIREMENTS.md](docs/TECHNICAL_REQUIREMENTS.md)** - Functional and non-functional requirements

### Content Guidelines

- **[CHARACTER_PROFILES.md](docs/CHARACTER_PROFILES.md)** - Voice consistency, substrate-specific language
- **[L4/L4-data-requirements.md](L4/L4-data-requirements.md)** - Journey personalization data catalog (70 data points)

---

## Data Architecture

### Variation System

**1,233 total variations** across 4 layers:

- **L1/L2 Nodes**: 80 variations each (1 initial + 46 FirstRevisit + 33 MetaAware)
- **L3 Modular**: 270 variations (45 per character + 135 synthesis) selected by algorithm
- **L4 Terminal**: 3 philosophical endpoints (preserve/release/transform)

### Selection Algorithms

**Layer 3 Assembly** (3×3×5 matrix):

- Journey Pattern: Started-Stayed, Started-Bounced, Shifted-Dominant, Began-Lightly, Met-Later
- Path Philosophy: accept/resist/invest (dominant from L2 choices)
- Awareness Level: medium/high/maximum (0-100 scale)

**Layer 4 Selection**:

- Based on L2 path dominance, L3 assembly criteria, and temporal awareness
- Selects one of three terminal variations

See [DATA_SCHEMA.md](docs/DATA_SCHEMA.md) for complete type definitions and algorithms.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and workflow
- Coding standards and patterns
- Testing requirements
- Pull request guidelines

**Current Focus**: Layer 4 terminal variation completion (3 remaining)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

**Narrative Design**: Recursive consciousness, temporal awareness, and voice synthesis patterns inspired by interactive fiction and digital storytelling.

**Technical Architecture**: Modern React patterns, algorithmic content selection, and performance optimization for 1,233-variation system.

---

**Project Status**: Production narrative phase 99.8% complete. Implementation phase for platform, UI, and selection algorithms in progress.

_For questions or discussions, see issues or contact via GitHub._
