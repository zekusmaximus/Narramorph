# Local visit-history privacy

Phase 4.3 adds an export-grade visit-event log so a reader can export the exact journey they experienced (ADR 0004). This note documents what that log stores, where it lives, and how a reader controls it. A full production privacy policy is Batch 8.2; this note covers only the local visit history introduced in Phase 4.

## What is stored

The application persists a `visitEvents` log inside the same browser `localStorage` save as the rest of a reader's progress. Each event is an immutable snapshot of one experienced passage and contains:

- a sequence number, the internal passage/node ID, the story-package identity, and the visit number;
- the selected variation and prose-beat IDs, and the edge-bridge ID, if any;
- the **resolved prose the reader saw**, plus its SHA-256 integrity hash and byte length;
- the selection reason and rendered explanation, and any explicit reader choice (such as the ending reached);
- a timestamp copied from the persisted visit (never a fresh clock read).

The log holds the same prose the reader was already shown; it introduces no new personal data.

## Where it lives

- The log is stored **only on the reader's device**, in `localStorage`, alongside existing progress.
- It is never transmitted. No network request carries visit history. Export is a local, user-initiated download (Batch 4.4); nothing is uploaded.

## Bounds

To keep local storage bounded, the log is capped (`VISIT_EVENT_LOG_LIMITS`): at most 1,000 events and about 2 MB of resolved prose. A complete L1→L4 journey produces on the order of tens of events, so these caps engage only under pathological revisiting. When a cap is reached the oldest events are dropped; their snapshots can no longer be exported, and the export surfaces that gap rather than reconstructing text against later content.

## Reader control

- Resetting progress clears the visit-event log with the rest of the save.
- Saves written before 1.3.0 migrate with an empty log; their earlier visits have no snapshots, and export labels them as not exactly reproducible instead of inventing prose.

## Related records

- [ADR 0004: journey visit-event log](adr/0004-journey-visit-event-log.md)
- [Provenance policy](PROVENANCE.md)
- [Phase 4 execution record](consolidation/PHASE_4_EXECUTION.md)
