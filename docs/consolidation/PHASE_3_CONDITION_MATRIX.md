# Phase 3 condition and journey-state matrix

This is the Batch 3.1 semantic gap analysis between frozen Project-Leibniz at `4f3f4600b8782aac5000b45dd64378baf318e1df` and Narramorph's Phase 2 protected-main baseline at `f9499a82d6d018093d6448fbbfba6ef234c1c401`.

## Condition disposition

| Project-Leibniz condition | Narramorph source fact | Disposition | Phase 3 implementation |
| --- | --- | --- | --- |
| `historyStartsWith` | `readingPath`; `journeyTracking.startingCharacter` | Extend | Pure prefix predicate over passage history; reader template “because you began with …” |
| `historyEndsWith` | `readingPath` | Extend | Pure suffix predicate over the visit sequence |
| `orderSeen` | `readingPath` | Extend | Pure ordered-subsequence predicate; gaps remain allowed |
| `visitedImmediatelyAfter` | `readingPath` | Extend | Pure adjacency predicate over neighboring visits |
| `withinNSteps` | `readingPath` | Extend | Pure inclusive recency predicate with validated nonnegative step count |
| `visited` / visit comparison | `visitedNodes[nodeId].visitCount` | Existing, normalize | Typed numeric comparison; supports first visit and revisit explanations |
| `notVisited` | visit count | Existing through composition | `not(visitCount >= 1)`; future/locked facts never render to readers |
| `visitedCountAcross` | `visitedNodes` | Extend | Pure sum comparison for an explicit passage set |
| `flag` | awareness, philosophy, L3 views/completion, unlock records | Deliberate rejection of generic form | Use named typed facts only; add a reviewed fact kind when product behavior requires one |
| `and` | implicit metadata conjunction | Extend serialization | Ordered `all` expression; evaluate every child for stable evidence |
| `or` | deterministic fallback pools | Extend serialization | Ordered `any` expression; first matching branch supplies reader evidence |
| `not` | no normalized form | Extend | Pure negation; reader language comes from an approved positive template |

Malformed expressions fail closed and report author/debug diagnostics. Empty `all` and `any`, negative recency, missing passage references, and unknown fact kinds are invalid package data rather than runtime guesses.

## State-history comparison

| Journey information | Project-Leibniz | Narramorph authority | Phase 3 rule |
| --- | --- | --- | --- |
| Visit order | `history` node IDs | `UserProgress.readingPath` with node, character, layer, philosophy, timestamp | Keep Narramorph record; derive condition history from it |
| Per-node visits | `visitCounts` | `visitedNodes` with count, timing, transformation, selected variation history | Keep Narramorph record |
| Selected variation | Current rule match; ledger recomputes later | Current `variationId` plus recent IDs | Append immutable per-selection record at decision time |
| Reader awareness | Generic flags if authored | `temporalAwareness` and awareness level | Use typed awareness facts and templates |
| Perspective path | Node-name inference | character counts, switches, starting/dominant character, journey pattern | Use computed Narramorph journey facts |
| Philosophy | Generic flags/rules | philosophy counts and dominant philosophy | Use typed philosophy fact |
| L3 | Ordinary rule-driven nodes | assembly context, selected section IDs, views and completion | Emit one reason per selected assembly section and persist it |
| L4 | Ending rule match | explicit ending choice plus unlock state and final-node visit | Explain the selected ending only; never disclose locked alternatives |
| Ledger | Recomputed from current final state | None at baseline | Render persisted selection records in sequence order |

## SelectionReason normalization

The machine contract is defined by ADR 0003. The initial reader template catalog covers:

| Template key | Safe reader meaning | Representative evidence |
| --- | --- | --- |
| `selection.first_visit` | This is the first encounter | visit count |
| `selection.return_visit` | The passage changed after a return | visit count and optional prior passage title |
| `selection.started_with` | The opening perspective influenced this version | starting character |
| `selection.journey_pattern` | The shape of perspective changes influenced it | journey-pattern label |
| `selection.philosophy` | Prior choices leaned toward a philosophy | dominant philosophy |
| `selection.awareness` | The journey has become more aware of repetition | awareness band |
| `selection.combined` | More than one safe past fact matched | ordered matched triggers |
| `selection.l3_assembly` | A convergence section reflects the journey so far | matched L3 tier and past facts |
| `selection.ending_choice` | This is the ending the reader chose after unlocking it | selected ending title only |
| `selection.fallback` | A stable version was chosen when no specific path rule matched | fallback tier, without internal diagnostics |

Passage titles and perspective/philosophy labels are resolved before rendering. Stable keys and opaque identifiers may remain in machine/debug evidence, but only whitelisted labels and numbers may enter `parameters` or persisted reader snapshots.

The finite reviewed language for every serialized condition category and its exhaustive runtime audit are recorded in the [Phase 3 explanation coverage audit](PHASE_3_EXPLANATION_AUDIT.md).

## Architecture boundary

`UserProgress` remains authoritative. `ConditionContext` is a pure projection and `selectionRecords` is an append-only historical output. Neither can mutate the other. Project-Leibniz's server, Mongo storage, Context/reducer, mutable singleton service, visual design, and final-state ledger algorithm are not imported.
