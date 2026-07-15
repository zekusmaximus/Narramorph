# ADR 0003: Adaptive selection conditions and explanations

- Status: Accepted
- Date: July 15, 2026
- Decision owners: repository owner and product consolidation program
- Phase: 3, Batch 3.1

## Context

Project-Leibniz demonstrated two useful product ideas: path-order predicates can shape a selection, and a reader can be told why an adaptive version appeared. Its implementation also owns a separate React Context state tree, a mutable singleton rule service, and a ledger recomputed from current state. Those architectural choices conflict with Narramorph's authoritative Zustand store and pure domain boundaries, and recomputation cannot accurately explain a selection after the journey changes.

Narramorph already records the source facts needed for most adaptive decisions: `readingPath`, per-node visit records, selected-variation history, awareness, character counts and switches, philosophy choices, L3 completion, unlocks, and L4 visits. Its variation evaluator is deterministic, but it currently returns only the selected variation and discards the matching tier and evidence.

## Decision

### One journey state

Narramorph's `UserProgress` remains the only authoritative journey state. Condition evaluation receives an explicit immutable context derived from it. No React Context journey model, backend, mutable rule registry, or singleton cache is imported from Project-Leibniz.

An append-only `selectionRecords` collection is added to `UserProgress`. It is evidence of decisions already made, not a second state model: it never drives awareness, unlocks, or future selection. A record is written at selection time and retains its original reader-safe reason after reload instead of reevaluating against later state.

### Condition semantics

The existing Story Package condition record remains the serialization envelope. Schema 1.1 adds a normalized expression value for the missing path predicates and boolean composition. Evaluators are pure functions over explicit `ConditionContext` input. Existing metadata predicates remain supported without conversion.

Generic arbitrary flags are deliberately rejected. Narramorph represents product state as named, typed facts such as awareness, philosophy, L3 completion, and ending unlocks; an untyped flag bag would create hidden state and weaken validation. A future named fact must be added deliberately to the condition contract.

### SelectionReason contract

Every adaptive selector may emit a `SelectionReason` using this versioned contract:

```ts
interface SelectionReason {
  contract: 'org.narramorph.selection-reason';
  schemaVersion: '1.0.0';
  selectionKind: 'passage-variation' | 'l3-section' | 'ending';
  outcome: 'exact' | 'relaxed' | 'fallback' | 'fixed';
  templateKey: SelectionReasonTemplateKey;
  parameters: Record<string, string | number>;
  triggers: SelectionTrigger[];
}
```

`triggers` preserve machine-readable matched facts and fallback evidence. `templateKey` and `parameters` are the sole reader-language input. Rendering uses a closed template catalog so raw node IDs, variation IDs, JSON predicates, locked outcomes, and future conditions cannot leak into the reader surface. Debug diagnostics remain a separate developer-only representation.

Stable English templates ship first, with parameterized keys rather than prose stored in the selector. This creates a localization seam without introducing an unrelated localization framework during Phase 3.

### Determinism and identity

Condition evaluation may report evidence but must not change selection priority, deduplication, or fallback order. The selected identifier is tested both before and after reason generation.

Story Package schema `1.1.0` is a backward-compatible contract extension. The interactive _Eternal Return_ package becomes story version `1.1.0` because its contract metadata and content hash change. The accepted literary release ID, source manuscript commit, authored runtime prose, and every prose digest remain unchanged. Save schema `1.2.0` adds persisted selection records and explicitly migrates `1.1.0` saves with an empty ledger.

## Consequences

- Reader explanations describe the historical selection rather than current-state speculation.
- Whole-passage variation, L3 assembly, and L4 ending selection share one reason contract without sharing separate state engines.
- Existing packages remain parseable through explicit schema compatibility; existing saves migrate without losing reading progress.
- The Phase 4 export log can reuse selection evidence, but exact prose snapshots and export behavior remain out of Phase 3 scope.

## Rejected alternatives

- Import Project-Leibniz's React Context/reducer or singleton `StoryLogicService`.
- Recompute the adaptation ledger from final journey state.
- Display `describeCondition` output or internal identifiers to readers.
- Add an arbitrary flag dictionary to Narramorph's progress model.
- Change manuscript or authored runtime prose to make explanations easier.

## Verification

The decision is implemented when the semantic matrix accounts for every Leibniz predicate; pure evaluator and composition tests pass; selected IDs are invariant under reason generation; old saves migrate; reasons persist after reload; and accessible reader disclosure plus the progress ledger cover L1/L2, L3, and L4 journeys.

## Related records

- [ADR 0001: repository boundaries](0001-repository-boundaries.md)
- [ADR 0002: content authority and edition semantics](0002-content-authority-and-edition-semantics.md)
- [Phase 3 condition matrix](../consolidation/PHASE_3_CONDITION_MATRIX.md)
- [Phase 3 execution record](../consolidation/PHASE_3_EXECUTION.md)
