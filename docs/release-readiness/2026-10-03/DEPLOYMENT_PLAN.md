# Artifact publishing, deployment, and rollback completion

Owner roles: technical maintainer and Cloudflare operations owner. Priority: P1 before promotion. Estimate: 3–4 engineering days plus account access and rehearsal. Findings: R04/R05; existing issue #180.

## Start from the real host inventory

The accepted host is Cloudflare Pages. The repository records a July 19 production deployment/header scan, while older documents claim none exists. Before changing deployment behavior, record the actual account/project, project type, production branch, apex/custom domains, current deployment ID, deployed commit, preview protection, and any automatic production-build path. Review-runner 403/502 responses do not establish their current state.

Keep the existing project/domain where possible. Cloudflare documents that [an existing Git-integrated Pages project can disable automatic deployments and deploy through Wrangler](https://developers.cloudflare.com/pages/configuration/git-integration/). This does not convert its project type to Direct Upload. Do not recreate a production project or switch to Workers merely to attach an artifact pipeline.

## REL-01 — Harden release identity and packaging

Files: `scripts/build-release-manifest.mjs`, `scripts/verify-reproducible.mjs`, bundle/map checker, package scripts, new artifact verifier.

1. Fail if the build SHA is missing, malformed, `unknown`, or differs from the checked-out candidate. Require app/package/schema/literary identities and a parseable supported app range. `saveSchema:null` and `appSatisfiesRange:null` cannot pass. Use a validated semver implementation or reject unsupported range syntax explicitly.
2. Run package and literary validators and compare actual package/concordance hashes with accepted metadata. Preserve the deliberate package-build editorial provenance `eternal-return-literary-v1.0.1`; the accepted literary pointer `v1.0.2` is a different identity. Never “repair” that distinction by editing frozen metadata.
3. Fix all build inputs: precise Node/npm/tool versions, committed lockfiles, release ID `narramorph@<app-version>+<sha>`, monitoring choice, allowed build variables, and `SOURCE_DATE_EPOCH` derived from the candidate commit. Emit a sorted manifest for the **final** deploy tree after source-map injection/upload/removal and any other mutation.
4. Package `dist/`, release manifest, asset checksum list, evidence summary, and an archive checksum. Put the public manifest at a documented path such as `/.well-known/narramorph-release.json`. Define the checksum manifest's exclusion of itself to avoid a circular hash; verify every other deployed file and forbid unlisted files. Keep private maps outside the public package.
5. Recursively reject `.map` files, unexpected map references, secrets, symlinks/path traversal, empty output, and identity/checksum mismatches. Verify the archive after unpacking into a clean directory. The current top-level `dist/assets` map count is not sufficient.
6. Make reproducibility a verifier, not a publisher. Compare two isolated clean build directories with identical release inputs; do not let its second build overwrite the artifact selected for deployment. Record differences and fail on unexplained bytes.

Acceptance: missing identity, malformed range, modified asset, unlisted file, or nested map fails with a clear reason. Repeated identical inputs yield the same public files/digest. The existing 47-file successful comparison is a useful baseline, not proof of this expanded contract.

## REL-02 — Build once and deploy the reviewed bytes

Add a release workflow with a manual candidate selector and a protected release-tag path. Check that the selected full SHA belongs to the intended protected source history and has the required checks; do not trust checks from an older Dependabot base or another SHA. Reject conflicting tag/version/release identities.

Create an annotated release tag and retain maintainer signature verification where the GA policy requires a signed tag. The workflow must not manufacture an owner's approval or reuse a previous candidate's sign-off. Make approval apply to the artifact digest, even if the source commit is unchanged.

| Stage | Input and action | Required evidence |
| --- | --- | --- |
| Candidate checks | Clean checkout/install; corrected CI gates, fresh audits, content identities, browser/performance checks | Candidate SHA, tool versions, full gate results and exception register |
| Package | Build the selected public variant once; private maps if enabled; final budgets/manifest/archive verification | Artifact ID, SHA-256, all identities, no-map proof; reproducibility comparison kept separately |
| Staging | Download/unpack/verify that artifact; deploy the bytes to a protected Pages preview/staging target | Deployment ID/URL, matching manifest/assets, headers, privacy, smoke results |
| Release decision | Attach manual QA, real rollback evidence, operational ownership, and current risk disposition | Explicit beta/RC/GA decision against existing policy |
| Production | Download/verify the **same artifact**; create a production deployment; perform edge/smoke checks | Production deployment ID, origin, digest, previous known-good production ID, verification result |
| Release record | Publish tag/GitHub release notes and archive/checksums/evidence after success | Source→artifact→deployment mapping and rollback pointer |

Use pinned Wrangler/tooling and a narrowly scoped Cloudflare credential through a protected production environment. Serialize promotions; prevent an unrelated `main` push or host-side rebuild from bypassing the artifact gate. After a staging rehearsal works, disable conflicting automatic production builds. Preserve useful PR previews without treating their rebuilt bytes as release candidates.

A preview URL is not itself promoted by a promised generic API. Production deployment must use the identical verified file set and be confirmed as a production deployment in the actual Pages project. Freeze build-time configuration for both targets. If different DSNs or other build variables require different bytes, treat them as separate candidates with separate verification; do not claim identical-artifact promotion.

Preview/staging and production origins have separate browser storage. Use synthetic saved journeys for staging, then verify production save continuity on the production origin. Record artifact retention and known-good retention; proposed minimum is the current and two previous releases for at least 90 days, with release evidence retained alongside their tags. Assess old lazy-asset retention separately: keeping a deployment record alone does not prove that its hashes remain served at the production origin.

## REL-03 — Make rollback concrete and rehearse A→B→A

Implement a read-only inventory and an explicit rollback command/action selecting a validated prior deployment ID. Keep dashboard rollback as the emergency path. Cloudflare's [rollback documentation](https://developers.cloudflare.com/pages/configuration/rollbacks/) allows successful **production** deployments as targets; preview deployments are ineligible. Record a real target before promotion rather than hoping an older artifact can be rebuilt during an incident.

Suggested triggers: unreadable/corrupted saves, reader navigation dead end, exposed maps/sensitive telemetry, or failed production asset/header verification. Proposed recovery target: ≤10 minutes from rollback decision to verified recovery. For local progress, preserve the last successfully persisted save; do not promise recovery of unsaved browser memory.

Rehearsal on an origin that stays constant:

1. Deploy actual artifact A; create representative early, long-history, convergence, and completed synthetic journeys. Keep an exported snapshot and a tab with some lazy passages still unopened.
2. Deploy actual artifact B; reload and read/save more progress. Open lazy passages from the already-open A tab and confirm usable recovery if a previous hash is unavailable. Decide and implement asset retention or a safe reload/retry UX before accepting that behavior.
3. Roll back by known-good production deployment ID to A; record elapsed time and deployment/manifest verification.
4. Reload the B-written saves in actual A. Compare meaningful progress, selected variations, endings, and export against expected snapshots; verify no loss or corruption and repeat the old-tab check.

The current unit test relabels versions within one implementation. Add a compatibility check using archived A/B artifacts or their real save readers, then retain the deployment rehearsal. A frozen schema helps but does not establish compatibility by itself; an older runtime may normalize or rewrite data. Correct the runbook's unconditional “no save is rewritten” claim to match observed behavior.

## REL-04 — Verify production edge behavior and ownership

Check HTTPS/apex and `www` redirects with path/query preservation, security headers on HTML/assets/404, the real missing-route status, cache behavior, and source-map unavailability. A SPA fallback returning HTML with status 200 at a `.map` URL is not a successful map exposure test; verify body/content type and asset inventory. Check CSP through real reading/exports/3D/opt-in error reporting. Repeat header/security scans and address current external-report discrepancies, including any edge-added reporting such as NEL.

Record HSTS preload status; the repository says submission occurred July 19. Do not resubmit blindly or claim immediate inclusion. Capture provider logging/privacy settings and monitoring state, then identify release/support owner, alert contact, rollback operator, and incident communication location. Update `RELEASE_ROLLBACK.md`, `SECURITY_HEADERS.md`, and `OBSERVABILITY.md` from observed results.

Acceptance: a candidate can be staged and published from a retained archive, reversed to a real known-good production deployment, and independently identified at the live origin. Every owner-run result includes a date, deployment ID, artifact digest, observed outcome, and responsible person.
