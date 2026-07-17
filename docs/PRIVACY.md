# Privacy policy

Last updated: July 17, 2026 · Applies to: Narramorph (the _Eternal Return of the Digital Self_ interactive edition), v1.

## Summary

**Your reading stays on your device.** Narramorph is a static, client-side application with no backend (see [ADR 0006](adr/0006-v1-client-only-no-backend.md)). It does not have accounts, it does not sync, and it **does not send your reading history, your progress, your saved journeys, or any personal information to us or to any third party.** Everything the app remembers is stored locally in your own browser.

## What is transmitted

**Nothing about your reading.** In this release the app makes **no network requests of its own** — no analytics, no tracking, no error reporting, no third-party fonts or scripts. After the initial download of the application's files from the hosting provider, the app runs entirely in your browser. (Fonts are served from the same site as the app; there is no request to Google Fonts or any other third party.)

The only network activity is:

- **Loading the app** — your browser downloads the application's files (HTML, JavaScript, CSS, fonts, story content) from the hosting provider (Cloudflare Pages), exactly as it would for any website. The host may keep standard server logs (such as IP addresses) as part of delivering the site; that is the host's processing, not the app's, and no reading data is included.
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

The app includes an **opt-in** crash-reporting option to help fix problems. It is **off by default** and sends **nothing** unless you turn it on in **Settings → "Send anonymous crash reports"** (and it is fully inactive unless the site has been configured with a monitoring service — if none is configured, no reports are ever sent regardless of the setting).

When you turn it on, a crash report is **redacted on your device before it is sent**, so that story prose, your reading history and journey, your saved data, your browser storage, personal information, and the part of the address that shows which passage you're reading are **never** transmitted. A report contains only the error type and message, a stack trace, and coarse environment facts (like your browser name). You can preview a representative report under the same setting ("See exactly what a report would contain") before opting in, and you can turn it off at any time. See [`docs/OBSERVABILITY.md`](OBSERVABILITY.md) for the full detail of what is and isn't captured.

## Deleting your data

Because everything is local, you are always in control:

- **Reset within the app** — use "New journey" / reset in the progress panel to clear your reading progress (an export-first option is offered). This removes the saved journey and visit-event log from your device.
- **Clear site data in your browser** — clearing this site's storage (or using private/incognito browsing) removes everything the app stored, including preferences.

## Children's privacy

The app collects no personal information from anyone, including children, because it transmits no data.

## Changes to this policy

If the app's data behavior changes (for example, if opt-in error reporting is enabled), this policy will be updated and the "Last updated" date above will change. The policy is versioned in the project's public repository, so its history is auditable.

## Contact

Questions or concerns about privacy can be raised on the project's public issue tracker: <https://github.com/zekusmaximus/Narramorph/issues>. The project maintainer is responsible for this application's data practices.
