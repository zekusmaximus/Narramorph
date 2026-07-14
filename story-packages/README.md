# Story packages

This directory contains deterministic inputs and generated proof artifacts for [Story Package Contract v1](../docs/contracts/story-package-v1.md).

## Boundaries

- `sources/` is authored and reviewed. The two fixture stories are synthetic, noncanonical, and contain no Eternal Return manuscript prose.
- `fixtures/clockwork-garden/` and `fixtures/tidal-signals/` are generated proof packages.
- `eternal-return/` is a generated identity/topology/content-digest catalog for the existing authored runtime edition. It does not duplicate or replace runtime prose.
- Generated `manifest.json`, `catalog.json`, and copied fixture resources are do-not-edit outputs. Change their source or tooling and rebuild.

The same generic builder and validator process every package. Story-specific source layout is declared in source descriptors; the validator has no Eternal Return branch.

```bash
npm run story:package:build
npm run story:package:validate
npm run story:package:test
```
