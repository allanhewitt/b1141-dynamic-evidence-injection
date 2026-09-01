# DEI Stage 3 Acceptance Record

## Contract

DEI v1 implements a five-point initial commitment, 1–3 common simultaneously released information objects, the same five-point response again, and a linked transition view. No adaptive anti-position challenge, sequential release, intermediate judgement, or generic page-builder behaviour is included.

## 3A — Technical architecture — COMPLETE

PostgreSQL activities, session snapshots, one-open-session constraint, linked response traces, session-scoped hashed participant identity, lecturer mutation key, inactive validation fixtures.

## 3B — Behaviour engine — COMPLETE

Backend-enforced information withholding; immutable initial and revised commitments; explicit review progression; 5x5 transition matrix; descriptive movement; starting-position subgroup analysis; both B1141 validation instances run through one engine.

## 3C — Experience system — COMPLETE

Student: What do you think? -> Review the following information -> What do you think now? -> Class overview.

Lecturer: participation/progression monitoring, presentation launch, session close.

Presentation: low-density prompt and completed-pair transition summary.

## 3D — Visual system — COMPLETE

Before -> anonymous movement -> after. Direction remains neutral; starting-group filtering recalculates subgroup movement percentages.

## 3E — Integrated acceptance — COMPLETE

Hosted push run `33530827653` passed on implementation head `e38a831fb99ae64faaeac3ba6ad10145486b88fc`.

The run included:
- syntax checks;
- embedded-SQL domain/store/full-HTTP tests;
- `npm audit --omit=dev`;
- fresh PostgreSQL 16 service;
- real Stage 3 migration execution;
- verification that both B1141 validation activities remained inactive after migration;
- activation only inside the acceptance process;
- full PostgreSQL-backed Student/Lecturer/Presentation HTTP lifecycle across both representative instances.

Pull request #1 (`DEI Stage 3 integrated engine acceptance`) is deliberately left open and unmerged. The documentation-only closure commit following this record must also pass CI; its final head becomes the accepted Stage 3 source baseline.

## Boundary after acceptance

Stage 3 acceptance does not activate a live teaching deployment. `main` remains untouched apart from the neutral repository bootstrap commit. Stage 4 covers instance configuration; Stage 5 covers deliberate merge/cutover, runtime configuration, operational links and authentic teaching-context testing.
