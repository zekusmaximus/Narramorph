# Deployment, release, and rollback runbook

Narramorph v1 is a static, client-side app (ADR 0006) deployed on **Cloudflare Pages** at **narramorph.com**. This runbook covers linking the host, the release process, and rollback. Security headers are in [`public/_headers`](../public/_headers) (see [SECURITY_HEADERS.md](SECURITY_HEADERS.md)); observability is in [OBSERVABILITY.md](OBSERVABILITY.md).

## 1. Cloudflare Pages setup (owner-run — link the repo)

| Setting                | Value                                 |
| ---------------------- | ------------------------------------- |
| Framework preset       | None (Vite)                           |
| Build command          | `npm run build`                       |
| Build output directory | `dist`                                |
| Node version           | `22` (matches CI; engines `>=22 <25`) |
| Root directory         | repository root                       |

**Environment variables / secrets** (Production; add only what you use):

| Name | Purpose |
| --- | --- |
| `VITE_SENTRY_DSN` | Enables error reporting (absent → fully inert). Build-time. |
| `VITE_APP_RELEASE` | Release id for reports, e.g. `narramorph@0.1.1+<sha>`. |
| `SENTRY_UPLOAD` | `true` in CI to emit hidden maps for private upload. |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Secrets for `npm run sourcemaps:upload`. |
| `GIT_SHA` | Recorded in the release manifest (Cloudflare provides `CF_PAGES_COMMIT_SHA`). |

**Custom domain & TLS:** add `narramorph.com` (apex) as the custom domain; `_redirects` sends `www.narramorph.com → narramorph.com` (301). HSTS (from `_headers`) is preload-eligible — submit to <https://hstspreload.org/> only after HTTPS is confirmed across the apex and all subdomains (8.2).

**Environments:** production builds from the default branch; **PR preview deployments** and a **protected staging** environment are Cloudflare Pages features to enable when linking (owner-run).

## 2. Release process

1. `npm run build` — produces the immutable, content-hashed `dist/` (+ `_headers`, `_redirects`, `404.html`, self-hosted fonts).
2. `npm run release:manifest` — writes `output/release/release-manifest.json` (app version, story-package identity + frozen `contentHash`, app↔package compatibility, concordance sha256, accepted literary release, save schema, and per-asset sha256) and `output/release/SHA256SUMS`.
3. Tag the commit (e.g. `app-v0.1.1`) and record the entry in [`CHANGELOG.md`](../CHANGELOG.md).
4. (CI, if monitoring is on) build with `SENTRY_UPLOAD=true`, then `npm run sourcemaps:upload` (uploads + deletes maps before publish), then deploy.
5. Optional: `npm run release:verify` builds twice and confirms the artifact is byte-reproducible.

**Versioning rule:** the app version moves independently, but must stay inside the frozen package's `supportedAppRange` (`>=0.1.0 <0.2.0`) — the lockstep test (`src/scope/appVersionLockstep.test.ts`) enforces this. The **package, concordance, literary release, and save schema are frozen** for v1; changing any is a separate content-release event, not a deployment.

## 3. Rollback

`npm run release:rollback -- <prior-release-tag>` prints the plan. In brief:

- **Fastest (instant, no rebuild):** Cloudflare Pages → Deployments → "Rollback to this deployment" on the prior known-good build. Hard-refresh narramorph.com (HTML is `no-cache`).
- **Source of truth:** `git checkout <tag> && npm ci && npm run build && npm run release:manifest`, then redeploy.

**Save safety:** the save schema is frozen at `1.3.0`, so a rollback across app versions never changes the save format — an older app loads a newer app's save and preserves progress (`src/domain/progress/rollbackSafety.test.ts`). No local save is migrated or rewritten.

## 4. Rollback rehearsal (owner-run before beta — the acceptance; not fabricated)

Rehearse a production rollback and confirm local saves survive:

1. Deploy release _A_; in a browser, read a passage so a save exists in `localStorage`.
2. Deploy release _B_.
3. Roll back to _A_ (Cloudflare instant promote).
4. Reload narramorph.com; confirm the saved journey still loads and progress is intact.

### Results (owner-run — filled in when run)

| Date      | From → To (app/package) | Method | Rollback time | Local save intact | Notes |
| --------- | ----------------------- | ------ | ------------- | ----------------- | ----- |
| _pending_ |                         |        |               |                   |       |
