# Backup Artifact Audit — 2026-06-26

## Decision

The generated backup directories are retained locally but removed from Git tracking:

- `.backups/`: 2,452 timestamped JSON snapshots, approximately 29.72 MB.
- `metadata-backups/`: 2,166 timestamped `.bak` snapshots, approximately 30.75 MB.

Together they account for 4,618 of the repository's 6,743 tracked files. They are recovery artifacts produced by conversion and metadata tooling; the runtime application and build do not load either directory.

## Retention policy

- Runtime and canonical source content remain under `src/data/`, `archive/`, and the documented conversion inputs.
- Generated snapshots stay outside version control.
- Conversion reports are ignored except for `tools/conversion/reports/.gitkeep`.
- If a historical snapshot must be preserved for a release or migration, store it as a named external artifact with a checksum instead of committing an expanding snapshot directory.

## History

This change removes the artifacts from the current tree only. It does not rewrite Git history. History rewriting should be considered separately only if clone size remains a material problem.
