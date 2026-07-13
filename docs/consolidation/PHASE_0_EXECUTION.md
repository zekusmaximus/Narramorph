# Phase 0 execution record

Updated: July 13, 2026

## Status

| Batch | Status | Completion evidence / blocker |
|---|---|---|
| 0.1 | In progress | Charter, ADR, freeze notices, and the authoritative Narramorph backlog are implemented on coordinated branches; PR review and merge remain. |
| 0.2 | Blocked on owner decisions while implementation proceeds | Software/content licensing choice and confirmation of external MongoDB credential revocation are required. |
| 0.3 | In progress | Baseline tags, verified records, extraction matrix, and issue disposition are implemented; PR review and merge remain. |

## Immutable baseline tags

The annotated tag `pre-consolidation-2026-07-13` has been published to:

- `zekusmaximus/Narramorph`
- `zekusmaximus/Project-Leibniz`
- `zekusmaximus/eternal-return-digital-self`
- `zekusmaximus/Eternal_Return_Manuscript`

## Implementation branches

| Repository | Branch | Draft PR |
|---|---|---|
| Narramorph | `agent/consolidation-batches-0-1-to-0-3` | [#97](https://github.com/zekusmaximus/Narramorph/pull/97) |
| Project-Leibniz | `agent/consolidation-freeze-and-baseline` | [#11](https://github.com/zekusmaximus/Project-Leibniz/pull/11) |
| eternal-return-digital-self | `agent/consolidation-freeze-and-baseline` | [#6](https://github.com/zekusmaximus/eternal-return-digital-self/pull/6) |
| Eternal_Return_Manuscript | `agent/consolidation-governance-and-baseline` | [#41](https://github.com/zekusmaximus/Eternal_Return_Manuscript/pull/41) |

## Owner decisions

1. Proposed licensing split: MIT for software code in Narramorph, Project-Leibniz, and the older prototype; all rights reserved for story/narrative content in Narramorph and the Manuscript repository, with a narrow explicit permission for approved manuscript-derived material to ship in Narramorph.
2. Confirm whether the historical Project-Leibniz MongoDB credential has been rotated or revoked. Repository inspection can confirm that no `.env` file is currently tracked, but cannot verify external Atlas state.

## Issue audit

The connected GitHub issue search returned no open issues in any repository on July 13, 2026. No legacy issue needs migration. Phase 0 tracking issues are created in Narramorph and become the authoritative backlog.

## Authoritative backlog

- [Product consolidation milestone](https://github.com/zekusmaximus/Narramorph/milestone/1)
- [#93 — Epic: consolidate the Eternal Return repositories into one shippable product](https://github.com/zekusmaximus/Narramorph/issues/93)
- [#94 — Batch 0.1: approve the product charter and repository roles](https://github.com/zekusmaximus/Narramorph/issues/94)
- [#95 — Batch 0.2: resolve licensing, provenance, and credential remediation](https://github.com/zekusmaximus/Narramorph/issues/95)
- [#96 — Batch 0.3: preserve baselines and approve the extraction inventory](https://github.com/zekusmaximus/Narramorph/issues/96)

Issue #95 carries the `blocked-owner` label until the license/copyright decision and external credential-revocation confirmation are recorded.

## Merge order

1. Merge Narramorph [PR #97](https://github.com/zekusmaximus/Narramorph/pull/97) after charter and license approval.
2. Merge Manuscript [PR #41](https://github.com/zekusmaximus/Eternal_Return_Manuscript/pull/41).
3. Merge Project-Leibniz [PR #11](https://github.com/zekusmaximus/Project-Leibniz/pull/11).
4. Merge older-prototype [PR #6](https://github.com/zekusmaximus/eternal-return-digital-self/pull/6).
5. Update this record with merged PR links and mark each batch complete only after its acceptance gate is satisfied.
