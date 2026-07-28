# 3D Visualization Architecture

This directory contains the Three.js-based 3D visualization system for Narramorph, providing an immersive spatial representation of the narrative structure.

The staged stabilization, accessibility, performance, and enhancement work is tracked in [`docs/3D_VIEW_PLAN.md`](../../../docs/3D_VIEW_PLAN.md).

## Overview

The 3D visualization renders story nodes as interactive spheres positioned in 3D space, with character perspectives arranged along the z-axis. Users can navigate between nodes with smooth camera transitions and explore the narrative structure spatially.

## Architecture

### Component Hierarchy

```
NarromorphCanvas (Canvas setup, lighting, fog)
├── SceneNavigationControls (DOM camera controls and legend)
├── SceneNodeList (DOM passage navigation)
├── SceneContent (Layout computation, scene management)
│   ├── PlaneGuide (Visual layer indicators)
│   ├── SceneConnection (Directional solid/segmented routes)
│   └── NodeSphere (Interactive node representations)
├── CameraController (Smooth transitions)
└── OrbitControls (User camera control)
```

### Core Components

#### NarromorphCanvas.tsx

- **Purpose**: Main canvas container and scene setup
- **Responsibilities**:
  - Canvas configuration (camera position, FOV)
  - Global lighting (ambient + point lights)
  - Atmospheric fog for depth perception
  - OrbitControls setup
  - Plain-DOM reset/focus controls and an orientation/state legend
- **Configuration**:
  - Named in `sceneConfig.ts`; camera starts at `position: [0, 35, 90]`, `fov: 50`
  - Fog: `color: #1a1a1a`, `near: 50`, `far: 200`

#### SceneContent.tsx

- **Purpose**: Scene management and layout orchestration
- **Responsibilities**:
  - Groups nodes by character type
  - Triggers spatial layout computation
  - Renders PlaneGuide components for each character layer
  - Renders directional story connections whose endpoints are in the bounded scene
  - Renders NodeSphere components for each node
- **Data Flow**:
  1. Reads nodes from `useStoryStore`
  2. Groups nodes by character (archaeologist, algorithm, last-human)
  3. Calls `spatialStore.computeLayout()` with character groups
  4. Reads computed positions from `spatialStore`
  5. Renders scene elements

#### NodeSphere.tsx

- **Purpose**: Interactive 3D representation of a story node
- **Responsibilities**:
  - Visual state representation (visited, active, locked)
  - Hover and click interactions
  - Smooth animations with `@react-spring/three`
  - Conditional interactivity based on availability
- **State-Based Appearance** (structural as well as colour):
  - **Selected**: Large scale with two crossing rings
  - **Opened**: Solid sphere with one ring
  - **Available**: Solid sphere
  - **Locked**: Small, dim sphere inside a neutral wireframe cage
- **Interactions**:
  - Available nodes: Hover effects (5% scale increase, pointer cursor)
  - Locked nodes: No hover effects, no cursor change
  - Click: Opens story view (if available and not animating)

#### CameraController.tsx

- **Purpose**: Smooth camera transitions during navigation
- **Responsibilities**:
  - Monitors `selectedNode` from store
  - Computes target camera position relative to node
  - Animates camera with spring physics
  - Updates OrbitControls target
- **Transition Behavior**:
  - Target position: `[node.x, node.y + 5, node.z + 15]`
  - Spring config: `tension: 280`, `friction: 60`
  - Updates every frame via `useFrame`

#### PlaneGuide.tsx

- **Purpose**: Visual guides for character layers
- **Responsibilities**:
  - Renders semi-transparent planes at character z-positions
  - Displays character labels and temporal context
- **Security**: Fixed labels use local canvas-backed sprite textures rather than Drei/Troika `Text`, so opening 3D does not require blob workers or nested blob script imports.
- **Styling**:
  - Plane opacity: 0.05 (subtle)
  - Character-specific colors from tailwind config
  - Labels: "Past - Discovery", "Present - Processing", "Future - Memory"

#### FPSCounter.tsx (Dev-only)

- **Purpose**: Performance monitoring during development
- **Responsibilities**:
  - Measures and displays FPS in real-time
  - Color-coded performance indicators (green ≥55, yellow ≥30, red <30)
  - Only renders when `import.meta.env.DEV === true`

#### LoadingState.tsx

- **Purpose**: Loading overlay during spatial computation
- **Responsibilities**:
  - Displays spinner and message while positions are empty
  - Provides visual feedback during initial layout

## Data Flow

### Spatial Layout Computation

```
StoryStore (nodes) → SceneContent
                     ↓
            Group by character
                     ↓
            SpatialStore.computeLayout(characters)
                     ↓
            Circular positioning per character
                     ↓
            SpatialStore.positions (Record<nodeId, [x,y,z]>)
                     ↓
            NodeSphere renders at position
```

### Navigation Flow

```
User clicks NodeSphere → openStoryView(nodeId)
                         ↓
                 StoryStore.selectedNode updates
                         ↓
                 CameraController detects change
                         ↓
                 Spring animation to new position
                         ↓
                 ContentPanel3D slides in
```

### State Management

- **StoryStore** (`@/stores`):
  - `nodes`: Map of all story nodes
  - `selectedNode`: Currently active node ID
  - `progress`: User progress data (visited nodes, awareness level)
  - `isAnimating`: Prevents rapid navigation clicks
  - `openStoryView()`: Navigation action
  - `unlockConfigs`: Node unlock conditions

- **SpatialStore** (`@/stores/spatialStore`):
  - `positions`: Record<nodeId, [x, y, z]>
  - `computeLayout(characters)`: Generates 3D positions

## Visual Design

### Color Palette

Colors match the Tailwind config for consistency:

- **Archaeologist**: `#4A90E2` (Blue-500)
- **Algorithm**: `#50C878` (Green-500)
- **Last Human**: `#E74C3C` (Red-500)
- **Multi-Perspective**: `#9B59B6` (Purple-500)
- **Locked states**: 800 variants (darker, higher contrast)

### Node Appearance Utility

`getNodeAppearance.ts` centralizes visual state logic:

```typescript
getNodeAppearance({
  character: CharacterType,
  isActive: boolean,
  isVisited: boolean,
  isLocked: boolean,
  awarenessLevel: number
}) → NodeAppearance
```

Returns: `{ color, emissiveColor, emissiveIntensity, scale, opacity }`

### Availability Checking

`isNodeAvailable.ts` determines if a node can be navigated to:

```typescript
isNodeAvailable(
  nodeId: string,
  progress: UserProgress,
  unlockConfig?: NodeUnlockConfig
) → boolean
```

Checks:

1. L3 convergence locks (`progress.lockedNodes`)
2. Unlock conditions (`evaluateNodeUnlock`)

## Future Enhancements (v2)

### Planned Plugin Points

1. **Particle Systems**
   - Add to SceneContent.tsx after PlaneGuide rendering
   - Represent temporal artifacts or narrative threads
   - Use `@react-three/drei` `<Points>` or custom shaders

2. **Custom Shaders**
   - Enhance NodeSphere material with custom fragment shaders
   - Add time-based effects (pulsing, warping)
   - Implement awareness-level visual effects
   - Use `shaderMaterial` from `@react-three/drei`

3. **Post-Processing Effects**
   - Add `<EffectComposer>` to NarromorphCanvas
   - Bloom effect for active nodes
   - Film grain for vintage aesthetic
   - Vignette for focus

4. **Advanced Camera Behaviors**
   - Cinematic transitions for first-time visits
   - Dynamic camera paths based on narrative structure
   - "Flythrough" tour mode

### Extension Guidelines

- **Performance**: Test with FPSCounter.tsx in dev mode
- **State**: Extend SpatialStore for new computed properties
- **Appearance**: Update getNodeAppearance.ts for new visual states
- **Interactions**: Hook into existing click/hover handlers in NodeSphere
- **Accessibility**: Maintain keyboard navigation and screen reader support

## Known Limitations

### Current Constraints

1. **Layout Algorithm**
   - Simple circular positioning per character
   - Does not account for node connections or importance
   - No collision detection or optimization

2. **Performance**
   - No level-of-detail (LOD) system
   - All nodes rendered regardless of camera distance
   - No frustum culling beyond Three.js defaults

3. **Interactivity**
   - No drag-and-drop node repositioning
   - Limited camera constraints (can orbit infinitely)
   - No multi-select or bulk operations

4. **Accessibility**
   - Requires WebGL support (fallback to 2D)
   - The synchronized passage list remains the screen-reader and non-spatial path
   - Manual screen-reader, forced-colours, and cross-device verification remains required

5. **Mobile Support**
   - Touch controls via OrbitControls (basic)
   - Performance may vary on low-end devices
   - Small screen UI not optimized

### Technical Debt

- **Configuration evolution**: Primary camera, layout, node, guide, connection, and orbit values are centralized in `sceneConfig.ts`; new scene behavior should extend that configuration.
- **Testing**: WebGL scene behavior still depends on production-browser and hardware coverage.

## Development

### Running in 3D Mode

Set environment variable:

```bash
VITE_ENABLE_3D=true npm run dev
```

Or create `.env.local`:

```
VITE_ENABLE_3D=true
```

### Performance Monitoring

FPSCounter automatically appears in development mode:

- **Green (≥55 FPS)**: Optimal performance
- **Yellow (30-54 FPS)**: Acceptable performance
- **Red (<30 FPS)**: Performance issues

### Debugging Tips

1. **Console Logging**: SpatialStore logs positions when computed
2. **React DevTools**: Inspect component state and props
3. **Three.js Inspector**: Use browser extensions for scene debugging
4. **OrbitControls**: Manually navigate to inspect layout

### Common Issues

**Issue**: Nodes not appearing

- **Check**: `spatialStore.positions` populated?
- **Check**: Console for layout computation logs
- **Fix**: Ensure `computeLayout` called with valid characters

**Issue**: Camera not moving

- **Check**: `selectedNode` updating in StoryStore?
- **Check**: Position exists in spatialStore?
- **Fix**: Verify node IDs match between stores

**Issue**: Poor performance

- **Check**: FPSCounter reading
- **Check**: Number of rendered nodes
- **Fix**: Consider implementing LOD or culling

**Issue**: WebGL errors

- **Check**: Browser WebGL support
- **Fix**: Automatic fallback to 2D mode (see ErrorBoundary in Home.tsx)

## Dependencies

### Core

- `three@^0.185.1`: 3D graphics library
- `@react-three/fiber@^8.15.0`: React renderer for Three.js
- `@react-three/drei@^9.92.0`: Helper components (OrbitControls)
- `@react-spring/three@^9.7.3`: Spring physics animations

### Peer

- `react@^18.x`: UI framework
- `zustand@^4.x`: State management
- `framer-motion@^11.x`: DOM animations (ContentPanel3D)

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/)
- [Drei Documentation](https://github.com/pmndrs/drei)
- [React Spring Documentation](https://www.react-spring.dev/)

## Contributing

When adding new 3D features:

1. Follow existing component patterns
2. Update this README with architectural changes
3. Add TypeScript types for all new interfaces
4. Test with FPSCounter for performance impact
5. Ensure WebGL fallback still works
6. Document new environment variables in `.env.example`
