# Backlog reconciliation and residual work

Owner roles: project maintainer and product/editorial owner. Priority: P2. Estimate: 0.5–1 engineering day plus owner decisions. Findings: R09/R11/R12.

## DOC-01 — Refresh the canonical status without erasing history

Use this dated review as evidence for an ordinary documentation PR. Keep `STATUS.md` as the current technical baseline, `ROADMAP.md` as current priorities, and `RELEASE_STATUS.md` as the readiness decision. Update the top-level README, browser policy, consolidation index, Phase 1/6/7/8 execution records, and tooling index where their claims conflict with verified code. Link this review as a dated assessment rather than maintaining a competing current roadmap.

Replace obsolete test counts, pre-lazy-loading bundle figures, zero-advisory claims, unimplemented telemetry claims, and “no production deployment” with dated evidence and explicit limits. Distinguish script presence from operational success: rollback currently prints a plan, monitoring privacy needs repair, and some owner-run tables remain empty. Keep alpha until the formal promotion rule passes. Archive superseded assessments according to the existing documentation policy; preserve narrative canon and decision records.

Acceptance: a reader can identify the supported target, current gate results, real remaining blockers, and next work from the canonical three documents without reconciling contradictory snapshots.

## DOC-02 — Disposition all 20 open product issues

The following is an execution proposal, not a claim that any issue has been closed. Add current acceptance evidence to an existing issue before closing it; split residual operational work into linked tasks only when that makes ownership clearer.

| Existing issue(s) | Observed state | Proposed next action |
| --- | --- | --- |
| #156 content release; #163 Track A | Package 1.3.0, accepted literary v1.0.2, CTR-010/012 repairs and intake are present | Attach current identities/validation and existing editorial acceptance; close when the owner confirms original acceptance criteria are satisfied. |
| #164 prototype audit; #166 visual tokens | Audit dispositions and theme implementation landed in Phase 6 / PR #170 | Attach extraction matrix and current reader evidence; close fulfilled implementation scope. |
| #165 onboarding | Introduction/help/decorative preview implemented; first-reader comprehension still needs evidence | Retain the formative usability task under QA-03; do not equate automated focus tests with comprehension. |
| #167 3D profiling/list | Semantic companion list and structural stop-early decision implemented | Retain genuine representative GPU/device baseline under PERF-03; no instancing port without a measured need. |
| #168 archive parity gate | Terminal extraction decisions recorded; conditions 5 and 7 still require owner confirmation | Confirm issue-disposition/visual acceptance against the seven-condition record. Separate this decision from release engineering. |
| #169 archive reference repository | Archive notice/checklist prepared; external admin action explicitly held | Keep held for the owner's separate instruction after #168. No other repository is modified by this review. |
| #171 canonical journey; #172 long passage; #173 explanations/export; #174 persistence | Phase 7 implementation and behavioral tests exist, including current Chromium paths | Attach acceptance mapping and current results; close implementation scope when verified, linking remaining platform/manual QA rather than pretending those results exist. |
| #175 manual accessibility | Automated coverage exists; manual result matrix absent | Execute QA-01–04 and amend accessibility claims; retain until results and decisions are recorded. |
| #177 backend decision | ADR 0006 and scope guard implement static/client-only/no-SW v1 | Attach decision and fresh scope result; close fulfilled decision work. Do not introduce a backend to complete this issue. |
| #178 security/privacy | Headers/import controls exist; live edge evidence and current risk/privacy claims need reconciliation | Link DEP/OBS and REL-04; close only after current scans and data-boundary results. |
| #179 monitoring | Lazy opt-in mechanism implemented; privacy/consent and real operational verification incomplete | Execute OBS-01–04; record monitoring choice, ownership, redaction and private stack evidence. |
| #180 deployment/rollback | Manifest/checksum/reproducibility/runbook present; artifact pipeline and real rollback unproved | Execute REL-01–04; attach deployment identities and save-safe A→B→A result. |
| #181 performance/resilience | Lazy boundaries, budgets and resilience tests present; sampling/raw metrics/device proof incomplete | Execute PERF-01–03; retain measured results and policy disposition. |
| #162 Phase 6 parent | Most extraction work complete; owner-gated archive/parity/device items remain | Keep parent until its children are dispositioned, or explicitly split archive work as an independent owner-held milestone. |
| #93 consolidation epic | Broad implementation is far beyond early status documents; GA approvals and ops still incomplete | Link the release-hardening tasks and retain through the agreed final product release gate. |

Ten open Dependabot PRs need the decisions in [DEPENDENCY_PLAN.md](DEPENDENCY_PLAN.md). Their presence and old green runs do not establish remediation of current advisories.

## DOC-03 — Address residual code/editorial debt proportionately

Two explicit runtime TODOs remain in `storyStore.ts`: `getNodeState.connected` is always false and `getConnectionState.highlighted` is always false. Trace consumers before scheduling work. If an active supported interaction relies on either value, add the smallest behavior fix and a reader-visible assertion; otherwise remove/document a dead helper in ordinary maintenance. They are not automatically release blockers merely because they contain TODO comments.

Current **CTR-004 (severity 3)** is manuscript documentation debt: a removed Movement 3 Phase D reference must be corrected by the manuscript owner, while Narramorph already applies Phase C onward. Keep the cross-repository dependency visible; no canonical prose changes belong in the infrastructure PRs. Review 6,116 canon warnings by category and keep the 31 current waivers' reasons/ownership valid. Do not generate thousands of unsolicited rewrites.

Legacy `tools` advertises absent inventory/insert entry points and obsolete local links. Apply DEP-04's supported/historical classification, remove broken promises, and ensure its remaining lockfile stays audited. Preserve useful history without claiming that a stub script is an operational pipeline.

## Delivery checklist

Each task ID in the other plans is issue-ready: name its responsibility role, dependencies, affected files, acceptance condition, evidence location, and estimate before assignment. Use the four waves in the review index. Implement coverage and compatible patches first; resolve major-migration scope before fixing a calendar release date. Stage only a verified candidate, then perform manual QA/rollback against those exact bytes.

When implementation finishes, reconcile the canonical roadmap again and archive this assessment if superseded. A plan's checkbox closes only with code, observed results, or the explicit owner decision it calls for.
