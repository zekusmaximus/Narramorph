# Security headers checklist

Narramorph is a static, client-side app (ADR 0006) served from **Cloudflare Pages**. Security response headers are defined once in [`public/_headers`](../public/_headers) (copied to the build root as `_headers` and applied at the edge to every response). This document is the checklist the Batch 8.2 acceptance gate names, plus how to verify it against a deployed or preview URL.

## The header set (and why)

| Header | Value | Why |
| --- | --- | --- |
| `Content-Security-Policy` | see below | Restricts what can load/run; the primary defence against injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years across subdomains; preload-eligible (custom domain) |
| `X-Content-Type-Options` | `nosniff` | Stops MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage to other sites |
| `Permissions-Policy` | all powerful features `=()` | Disables camera, geolocation, microphone, USB, etc. (the app uses none) |
| `X-Frame-Options` | `DENY` | Clickjacking protection for older UAs (paired with `frame-ancestors 'none'`) |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the browsing context |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents cross-origin embedding of the app's resources |

### Content-Security-Policy

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
font-src 'self'; connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io;
worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';
form-action 'self'; manifest-src 'self'; upgrade-insecure-requests
```

- **`script-src 'self'`** — strict, with **no** `'unsafe-inline'` / `'unsafe-eval'`. Verified feasible: the built `index.html` has no inline `<script>` (only Vite's external hashed module), and no `eval`/ `new Function`/`WebAssembly` appears in the bundle. This is the XSS boundary.
- **`style-src 'self' 'unsafe-inline'`** — a documented, necessary relaxation: framer-motion, `@xyflow/react`, and three/react-three-fiber inject styles at runtime, and `index.html` carries an inline FOUC/`@font-face` block. Static hosting cannot nonce per request, and runtime-injected styles cannot be hashed. Inline **style** is not script execution.
- **`font-src 'self'`** — Inter is self-hosted under `/fonts` (SIL OFL; see `public/fonts/OFL.txt`); there is no external font origin.
- **`worker-src 'self' blob:`** — the opt-in 3D view (three.js) spawns Web Workers from blob URLs. The 2D reader (the default and the accessible path) uses no workers.
- **`connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io`** — the app makes no network calls of its own (the scope-gate guard enforces first-party `src/`); the Sentry ingest hosts are the one deliberate egress, reached only after opt-in error-reporting consent (Batch 8.3).
- **`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, `upgrade-insecure-requests`** — standard hardening.

## HSTS preload (owner-gated)

The `preload` directive is a **commitment**: the apex domain and all subdomains must be HTTPS-only, and removal from the preload list is slow. Ship the header now, but submit the domain to <https://hstspreload.org/> **only after** the custom domain is verified HTTPS-everywhere at deploy (Batch 8.4). If any subdomain cannot be HTTPS-only, drop `includeSubDomains` and `preload`.

## How to verify (owner-run, against a served URL)

The `_headers` file is applied by the edge, so headers can only be checked against a **deployed or preview** URL — not the offline build. `vite preview` does not apply `_headers`.

1. **Repo verifier:** `npm run headers:check -- https://<preview-or-prod-url>` — asserts the required headers and key CSP directives; exits non-zero on any failure.
2. **External scanners (recommended at release):**
   - <https://securityheaders.com/> — target grade A/A+.
   - <https://observatory.mozilla.org/> — target grade A+.
   - <https://hstspreload.org/> — confirm preload eligibility before submitting.
3. **App-compat spot check:** open the deployed site with DevTools → Console and confirm there are **no CSP violation reports** on the landing page, an open passage, the settings/progress dialogs, and — if used — the 3D view. (Test in an Incognito window so browser-extension content scripts don't clutter the console.)

**Note — Cloudflare Web Analytics:** leave Cloudflare's Web Analytics **automatic setup OFF** for narramorph.com. When enabled, Cloudflare injects `static.cloudflareinsights.com/beacon.min.js` into the HTML at the edge, which `script-src 'self'` then blocks — a console CSP violation that is the CSP working as intended, not a bug. Keeping automatic injection off preserves the strict `script-src 'self'` XSS boundary and the no-third-party-scripts posture (Cloudflare's **server-side** zone analytics — requests, bandwidth, referrers — still work without the beacon). Enabling the client-side beacon would require adding its host to `script-src`/`connect-src` here and disclosing the analytics in [PRIVACY.md](PRIVACY.md) — a deliberate posture change, not a default.

## Results (owner-run — filled in after deploy; not fabricated)

| Date | URL (preview/prod) | `headers:check` | securityheaders.com | Mozilla Observatory | HSTS preload | CSP violations in console | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _pending_ |  |  |  |  |  |  |  |

## Content-sanitization (verified in the gate battery)

The header layer pairs with input sanitization, which is verified offline in `test:run`:

- **Save-file import** (`src/domain/progress/importSanitization.ts`) — size-bounded and strips `__proto__`/`constructor`/`prototype` during parse (`importSanitization.test.ts`: prototype pollution, oversized, malformed, no false positives).
- **Rendering** — React auto-escapes prose; there is no `dangerouslySetInnerHTML` and no Markdown/HTML renderer, so passage prose cannot inject markup.
- **Export** — the print-HTML builder escapes every interpolated value (`journeyExport.test.ts` asserts `<script>` and event-handler attributes are escaped, not live).
