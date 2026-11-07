# Privacy policy

Last updated: November 7, 2026 · Applies to: Narramorph (the _Eternal Return of the Digital Self_ interactive edition), v1.

## Summary

**Your reading stays on your device.** Narramorph is a static, client-side application with no backend (see [ADR 0006](adr/0006-v1-client-only-no-backend.md)). It does not have accounts, it does not sync, and it **does not send your reading history, your progress, your saved journeys, or any personal information to us or to any third party.** Everything the app remembers is stored locally in your own browser.

## What is transmitted

**Nothing about your reading.** The app has **no analytics, tracking, or advertising**, and it loads **no third-party fonts or externally hosted scripts**. After the initial download of the application's files from the hosting provider, the app runs entirely in your browser. (Fonts are served from the same site as the app; there is no request to Google Fonts or any other third party.) The only request the app itself can make is an **opt-in crash report**, which is off unless you turn it on (see [below](#optional-error-reporting-opt-in-off-by-default)).

The complete list of network activity is:

- **Loading the app** — your browser downloads the application's files (HTML, JavaScript, CSS, fonts, story content) from the hosting provider (Cloudflare Pages), exactly as it would for any website. The host may keep standard server logs (such as IP addresses) as part of delivering the site; that is the host's processing, not the app's, and no reading data is included.
- **Network error reports to the host** — Cloudflare adds Network Error Logging headers to the site's responses. Browsers that support this standard (mainly Chromium-based browsers such as Chrome and Edge) may send Cloudflare a short technical report when a request to the site **fails** — for example, a dropped connection. Successful requests are not reported. A report describes the failed request (its address without the in-page passage fragment, the type of network error, the server address, protocol, and timing) and, like any request, reaches Cloudflare from your IP address. It contains no reading data. This is Cloudflare's processing at the hosting layer, not something the app sends.
- **Crash reports, only if you opt in** — sent to Sentry, the error-monitoring service, as described below.
- **Links you choose to open** — e.g. the "Accessibility" and "Privacy" links go to this project's public GitHub repository. Following a link is your action and takes you to that third-party site under its own policies.

## What is stored on your device

The app keeps your progress and preferences in your browser's local storage on **your device only**. None of it is transmitted. It includes:

| Stored item | Purpose |
| --- | --- |
| Journey progress and the visit-event log (the passages you opened, in order, including the prose you already saw and integrity hashes) | Lets you continue where you left off and export your journey ([details](VISIT_HISTORY_PRIVACY.md)) |
| Reading preferences (theme, text size, line height, reduced motion, export options) | Remembers how you like to read |
| Onboarding / hint markers, the optional 3D-view toggle, and per-passage scroll position | Small interface conveniences |
| A quarantined copy of a corrupt save (only if a save can't be read) | Lets you download and recover it instead of losing it silently |

There are **no cookies** and **no third-party trackers**. Exports (Markdown, print, or a machine-readable save file) are **downloads to your device** that you initiate; nothing is uploaded.

## Optional error reporting (opt-in, off by default)

The app includes an **opt-in** crash-reporting option to help fix problems. The public site at narramorph.com is configured to use [Sentry](https://sentry.io) (its US data region) for these reports. Reporting is **off by default** and sends **nothing** unless you either:

- turn on **Settings → "Send anonymous crash reports"**, after which crashes are reported automatically until you turn it off; or
- choose **"Report this problem"** on the error screen after a crash, which sends that report and keeps reporting on for the rest of that browser session without changing your saved setting.

A copy of the app built without a monitoring service (for example, a local development build) never sends reports, whatever the setting.

Every crash report is **redacted on your device before it is sent**, so that story prose, your reading history and journey, your saved data, your browser storage, personal information, and the part of the address that shows which passage you're reading are **never** transmitted. A report contains only the error type and message (with any passage, variation, or ending identifier replaced by a placeholder), a stack trace, the app's release version, coarse environment facts (like your browser and operating system), the site address without the passage fragment, and a short trail of interface events that records only that an interaction happened (for example, "a click"), never which control or passage it was. Like any web request, a report reaches Sentry from your IP address; the app does not add your IP address or any identity to the report (`sendDefaultPii: false`). Reporting covers crashes only: it does not track sessions, page views, or which passages you open, and it sends no usage statistics. You can preview a representative report under the same setting ("See exactly what a report would contain") before opting in. You can turn it off at any time; from that moment nothing more is sent, including anything waiting to be sent. A report already sent before you turned it off cannot be recalled. See [`docs/OBSERVABILITY.md`](OBSERVABILITY.md) for the full detail of what is and isn't captured.

## Deleting your data

Because everything is local, you are always in control:

- **Reset within the app** — use "New journey" / reset in the progress panel to clear your reading progress (an export-first option is offered). This removes the saved journey and visit-event log from your device.
- **Clear site data in your browser** — clearing this site's storage (or using private/incognito browsing) removes everything the app stored, including preferences.

## Children's privacy

The app collects no personal information from anyone, including children. It transmits no reading data, and the opt-in crash reports are redacted to exclude personal information.

## Changes to this policy

If the app's data behavior changes (for example, if a new kind of request is added or crash-report contents change), this policy will be updated and the "Last updated" date above will change. The policy is versioned in the project's public repository, so its history is auditable.

## Contact

Questions or concerns about privacy can be raised on the project's public issue tracker: <https://github.com/zekusmaximus/Narramorph/issues>. The project maintainer is responsible for this application's data practices.
