# Changelog

All notable changes to the Narramorph application are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the app version is versioned independently of the story package (`eternal-return@1.3.0`, frozen for v1) and the save schema (`1.3.0`), with app↔package compatibility recorded in each release manifest (`output/release/release-manifest.json`).

## [0.1.1] — 2026-07-17

Phase 8 — production hardening and operational readiness. Interface/config + tooling only; **no content, story-package, concordance, literary-release, or save-schema identity changed** (the app version is the only identity that moved, within the package's supported range `>=0.1.0 <0.2.0`).

### Added

- **Client-only architecture, recorded and enforced** ([ADR 0006](docs/adr/0006-v1-client-only-no-backend.md)): a scope-gate guard (`npm run scope:check`) fails if a network primitive is introduced in first-party `src/`.
- **Security headers / CSP** for Cloudflare Pages (`public/_headers`): strict `script-src 'self'`, HSTS (preload-eligible), referrer/permissions/frame/MIME/COOP-CORP policies. Self-hosted Inter (no external font origin). Save-file import sanitization (prototype-pollution + size bounds). Public privacy policy.
- **Opt-in, redacted error monitoring** (Sentry, off by default, lazy-loaded, DSN-gated): a redaction layer that never transmits prose, journey history, saves, storage, or the reading-position URL; a consent toggle with a "what's sent" preview; private CI-only source maps.
- **Release engineering**: a release-manifest generator + `SHA256SUMS` (`npm run release:manifest`), immutable-asset / no-cache-HTML caching, `www → apex` redirects, a branded `404.html`, a one-command rollback helper + runbook (`npm run release:rollback`), a reproducible-build check (`npm run release:verify`), and an app-version lockstep check.

### Changed

- App version `0.1.0` → `0.1.1` (deliberate; marks the Phase-8 operable-production shell). Story package, concordance, literary release, and save schema remain frozen.
