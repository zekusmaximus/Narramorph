# Narramorph project overview

Narramorph is a React and TypeScript interactive-fiction platform whose stories change through exploration and revisitation. Its first story, _Eternal Return of the Digital Self_, uses a visual node map, transformation states, reader progress, and personalized convergence content to make the reading path part of the narrative.

## Product principles

- Revisiting should reveal new meaning rather than merely repeat content.
- Narrative content remains separate from runtime interaction logic.
- The 2D and 3D maps should express the same navigation rules and state.
- Reader progress is local, recoverable, and backward compatible.
- Content shipped to the application must pass strict validation.
- Accessibility and reduced-motion behavior are product requirements, not optional polish.

## Current scope

The repository contains one complete runtime story with:

- three character perspectives;
- twelve L1/L2 graph nodes;
- initial, first-revisit, and meta-aware transformations;
- personalized L3 convergence assemblies;
- three L4 philosophical endings; and
- JSON-backed content plus conversion, validation, and matrix-generation tooling.

The application is a static client-side product. Its effective domain backend consists of content loaders, selection and unlock evaluators, progress/persistence logic, and the conversion package.

## Technology

- React 18, TypeScript, and Vite
- Zustand with Immer for state
- React Flow for the 2D map
- React Three Fiber for the 3D map
- Vitest for tests
- JSON runtime content generated and checked by conversion tooling

See [current status](STATUS.md) for the verified baseline and [the roadmap](ROADMAP.md) for planned work. Historical production claims and milestone plans are preserved in [the archive](archive/README.md).
