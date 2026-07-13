# ADR 0001: Consolidation repository boundaries

- Status: Accepted
- Date: July 13, 2026
- Decision owners: repository owner and product consolidation program

## Context

Four repositories developed related versions of *Eternal Return of the Digital Self*:

- Narramorph contains the most complete application, runtime content, validation, accessibility behavior, and browser coverage.
- Project-Leibniz concentrates order-dependent prose, explanation, compositional beat, edge-prose, and journey-export experiments.
- eternal-return-digital-self is an older visual/onboarding and 3D prototype with incomplete product behavior.
- Eternal_Return_Manuscript is an approximately 85,000-word canonical novel and editorial system rather than an application.

Keeping all four active would create competing application architectures, duplicated prose authority, ambiguous ownership, and four backlogs. Combining their Git histories into a monorepo would preserve those conflicts rather than resolve them.

## Decision

1. Narramorph is the only deployable application and the authoritative integration target.
2. Eternal_Return_Manuscript remains a separate active repository and the canonical long-form literary/editorial source.
3. The application and manuscript exchange only approved, versioned artifacts with provenance and compatibility metadata. Neither build reads the other's default branch.
4. Project-Leibniz and eternal-return-digital-self enter feature freeze. They accept only security, provenance, extraction-support, and archival-preparation changes.
5. Project-Leibniz is archived after the Phase 4 parity/rejection gate.
6. eternal-return-digital-self is archived after the Phase 6 parity/rejection gate.
7. V1 remains a static, client-side product with local persistence. A backend requires a future ADR and is not inherited from Project-Leibniz.

## Consequences

### Positive

- Engineering effort converges on the strongest product foundation.
- Literary authority and software delivery remain independently maintainable.
- Reference implementations retain historical value without remaining supported products.
- Archive timing is based on evidence rather than sentiment.

### Costs

- Cross-repository content releases require an explicit contract and coordinated PRs.
- Useful reference behavior must be reimplemented in Narramorph's architecture rather than copied wholesale.
- Some apparent duplication remains until archive gates are reached.

### Risks and mitigations

- **Risk:** manuscript and interactive content drift. **Mitigation:** versioned release metadata and a complete concordance.
- **Risk:** useful reference behavior is lost. **Mitigation:** extraction matrix, behavior tests, final tags, and archive notices.
- **Risk:** licensing differs between code and prose. **Mitigation:** separate code/content licenses and per-artifact provenance before transfer.
- **Risk:** archived repositories continue to look supported. **Mitigation:** README notices, migrated issues, disabled deployments/secrets, and GitHub's archive toggle.

## Rejected alternatives

- Merge all histories into one monorepo.
- Rewrite Narramorph around Project-Leibniz's state/backend architecture.
- Treat the manuscript repository as another application package.
- Leave all repositories active indefinitely.

## Verification

The decision is implemented when the charter exists, one authoritative backlog lives in Narramorph, reference READMEs show feature-freeze notices, pre-consolidation tags exist, and the extraction matrix accounts for reference capabilities.
