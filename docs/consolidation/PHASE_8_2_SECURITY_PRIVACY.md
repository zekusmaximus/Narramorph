# Phase 8.2 — Security headers, privacy, and data minimization

**Status: design proposed; awaiting owner decisions. No production/config code has been written.**

Batch 8.2 hardens the deployed site: security headers/CSP at the edge, a privacy policy that matches actual network behavior, a local-data inventory with data-minimization, and sanitization of the untrusted-input surface (roadmap Batch 8.2). It builds on the settled architecture from 8.1 — **client-only, no backend** (ADR 0006) — and the chosen host, **Cloudflare Pages**, on a **custom domain** (owner decisions, 8.1).

Acceptance gate (roadmap): _the deployed site passes the security-header checklist and content sanitization tests; privacy documentation matches actual network behavior._

Interface/meta + config work only. Per ADR 0002 no authored runtime prose; per ADR 0001 no dependency on P or M; content/package/save identities stay frozen.

---

## 1. Grounded current-state audit (branch base `dbd68aa`, verified)

### 1.1 Security headers: none exist yet (greenfield)

There is no `_headers`, `vercel.json`, `netlify.toml`, or `<meta http-equiv>` CSP anywhere in the repo. No host was chosen before 8.1, so no header layer exists. 8.2 creates it as committed Cloudflare Pages files.

### 1.2 CSP feasibility — audited against the built app

| Directive | Feasible value | Evidence |
| --- | --- | --- |
| `script-src` | **`'self'`** (no `'unsafe-inline'`, no `'unsafe-eval'`) | Built `dist/index.html` has **no inline `<script>`** — only Vite's external hashed `<script type="module" src=/assets/…>`. No `eval(`/`new Function(`/`WebAssembly` in any `dist/assets/*.js`. |
| `style-src` | **`'self' 'unsafe-inline'`** (required) | `index.html` has an inline `<style>` (FOUC/loading block), and framer-motion, `@xyflow/react`, and three/react-three-fiber **inject styles at runtime** (confirmed in `animation-vendor`, `flow-vendor`, `NarromorphCanvas` chunks). Static hosting can't nonce per-request; hashing runtime-injected styles isn't feasible. This is not a script-execution vector — `script-src 'self'` remains the XSS boundary. |
| `img-src` | `'self' data:` | Icons are inline SVG (lucide-react components), not external; `data:` covers any inlined image. |
| `font-src` | `'self'` **if fonts are self-hosted** (see §3.1) | Currently `index.html` loads Google Fonts (external) — see below. |
| `connect-src` | `'self'` for v1 (extended to the Sentry ingest host in 8.3) | The app makes **zero network calls** (8.1 audit); the only future egress is opt-in Sentry (8.3). |
| `default-src` | `'self'` | Everything resolves to same-origin once fonts are self-hosted. |

**External-origin finding (the CSP-relevant decision):** `index.html` currently loads **Google Fonts** — `preconnect` to `fonts.googleapis.com`/`fonts.gstatic.com` and a stylesheet `fonts.googleapis.com/css2?family=Inter…`. This is both a **CSP relaxation** (needs `style-src …googleapis` + `font-src …gstatic`) and a **privacy leak** (Google receives the reader's IP and Referer on every first paint), which conflicts with the v1 "nothing transmitted without consent" posture. See the §3.1 fork.

### 1.3 Rendering & export are already safe; import is the real surface

- **Rendering:** no `dangerouslySetInnerHTML` / `.innerHTML` / `document.write` anywhere in `src/`, and there is **no Markdown/HTML renderer dependency** — passage prose is rendered as React text, which auto-escapes. So displayed prose cannot inject HTML/script.
- **Export:** the print-HTML builder (`src/domain/export/journeyExport.ts`) already routes **every** interpolated value through `escapeHtml()` (`& < > " '`) — titles, prose, adaptation notes, headings, and node IDs. The Markdown export is plain text. Export is a local download; nothing is transmitted.
- **Import (untrusted input):** the one runtime path that ingests untrusted bytes is the **save-file import** (Phase 7.4): `importProgress(data)` and `progressRepository.load()` do `JSON.parse(...)` → `prepareSavedState(parsed, nodes)` → applied to state, including `Object.assign(state.preferences, prefs)` and `Object.assign(state.viewport, viewport)`. This is where 8.2's sanitization + malicious-payload tests focus: **prototype pollution** (`__proto__`/`constructor`/`prototype` keys reaching `Object.assign`/set), **oversized** input, **malformed** JSON, and prose fields carrying HTML/`javascript:`/`data:` strings (which must never be rendered as HTML — confirmed they aren't, but tested to lock it in).
- **Story packages** are **first-party checked-in bytes** validated by content hash at build (`story:package:validate`, `eternal-return@1.3.0` `80f3d5a2…`); there is no user-facing story-package upload at runtime in the client-only design. The roadmap's "imported story packages" concern is therefore satisfied by build-time hash validation; the runtime untrusted surface is the save file.

### 1.4 Local-data inventory (no cookies, no transmission)

All persistence is device-local; there are no cookies and no network transmission (8.1 audit).

| Storage key | Store | Contents | Cleared by |
| --- | --- | --- | --- |
| `narramorph-saved-state` | localStorage | Journey progress, preferences, and the visit-event log (resolved prose the reader already saw + SHA-256 hashes) | Reset / new journey; site-data clear |
| `narramorph-saved-state.corrupt` | localStorage | Quarantined raw bytes of a corrupt save (for user download) | Dismiss/clear quarantine |
| `narramorph-preferences` | localStorage | Reading preferences (theme, text size, line height, reduce-motion, export-notes) | Site-data clear |
| `narramorph-intro-seen-version` | localStorage | Onboarding-seen marker (`INTRO_VERSION`) | Site-data clear |
| `narramorph-revisit-hint-seen` | localStorage | One-time revisit-hint dismissal | Site-data clear |
| `narramorph-3d-mode` | localStorage | Optional 3D-view toggle | Site-data clear |
| `narramorph-scroll:<nodeId>` | sessionStorage | Per-passage scroll offset for interrupted reads | Tab close; site-data clear |
| `narramorph-export-*` | localStorage | Export-preference marker(s) | Site-data clear |

See [`docs/VISIT_HISTORY_PRIVACY.md`](../VISIT_HISTORY_PRIVACY.md) for the visit-log detail.

---

## 2. In-repo vs. owner-gated split

| Work | In-repo (agent-doable now) | Owner-gated |
| --- | --- | --- |
| Security headers / CSP | `public/_headers` (Cloudflare Pages), a documented header set, and a **security-header checklist** doc | Applying at the edge; the **HSTS preload submission** (hstspreload.org) after the custom domain is HTTPS-verified |
| Fonts | Self-host Inter (if chosen) → tighter CSP + no external origin | Owner picks self-host vs. allowlist (§3.1) |
| Sanitization | Import hardening (prototype-pollution strip, size cap, schema) + a malicious-payload test suite | — |
| Privacy | `docs/PRIVACY.md`, an in-app "Privacy" link, data-deletion/reset instructions, a data inventory | The **controller/contact identity** to name in the policy (§3.2); custom-domain HSTS/DNS specifics |
| Verification | A header-checklist doc + an optional `scripts/check-security-headers.mjs` that an owner runs against the live URL | Running it against the deployed site |

---

## 3. Plan

### 3.1 Fonts — the CSP + privacy decision (owner fork)

| Option | CSP impact | Privacy impact | Recommendation |
| --- | --- | --- | --- |
| **A. Self-host Inter (recommended)** | `font-src 'self'`, `style-src 'self' 'unsafe-inline'`, `default-src 'self'` — tightest | **No external requests**; nothing leaks to Google; matches the v1 "no transmission" posture | Ship the Inter woff2 subset in `public/fonts/`, `@font-face` in CSS, drop the Google `<link>`s |
| B. Allowlist Google Fonts | `style-src … https://fonts.googleapis.com; font-src … https://fonts.gstatic.com` — looser | Google receives IP + Referer on first paint (a third-party request the privacy policy must disclose) | Only if self-hosting is undesirable |

**Recommendation: A (self-host).** It removes the sole external origin, enables `default-src 'self'`, avoids a privacy disclosure, and improves first-paint. It also keeps the door open to `Cross-Origin-Embedder-Policy` later. (Licensing: Inter is OFL — redistribution is permitted with the license file.)

### 3.2 Security headers (`public/_headers`, applied to `/*`)

Proposed set (self-hosted-fonts variant; the Google-Fonts variant only loosens `style-src`/`font-src`):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self';
  frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; worker-src 'self';
  upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(),
  geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(),
  picture-in-picture=(), publickey-credentials-get=(), usb=(), xr-spatial-tracking=()
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

- **CSP** — `script-src 'self'` is the XSS boundary (audited feasible). `style-src 'unsafe-inline'` is a documented, necessary relaxation (runtime style injection), not a script vector. `connect-src 'self'` gains the Sentry ingest host in 8.3. `frame-ancestors 'none'` + `X-Frame-Options: DENY` = clickjacking protection (belt + suspenders for older UAs).
- **HSTS** — with a custom domain, `max-age` 2 years + `includeSubDomains` + `preload`. **Preload is a commitment** (the domain and all subdomains must be HTTPS-only, ~indefinitely); the header ships now, but the **hstspreload.org submission is owner-gated** and done at deploy (8.4) once HTTPS-everywhere is verified. If any subdomain can't be HTTPS-only, drop `includeSubDomains`/`preload`.
- **Permissions-Policy** disables every powerful feature (the app uses none).
- Immutable-hashed-asset caching headers (`/assets/*` → `max-age=31536000, immutable`; HTML → `no-cache`) are co-located here but belong to **Batch 8.4**; 8.2 adds only the security set unless the owner wants them together.

### 3.3 Sanitization + tests (the content-sanitization acceptance)

- **Import hardening.** Add a `sanitizeParsedSave()` step between `JSON.parse` and `prepareSavedState` that: parses with a reviver dropping `__proto__`/`constructor`/`prototype` keys (prototype-pollution defense); enforces a **max import byte size**; and rejects non-object roots. Keep the existing migration/validation. `Object.assign` targets stay known objects, but the dangerous keys are removed before they can reach any set.
- **Tests (the acceptance gate).** A `saveImportSanitization.test.ts` covering: (a) a `__proto__` pollution payload does not mutate `Object.prototype`; (b) oversized input is rejected cleanly (existing non-blocking failure path); (c) malformed JSON is rejected; (d) a save whose prose field contains `<script>`/`javascript:`/`data:` is never rendered as HTML and round-trips through export **escaped**; (e) unknown/extra fields are ignored. Rendering-escape and export-escape are also asserted (regression locks on the already-safe paths).
- **Malicious links.** The app renders no user-provided links; the only external link is the first-party GitHub docs link. Documented; a test asserts imported URL-like strings are not turned into live anchors.

### 3.4 Privacy policy + data minimization

- **`docs/PRIVACY.md`** — a public privacy policy matching **actual** behavior: the local-data inventory (§1.4), the fact that **v1 transmits nothing** (no backend, no analytics, no third-party requests once fonts are self-hosted), a clearly-marked "when you opt in to error reporting (Batch 8.3)" section (default **off**, redaction rules), **no cookies / no trackers**, data-deletion/reset instructions (the Phase 7.4 reset + clearing site data), and a contact channel.
- **In-app surface** — a discreet footer **"Privacy"** link (mirroring the existing accessibility link) to the policy, plus a one-line "stored on your device only" note near the reset control.
- **Data minimization** — confirm no key stores more than needed; the visit-log caps already bound prose retention (`VISIT_EVENT_LOG_LIMITS`). No change required beyond documenting it.

### 3.5 Security-header checklist + verifier

- **`docs/SECURITY_HEADERS.md`** — the checklist the acceptance gate names (each header, expected value, why), plus an **empty results column** the owner fills after deploying (mirrors Phase 7's manual-AT table).
- **`scripts/check-security-headers.mjs`** (optional, recommended) — an owner-run script that fetches a given URL and asserts the header set, for the deployed site (and preview URLs). It targets a live URL, so it's owner-run at deploy, not in the offline gate battery.

---

## 4. Owner forks — decisions needed before 8.2 code

| # | Decision | Recommendation |
| --- | --- | --- |
| 1 | **Fonts:** self-host Inter vs. allowlist Google Fonts | **Self-host Inter** (tighter CSP, no privacy leak, faster first paint) |
| 2 | **Privacy policy controller/contact:** who is named and how are readers to reach them? | Owner must provide — an entity/name + a contact (email, or "the repo issue tracker only"). Not fabricated. |
| 3 | **CSP rollout:** enforce directly vs. `-Report-Only` first | **Enforce** (feasibility is audited; no report collector exists until Sentry in 8.3) |
| 4 | **Header scope:** security headers only in 8.2, or also the immutable-asset caching headers now | **Security only in 8.2**; caching with 8.4 (its natural batch) — unless you prefer one `_headers` pass |

Secondary (recommend + proceed unless you object): `Cross-Origin-Opener-Policy`/`Cross-Origin-Resource-Policy` `same-origin` **yes**; `Cross-Origin-Embedder-Policy` **deferred** (only safe once fully self-contained; revisit in 8.5); HSTS `preload` header shipped now, **submission owner-gated at deploy**.

---

## 5. Gate mapping

- _Passes the security-header checklist_ → `docs/SECURITY_HEADERS.md` + `public/_headers` + the owner-run verifier against the deployed/preview URL (owner-gated result table).
- _Content sanitization tests pass_ → `saveImportSanitization.test.ts` in the gate battery (`test:run`), plus the standing render/export-escape assertions.
- _Privacy documentation matches actual network behavior_ → `docs/PRIVACY.md` describes zero-transmission v1 (self-hosted fonts) + the opt-in-only 8.3 monitoring; the 8.1 scope-gate guard keeps first-party egress at zero.

Once the §4 forks are answered I implement **8.2's in-repo pieces** (headers file, self-hosted fonts if chosen, import sanitization + tests, privacy + header-checklist docs, the optional verifier), run the full gate battery, commit, and **stop for confirmation before Batch 8.3** — matching the per-batch rhythm.
