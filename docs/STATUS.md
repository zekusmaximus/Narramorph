# Narramorph Status

Updated: 2026-06-26

## Current foundation

- Generated `.backups/` and `metadata-backups/` artifacts are no longer tracked. See [the backup audit](architecture/BACKUP_ARTIFACT_AUDIT_2026_06_26.md).
- CI runs type checking, linting, formatting, application tests, strict content validation, and a production build.
- L1/L2 content paths are resolved from each node definition rather than inferred from character names.
- Runtime story loading fails on invalid graph metadata instead of swallowing validation errors.
- Selection matrices are cached per story.
- Initial progress, transformation, connection, journey, and L3 cache-key logic has moved from the Zustand store into `src/domain/`.
- Characterization coverage includes the complete Eternal Return L1/L2 graph and philosophy-specific L2 content.

## Verified baseline

- Application tests: 46 passing.
- Conversion-tool tests: 99 passing.
- Strict content validation: 288 files valid, 0 invalid.
- TypeScript, ESLint, Prettier, and the production build pass.

## Next architecture work

1. Resolve the conversion package's existing strict TypeScript backlog.
2. Continue extracting persistence, unlock, and variation orchestration from `storyStore.ts`.
3. Split the largest UI components and introduce shared 2D/3D map adapters.
4. Profile and code-split the production bundle; the current main application chunk is approximately 14.8 MB before gzip.
5. Profile L3 assembly before deciding whether to move it to a Web Worker.

The detailed rationale and phased plan live in [the 2026 codebase review](CODEBASE_REVIEW_2026_06_26.md).
