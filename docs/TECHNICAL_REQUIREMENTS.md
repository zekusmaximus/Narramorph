# Technical Requirements: Narramorph Fiction Platform

## System Architecture Overview

The platform consists of three primary layers:

1. **Presentation Layer**: Interactive node map and story viewing interface
2. **State Management Layer**: Reader progress tracking and transformation logic
3. **Data Layer**: Story content, node definitions, and connection rules

## Functional Requirements

### FR1: Node Map Visualization

**FR1.1 - Interactive Node Display**
- Display 40-50 nodes simultaneously without performance degradation
- Each node rendered as clickable circle/shape with unique identifier
- Node visual properties (color, size, opacity) reflect current state
- Smooth pan and zoom controls (mouse drag, scroll wheel, pinch gestures)
- Keyboard navigation support (arrow keys, tab, enter)

**FR1.2 - Visual State Indication**
- **Unvisited nodes**: Default color (light gray), standard size
- **Visited nodes (initial state)**: Primary character color, slightly larger
- **Visited nodes (first revisit available)**: Brightened color, subtle pulse animation
- **Visited nodes (meta-aware available)**: Enhanced glow effect, different border
- **Currently active node**: Distinct highlight, scaling effect

**FR1.3 - Connection Rendering**
- Lines connecting related nodes with visual hierarchy
- Connection types indicated by color:
  - Temporal (blue)
  - Consciousness (green)
  - Recursive (red)
  - Hidden (dashed, then solid after unlock)
- Animated flow along connections when traversing
- Connection labels appear on hover

**FR1.4 - Mini-Map**
- Always-visible overview in corner showing entire node graph
- Current viewport indicated by translucent rectangle
- Clickable regions for quick navigation
- Density visualization (visited vs. unvisited areas)
- Collapsible/expandable

**FR1.5 - Layout and Positioning**
- Three horizontal zones for character layers (Past/Present/Future)
- Manual node positioning defined in data (not auto-layout)
- Nodes maintain consistent spatial relationships
- Responsive scaling for different screen sizes

### FR2: Story Content Display

**FR2.1 - Story View Interface**
- Full-screen or large modal overlay for reading
- Clean typography optimized for extended reading
- Configurable text size (small/medium/large)
- Configurable background (light/dark/sepia)
- Reading time estimate displayed
- Progress indicator for current node

**FR2.2 - Content Transformation**
- Display appropriate state based on visit count and conditions
- Smooth transition when state changes (fade in/out)
- Clear indication of which state is being displayed (subtle badge/marker)
- Option to compare states (advanced feature for post-launch)

**FR2.3 - Navigation Within Story View**
- Return to map button (persistent)
- Previous/Next node buttons (if linear sequence exists)
- Connected nodes displayed as clickable links
- Breadcrumb trail showing reading path
- Keyboard shortcuts (ESC to return, arrows for navigation)

**FR2.4 - Connection Indicators**
- Related nodes shown at end of current node
- Visual preview of connection type
- Indication of whether connected node is visited/unvisited
- Suggestion engine for "where to go next" based on narrative coherence

### FR3: State Management

**FR3.1 - Visit Tracking**
- Record every node visit with timestamp
- Maintain visit count per node
- Track reading order (sequence of node IDs)
- Calculate total time spent per node
- Track return visits separately from initial visits

**FR3.2 - Transformation Logic**
- Determine current state for each node based on visit count
- Process unlock conditions for special transformations
- Check path-dependent transformation requirements
- Handle convergence-based transformations (threshold triggers)
- Validate all conditions before state changes

**FR3.3 - Progress Persistence**
- Auto-save state after every node visit
- Store in browser localStorage as primary method
- JSON format for state data
- Maximum storage size: ~5MB (ample for progress data)
- Graceful handling of localStorage unavailability (fallback to session storage)

**FR3.4 - Progress Recovery**
- Load saved state on application start
- Validate integrity of saved data
- Handle version mismatches gracefully
- Provide manual import/export for backup
- Clear progress option with confirmation dialog

**FR3.5 - State Export/Import**
- Export progress as JSON file
- Import previously exported progress
- Validation of imported data structure
- Merge strategies for conflicting states (take most recent)

### FR4: User Experience Features

**FR4.1 - Onboarding**
- Brief interactive tutorial on first visit
- Explanation of node states and transformations
- Navigation instructions
- Skip option for returning users
- Optional reading guide accessible from menu

**FR4.2 - Accessibility**
- Keyboard-only navigation fully functional
- Screen reader compatibility for story content
- ARIA labels on all interactive elements
- Sufficient color contrast (WCAG AA minimum)
- No reliance on color alone for information
- Configurable animation intensity (reduce motion option)

**FR4.3 - Responsive Design**
- Desktop primary (1920x1080 optimal)
- Tablet support (landscape orientation, 768px+ width)
- Mobile notification (experience optimized for larger screens)
- Fluid layout adapts to window resizing
- Touch gesture support for tablet

**FR4.4 - Performance Optimization**
- Initial page load under 2 seconds
- Node interaction response under 100ms
- Smooth 60fps animations
- Lazy loading for story content (only current node in memory)
- Virtualized rendering for large node graphs

**FR4.5 - Reading Statistics**
- Total nodes visited
- Percentage of content explored
- Total reading time
- Nodes available for transformation
- Current reading path visualization
- Optional analytics opt-in for anonymized data

### FR5: Content Management

**FR5.1 - Data Structure**
- All story content in structured JSON
- Separation of content from code
- Version control friendly format
- Hot-reload capability for development
- Validation schema for content structure

**FR5.2 - Content Loading**
- Fetch node data from JSON files
- Cache loaded content for session
- Preload connected nodes for faster navigation
- Handle missing/malformed content gracefully
- Development mode with detailed error reporting

**FR5.3 - Content Validation**
- Check all node IDs are unique
- Verify all connections reference existing nodes
- Validate required fields present
- Check for orphaned nodes (no incoming connections)
- Warn about dead ends (no outgoing connections from terminal nodes)

## Non-Functional Requirements

### NFR1: Performance

**Response Time**
- Node click to content display: < 100ms
- Map pan/zoom operations: 60fps sustained
- State save operation: < 50ms
- Page load (initial): < 2 seconds
- Page load (returning with saved state): < 1 second

**Resource Usage**
- Maximum memory footprint: 150MB
- Bundle size (initial): < 500KB gzipped
- Asset loading: Progressive, non-blocking
- CPU usage during idle: Minimal (no continuous animations)

**Scalability**
- Support up to 100 nodes without performance degradation
- Handle 1000+ state save/load operations
- Graceful degradation with larger graphs (level of detail rendering)

### NFR2: Browser Compatibility

**Supported Browsers**
- Chrome 90+ (primary)
- Firefox 88+ (primary)
- Safari 14+ (secondary)
- Edge 90+ (secondary)

**Not Supported**
- Internet Explorer (any version)
- Mobile browsers (Phase 1, notify users)
- Browsers with JavaScript disabled

**Progressive Enhancement**
- Core reading experience works without advanced features
- Graceful fallback for unsupported CSS/JS features
- Feature detection, not browser detection

### NFR3: Accessibility

**WCAG 2.1 Level AA Compliance**
- Color contrast ratios: 4.5:1 minimum for text
- Keyboard navigation for all functionality
- Screen reader compatibility
- Proper heading hierarchy
- Alternative text for visual elements
- Focus indicators visible and clear

**Additional Accessibility**
- Text resizing up to 200% without loss of functionality
- Reduced motion mode respects system preferences
- No flashing/strobing content (seizure risk)
- Configurable reading experience (text size, contrast)

### NFR4: Security

**Data Protection**
- No collection of personal information
- localStorage only used for progress saving
- No external analytics without explicit consent
- No third-party tracking scripts
- All external resources loaded over HTTPS

**Content Security**
- Sanitize any user-generated content (future feature)
- No inline JavaScript in content
- CSP headers configured appropriately
- XSS protection for exported/imported state data

### NFR5: Maintainability

**Code Quality**
- TypeScript for type safety
- ESLint + Prettier for consistent style
- Comprehensive commenting for complex logic
- Component-based architecture
- Maximum function complexity: Cyclomatic complexity < 10

**Testing**
- Unit tests for all state management logic
- Integration tests for transformation rules
- Component tests for UI interactions
- E2E tests for critical user paths
- Minimum 80% code coverage for state logic

**Documentation**
- Inline code comments for complex algorithms
- README with setup instructions
- Architecture decision records (ADRs)
- Content creation guidelines
- Deployment procedures

### NFR6: Deployment

**Hosting**
- Static site deployment (Vercel/Netlify)
- CDN for asset delivery
- Automatic HTTPS
- Preview deployments for branches
- Rollback capability

**Monitoring**
- Error tracking (optional, privacy-respecting)
- Performance monitoring (Core Web Vitals)
- Uptime monitoring
- Manual user feedback system

## Technical Constraints

### TC1: Technology Choices

**Required Technologies**
- React 18+ (frontend framework)
- TypeScript 5+ (type safety)
- React Flow or D3.js (visualization)
- Zustand or Redux Toolkit (state management)
- Tailwind CSS (styling)
- Framer Motion (animations)

**Prohibited Technologies**
- jQuery (outdated, conflicts with React)
- Class components (use functional components + hooks)
- Inline styles (use Tailwind or CSS modules)
- localStorage encryption libraries (unnecessary complexity)

### TC2: Data Constraints

**Content Limits**
- Maximum node count: 100 (Phase 1)
- Maximum connections per node: 10
- Maximum text length per state: 3000 characters
- Maximum total storage per user: 5MB localStorage

**Performance Budgets**
- JavaScript bundle: 500KB gzipped
- CSS bundle: 50KB gzipped
- Image assets: 200KB total
- Fonts: 100KB total

### TC3: Browser Storage

**localStorage Structure**
```json
{
  "version": "1.0.0",
  "timestamp": "ISO-8601 datetime",
  "progress": {
    "visitedNodes": {
      "nodeId": {
        "visitCount": 0,
        "visitTimestamps": [],
        "currentState": "initial|firstRevisit|metaAware",
        "timeSpent": 0
      }
    },
    "readingPath": ["nodeId1", "nodeId2", ...],
    "unlockedConnections": ["connectionId1", ...],
    "specialTransformations": ["nodeId-conditionId", ...]
  },
  "preferences": {
    "textSize": "medium",
    "theme": "light",
    "reduceMotion": false
  }
}
TC4: Content Structure
Node Definition
json{
  "id": "string (unique)",
  "character": "archaeologist|algorithm|human",
  "title": "string",
  "position": {"x": "number", "y": "number"},
  "content": {
    "initial": "string (markdown)",
    "firstRevisit": "string (markdown)",
    "metaAware": "string (markdown)"
  },
  "connections": [
    {
      "targetId": "string",
      "type": "temporal|consciousness|recursive|hidden",
      "label": "string (optional)",
      "bidirectional": "boolean (default: false)"
    }
  ],
  "visualState": {
    "defaultColor": "string (hex)",
    "size": "number",
    "shape": "circle|square (default: circle)"
  },
  "unlockConditions": {
    "specialTransforms": [
      {
        "id": "string",
        "requiredPriorNodes": ["nodeId1", ...],
        "requiredSequence": ["nodeId1", "nodeId2"] (optional),
        "transformText": "string (markdown)",
        "visualEffect": "string (optional)"
      }
    ]
  },
  "metadata": {
    "estimatedReadTime": "number (minutes)",
    "thematicTags": ["string", ...],
    "narrativeAct": "number",
    "criticalPath": "boolean"
  }
}
Connection Definition
json{
  "id": "string (unique)",
  "sourceId": "string",
  "targetId": "string",
  "type": "temporal|consciousness|recursive|hidden",
  "label": "string (optional)",
  "bidirectional": "boolean",
  "revealConditions": {
    "requiredVisits": {"nodeId": 1} (optional),
    "requiredSequence": ["nodeId1", "nodeId2"] (optional)
  },
  "visualProperties": {
    "color": "string (hex)",
    "weight": "number (1-5)",
    "animated": "boolean",
    "dashArray": "string (for dashed lines)"
  }
}
Feature Prioritization
Must Have (MVP)

Interactive node map with basic visualization
Three transformation states per node
Visit tracking and state management
Story content display
localStorage persistence
Keyboard navigation
Basic responsive design (desktop/tablet)

Should Have (Post-MVP)

Mini-map navigation
Advanced visual effects (glow, pulse)
Path-dependent transformations
Reading statistics
Export/import progress
Reduced motion mode
Dark mode

Could Have (Future)

User accounts with cloud save
Reading path recommendations
Social sharing of paths
Author tools for content creation
Multiple story support
Mobile optimization
VR/AR exploration mode

Won't Have (Out of Scope)

Multiplayer/collaborative reading
Real-time AI content generation
User-generated content
Audio narration
Video integration
Blockchain/NFT features

Development Environment
Required Tools

Node.js 18+
npm or yarn
Git
VS Code (recommended) with extensions:

ESLint
Prettier
TypeScript
Tailwind CSS IntelliSense



Development Scripts
json{
  "dev": "Start development server",
  "build": "Production build",
  "test": "Run test suite",
  "lint": "Run linting",
  "type-check": "TypeScript validation",
  "validate-content": "Check story content structure"
}
Environment Variables
VITE_ENV=development|production
VITE_CONTENT_PATH=/data/nodes
VITE_ENABLE_DEV_TOOLS=true|false
VITE_LOG_LEVEL=debug|info|warn|error
Testing Strategy
Unit Tests

State management logic (Zustand store actions)
Transformation condition evaluation
localStorage persistence utilities
Content validation functions
Path-dependent logic

Integration Tests

Complete transformation sequences
Connection reveal logic
Progress save/load cycles
Navigation flows

Component Tests

Node map interactions
Story view rendering
Modal behaviors
Keyboard navigation

E2E Tests

Complete reading path (first visit)
Revisit and transformation flow
Progress persistence across sessions
Export/import functionality
Accessibility keyboard navigation

Performance Tests

Large graph rendering (100 nodes)
Rapid navigation between nodes
Memory leak detection
Bundle size monitoring

Deployment Strategy
Staging Environment

Automatic deployment from develop branch
Preview deployments for pull requests
Accessible at staging.narramorph.fiction (or similar)

Production Environment

Manual deployment from main branch
Requires passing all tests
Automatic rollback on error
Accessible at primary domain

Release Process

Feature development in feature branches
PR to develop with review
Staging deployment and testing
PR to main after QA approval
Production deployment
Post-deployment monitoring

Success Metrics
Technical Metrics

Lighthouse score > 90 (Performance, Accessibility, Best Practices)
Core Web Vitals in "Good" range
Zero critical runtime errors
< 1% state corruption rate
99.9% uptime

User Experience Metrics

Average session duration > 30 minutes
Completion rate > 60%
Revisit rate > 40%
Node exploration breadth > 70% of available content
Mobile bounce rate (acceptable for non-optimized experience)

Risk Mitigation
Technical Risks
Risk: LocalStorage data corruption

Mitigation: Validation on load, automatic backups, export functionality

Risk: Performance degradation with complex graphs

Mitigation: Virtualization, level-of-detail rendering, performance budgets

Risk: Browser compatibility issues

Mitigation: Progressive enhancement, feature detection, comprehensive testing

Risk: State management bugs causing lost progress

Mitigation: Comprehensive testing, immutability patterns, validation

Content Risks
Risk: Narrative incoherence with non-linear reading

Mitigation: Extensive reader testing, multiple path validation

Risk: Transformation states feel repetitive

Mitigation: Strong editorial process, variation in approach per character

Risk: Overwhelming complexity for readers

Mitigation: Onboarding, optional reading guides, visual clarity

Future Considerations
Scalability Planning

Architecture supports multiple stories
Content management system for non-technical authors
User accounts for cross-device progress
Analytics for understanding reading patterns

Monetization (If Applicable)

Pay-what-you-want model
Patron/subscription for early access to new stories
No intrusive advertising
Respect for reader privacy

Community Features

Reader forums for discussion
Shared reading paths
Creator tools for new Narramorph Fiction
Open-source core platform
