# Narramorph product charter

Status: Accepted for Phase 0 implementation on July 13, 2026

## Mission

Narramorph will ship *Eternal Return of the Digital Self* as an accessible interactive literary experience in which a reader's order of exploration, revisits, and philosophical choices materially affect the prose and ending they encounter.

The product should support two complementary reading goals:

1. a reader can ignore the mechanics and experience a coherent work of fiction; and
2. a curious reader can inspect how their journey changed the work without exposing future spoilers.

## Primary audience

- Readers of speculative and experimental fiction.
- Readers interested in digital consciousness, memory, identity, and recursive narrative.
- Readers using keyboard, touch, screen readers, text enlargement, reduced motion, or devices without WebGL.

Developers and authors are important secondary users, but v1 decisions must prioritize the reader experience.

## V1 product outcome

V1 is a production-hosted, static client-side application with:

- one complete supported story package: *Eternal Return of the Digital Self*;
- three perspective entry points;
- path-sensitive initial, revisit, and meta-aware content;
- deterministic L3 convergence and three reachable L4 endings;
- local, versioned, recoverable progress;
- an accessible 2D-first map and an optional, lazy-loaded 3D view;
- reader settings, progress history, reduced motion, responsive layout, and keyboard support;
- plain-language explanations for adaptive selections;
- an export of the exact journey the reader experienced;
- versioned provenance connecting runtime content to approved literary/editorial sources;
- reproducible CI, deployment, monitoring, rollback, privacy, and release documentation.

## V1 non-goals

The following are not on the v1 critical path unless the owner changes this charter through an ADR:

- accounts, authentication, cloud saves, or cross-device synchronization;
- a MongoDB or other application backend;
- multiplayer or social reading;
- a general-purpose public authoring platform;
- automatic conversion of the complete manuscript into interactive nodes;
- making the experimental 3D canvas the only navigation method;
- adding additional full stories before the single-story package boundary is dependable;
- EPUB/PDF generation before Markdown and print-HTML journey export are stable.

## Repository responsibilities

| Repository | Phase 0 role | Intended final role |
|---|---|---|
| `Narramorph` | Active integration target | Sole shippable application and runtime-story repository |
| `Eternal_Return_Manuscript` | Active canonical source | Canonical long-form prose, story bible, editorial records, and literary release source |
| `Project-Leibniz` | Feature-frozen reference | Archived after its condition, explanation, prose-beat, edge-prose, and export decisions pass the Phase 4 gate |
| `eternal-return-digital-self` | Feature-frozen reference | Archived after its onboarding, visual, and measured 3D decisions pass the Phase 6 gate |

Narramorph must never depend at build or runtime on the default branch of another repository. Cross-repository literary inputs must be approved, versioned releases with provenance and compatibility metadata.

## Product principles

1. **The order is part of the story.** Journey state must affect prose in deterministic, testable ways.
2. **Literature first.** Explanations and progress tools remain secondary to uninterrupted reading.
3. **Accessibility is a product requirement.** No critical task may require sight, precise pointer use, color alone, animation, or WebGL.
4. **Content authority is explicit.** The manuscript repository owns canonical long-form prose and editorial constraints; Narramorph owns the interactive edition.
5. **Local data is treated as reader data.** Progress and history are recoverable, privacy-respecting, and never transmitted without informed consent.
6. **Measured performance beats speculative architecture.** Large content and 3D dependencies are loaded only when required.
7. **Reference repositories do not remain shadow products.** Useful behavior is migrated or rejected, then the repository is archived.

## V1 release authority

- The product owner approves scope, repository roles, licensing, and launch.
- The editorial owner approves canonical claims and literary content releases.
- Technical reviewers approve schemas, security, accessibility, performance, deployment, and rollback.
- An implementation agent may propose changes but may not bypass manuscript prose approval or repository archive gates.

## Success criteria

V1 is not shippable merely because content is present. The release must meet the definition in [the consolidation roadmap](eternal-return-product-consolidation-roadmap.md), including complete journeys, accessibility, performance budgets, dependency review, content approval, explicit licensing, production deployment, monitoring, and rollback.

## Change control

Material changes to the repository model, backend decision, content authority, or v1 non-goals require a new ADR linked from this charter.
