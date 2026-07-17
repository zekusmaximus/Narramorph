# Phase 8.4 — Deployment environments, versioning, and rollback

**Status: owner decisions accepted (app `0.1.0` → `0.1.1` — a `0.2.0` bump would break the frozen package's `>=0.1.0 <0.2.0` range; domain narramorph.com, apex canonical); 8.4 implemented and gate-green. Host provisioning, preview/staging, and the rollback rehearsal are owner-run. Batch 8.5 awaits its own design + confirmation.**

Batch 8.4 makes the app **releasable and reversible**: version the application and record app↔package compatibility in **release manifests**, configure immutable-asset caching / redirects / a custom 404, publish **release notes + checksums**, and implement a **one-command rollback** to the prior known-good app+package that never corrupts local saves (roadmap Batch 8.4). Host is **Cloudflare Pages** on a **custom domain** (8.1). This is the one batch that legitimately manages the **app version** — never the package, which stays frozen at `eternal-return@1.3.0`, and never the save schema (`1.3.0`).

Acceptance gate (roadmap): _a tagged commit produces a reproducible artifact and staging deployment; rollback completes without corrupting existing local saves._

Config/tooling + docs only. Per ADR 0002 no authored runtime prose; per ADR 0001 no dependency on P or M.

---

## 1. Grounded current-state audit (branch base + 8.1–8.3 on the feature branch)

- **App version is `0.1.0` in three lockstep places:** `package.json` `version`, `src/domain/progress/saveState.ts` `CURRENT_APP_VERSION`, and `tools/conversion/lib/story-package.ts` `CURRENT_APP_VERSION`. A bump must update all three (+ tests).
- **No release-manifest, checksum, or app-rollback tooling exists.** `scripts/` has the 8.1–8.3 checkers only; `content:rollback` (conversion tool) rolls back a **story package**, not an app deployment.
- **No `_redirects` or `404.html`** yet; `public/_headers` (8.2) carries security headers but no caching.
- **Assets are already immutable + content-hashed** by Vite (`/assets/<name>-<hash>.js|css`), with `manifest: true` and `publicSourceMapCount: 0` enforced — the basis for long-cache immutability.
- **Rollback is save-safe by design.** The save schema is **frozen at `1.3.0`** across any app-version change, and `prepareSavedState` normalizes `savedState.appVersion || CURRENT_APP_VERSION` on load — so a save written by a newer app loads under an older app (and vice-versa) without a format change. 8.4 adds a test to lock this in rather than assert it.
- **Cloudflare Pages retains every deployment**, so production rollback is an **instant edge operation** (promote a prior deployment) — the fastest known-good restore; git revert is the source-of-truth follow-up.

---

## 2. In-repo vs. owner-gated split

| Work | In-repo (agent-doable now) | Owner-gated |
| --- | --- | --- |
| Versioning | App-version bump (if chosen) across the 3 lockstep sites + tests; a release-manifest generator recording app↔package compatibility; a lockstep-consistency check | Choosing whether/what to bump |
| Caching / redirects / 404 | Immutable-asset + HTML caching in `public/_headers`; `public/_redirects` (canonical host + SPA/404 behavior); a branded `public/404.html` | Applying at the edge; the apex/www canonical choice (DNS) |
| Release notes + checksums | `scripts/build-release-manifest.mjs` (manifest + sha256 checksums of `dist`); a `CHANGELOG`/release-notes convention | Tagging + publishing the release |
| Rollback | `scripts/rollback.mjs` + a runbook; a save-safety forward/back-compat test | The Cloudflare deployment rollback (edge); the **rollback rehearsal** before beta |
| Reproducibility | A `verify:reproducible` check (build twice, compare asset hashes) | Running it in CI on a tagged commit; the staging deployment |

---

## 3. Plan

### 3.1 App version + release manifest

- **Release manifest** (`scripts/build-release-manifest.mjs`, run after `build`) writes `output/release/release-manifest.json` recording: `appVersion`, `buildCommit` (env `GIT_SHA`), story package identity + `contentHash` (`80f3d5a2…`), `concordanceSha256` (`c779795f…`), `literaryRelease` (`eternal-return-literary-v1.0.2`), `saveSchema` (`1.3.0`), the **app↔package compatibility** range, and **sha256 checksums** of every `dist` asset. Timestamps are passed in (not read at build) to keep it reproducible.
- **Lockstep check** — a small validator (test or script) that fails if the three `CURRENT_APP_VERSION` / `package.json` version sites disagree, so a bump can't drift.

### 3.2 Caching, redirects, custom 404 (Cloudflare Pages)

Added to `public/_headers` (co-located with the security set, but as the 8.4 caching layer):

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/index.html
  Cache-Control: no-cache
/
  Cache-Control: no-cache
```

Immutable, content-hashed assets cache for a year; HTML is `no-cache` (revalidated every load) so a new release is picked up immediately. `public/_redirects` handles the canonical host (apex↔www, per the owner's choice) and a catch-all to a **branded `public/404.html`** (the app is hash-routed, so real navigation is under `/`; genuinely unknown paths get the 404). Content types and compression are Cloudflare defaults.

### 3.3 Release notes + checksums

- The manifest's `assets` map **is** the checksum record; a companion `SHA256SUMS` text file is emitted for human/tooling verification.
- A `CHANGELOG.md` (Keep-a-Changelog style) + a release-notes convention; the release records the app version, the (unchanged) package/concordance/literary identities, and the manifest checksum.

### 3.4 One-command rollback (save-safe)

- **Primary (edge, instant):** promote the prior known-good Cloudflare deployment — documented in the runbook; owner-run (needs the Cloudflare account).
- **Source of truth:** `scripts/rollback.mjs` identifies the prior known-good release (from tags / `release-manifest.json` history), prints the exact rollback command + the target app+package identity, and (optionally) checks out that tag for a rebuild. It never rewrites M or package content.
- **Save safety (the acceptance):** because the save schema is frozen at `1.3.0`, a rollback across app versions does not change the save format. A new test asserts a save stamped with a _newer_ `appVersion` loads cleanly under the current app (and that a reset/round-trip is unaffected) — proving "rollback completes without corrupting existing local saves."

### 3.5 Reproducible artifact

- `verify:reproducible` builds twice from a clean tree and compares the `dist` asset hashes; a tagged commit therefore yields a byte-stable artifact whose identity the manifest records. (Owner-gated: running it in CI on the tag and producing the staging deployment.)

---

## 4. Owner forks — decisions needed before 8.4 code

### 4.1 App version — **Recommend: bump `0.1.0` → `0.2.0`**

| Option | Consequence |
| --- | --- |
| **A. Bump to `0.2.0` (recommended)** | A deliberate minor marking the Phase-8 operable-production shell (headers, monitoring, sanitization). Updates the 3 lockstep sites + tests + the manifest. Package/save identities stay frozen. Saves record the new `appVersion` (metadata only). |
| B. Keep `0.1.0` | Simplest; the manifest still records `0.1.0`. Defers a bump to the beta/RC (Phase 9). |

Either way the **package stays `eternal-return@1.3.0`** and the **save schema stays `1.3.0`**.

### 4.2 Canonical host — owner/DNS decision

Apex (`example.com`) vs. `www.example.com` as canonical, with the other 301-redirecting. Needed for `_redirects` + HSTS-preload (8.2). Tell me the domain + preference, or "TBD" and I'll parameterize it.

### 4.3 HTML caching — **Recommend: `no-cache` for HTML, `immutable` for `/assets/*`**

Ensures new releases are seen immediately while hashed assets cache for a year. (Recommendation; I'll proceed unless you prefer a short `max-age` on HTML.)

### 4.4 Rollback primary mechanism — **Recommend: Cloudflare instant deployment rollback**

Promote the prior known-good deployment at the edge (seconds), with a git revert as the source-of-truth follow-up. (Recommendation; the in-repo script + runbook support both.)

---

## 5. Gate mapping

- _A tagged commit produces a reproducible artifact_ → `verify:reproducible` + the release manifest (owner-run in CI on the tag; the **staging deployment** is owner-gated).
- _Rollback completes without corrupting existing local saves_ → the save-safety test (frozen schema + forward/back-compat) in the gate battery, plus the rollback runbook; the **rollback rehearsal** is owner-run (empty result table, not fabricated).
- All standing gates stay green; **no package/concordance/literary/save identity moves** — only the app version (if bumped) and the new manifest/caching/rollback tooling.

Once §4 is answered I implement **8.4's in-repo pieces**, run the full gate battery, commit, and **stop for confirmation before Batch 8.5**.
