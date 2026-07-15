# Phase 3 explanation coverage audit

This Batch 3.4 record reviews the complete reader-facing explanation catalog and verifies it against the shipped Eternal Return runtime. The review is finite and closed: selection can emit only the ten `SelectionReason` templates below, while Story Package 1.1 can serialize only the ten condition categories listed here.

## Reviewed condition-category language

These phrases are deliberately category-level. They never interpolate passage IDs, operands, comparison values, raw evidence, future passages, or unmatched alternatives.

| Story Package 1.1 category | Reviewed reader template |
| --- | --- |
| `historyStartsWith` | This version reflects how your journey began. |
| `historyEndsWith` | This version reflects the passages you encountered most recently. |
| `orderSeen` | This version reflects the order in which you encountered earlier passages. |
| `visitedImmediatelyAfter` | This version reflects the passage you arrived from. |
| `withinSteps` | This version reflects a passage you encountered recently. |
| `visitCount` | This version reflects how often you have returned to an earlier passage. |
| `visitedCountAcross` | This version reflects how often you have revisited this part of the story. |
| `all` | This version reflects a combination of choices and encounters in your journey. |
| `any` | This version reflects one of several patterns in the journey you have already taken. |
| `not` | This version reflects a path your journey has not taken. |

The typed `CONDITION_CATEGORY_EXPLANATIONS` record makes omission a compile-time error. A schema-parity test also compares its keys to an explicit Story Package 1.1 category inventory and rejects raw condition field names or internal IDs in every phrase.

## Runtime coverage

| Adaptive surface | Audited inventory | Result |
| --- | --- | --- |
| L1/L2 variations | All 12 groups and all 741 authored variations | Every compiled closed-template explanation is nonempty, reader-safe, and free of ending-title spoilers. Each group also proves legacy and reason-aware selection return the same variation before and after rendering. |
| L3 assembly | 45 Archaeologist, 45 Algorithm, 45 Last Human, and 135 Convergence variations | All 270 source variations compile safely. The full 5 journey × 3 philosophy × 3 awareness × 3 synthesis matrix produces deterministic assemblies and audits every selected section reason. |
| L3 fallback criteria | Exact synthesis, exact context, journey + philosophy, journey-only, philosophy-only, deterministic-any | The actual tier is now carried into each section. Relaxed explanations replace unmatched dimensions with neutral language; deterministic-any uses the safe fallback template. Selection order and selected content are unchanged. |
| L4 endings | Preserve, Transform, Release | Each ending compiles as a fixed choice using only its reader-facing title. Alternate ending titles are forbidden during that audit. |
| Selection template catalog | All 10 `SelectionReasonTemplateKey` values | Required parameters, selection kind, outcome, and visit semantics are checked for contradictions. |

Two legacy ending files contain an editorial specification inside their `content` string before a `---` delimiter. The loader now excludes only a recognized `variationId:` preamble from reader rendering and ledger excerpts. The source JSON, canonical prose, Story Package, literary release, and content hashes remain unchanged.

## Automated rejection rules

`auditSelectionReason` and `auditSelectionRecord` fail on:

- missing or empty rendered explanations and required template parameters;
- internal passage/variation identifiers in reader-visible fields;
- raw JSON, condition names, evidence fields, and fallback diagnostics;
- contradictions between template, selection kind, outcome, and visit count;
- story-specific forbidden future terms supplied to the audit.

Determinism and influence are behavioral tests rather than text heuristics. Every L1/L2 group compares the compatibility selector with the reason-aware selector, renders and audits the reason, then selects again and requires the same variation and tier. The complete L3 context matrix selects twice and requires structurally identical results.

## Browser and persistence proof

Three production-build Chromium journeys navigate the real map without seeded progress:

| Dominant philosophy | Ending | Required proof |
| --- | --- | --- |
| Acceptance | Preserve the Pattern | L3 wording says acceptance; ending reason names only the chosen ending. |
| Investigation | Transform the Pattern | L3 wording says investigation; ending reason and ledger excerpt contain no editorial metadata. |
| Resistance | Release the Pattern | L3 wording says resistance; ending reason and ledger excerpt contain no editorial metadata. |

Each journey visits six distinct L2 passages, revisits the target philosophy to make it dominant, reaches two meta-aware perspectives, completes all four L3 sections, and records four separate L3 ledger snapshots. After the ending closes, the test reloads the app and requires every saved explanation string to remain byte-for-byte identical.

Older saves remain compatible through the existing `1.1.0` → `1.2.0` migration, which creates an empty ledger instead of inventing historical reasons. Disclosure is optional native `details`; leaving it closed has no effect on selection, unlocks, progression, or persistence.
