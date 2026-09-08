# B1141 Dynamic Evidence Injection (DEI)

Reusable GEDL Dynamic Evidence Injection v1 engine for B1141.

Core behaviour:

`initial five-point response -> common new information -> same five-point response -> linked class transition view`

The API withholds configured information until the first response is committed; the revised response is unavailable until the review step is completed. Session-scoped SHA-256 participant hashes preserve anonymous linked pre/post traces without persisting raw browser tokens. The engine derives a 5x5 transition matrix and starting-position subgroup summaries.

## Accepted Stage 3 baseline

- branch: `stage3-dei-integrated-acceptance`
- head: `34c6af87c0272fefbfb996970195728eec92f6b6`
- PR #1: deliberately unmerged at Stage 3 closure
- production storage: PostgreSQL

Stage 3 acceptance used a fresh PostgreSQL 16 service and exercised the Student, Lecturer and Presentation lifecycle.

## Mechanism-neutral public routing correction

Stage 4 review identified that the original public learner route exposed internal action vocabulary and canonical database IDs. The correction branch `stage3-dei-public-alias-routing-fix` provides clean learner paths while retaining internal operational routes.

Public learner aliases:

- `/dei01`
- `/dei02`

Internal lecturer/presentation routes remain available for orchestration and are not presented as learner URLs.

## B1141 Stage 4 configuration

The complete B1141 DEI repertoire contains exactly two canonical instances:

| Alias | Week | Title | Internal ID |
|---|---:|---|---|
| `dei01` | 2 | Who Dopes? | `b1141-w2-who-dopes-dei` |
| `dei02` | 8 | A Club Responds | `b1141-w8-disclosure-sequence-dei` |

Both are configured `active = false`. Stage 4 does not activate or deploy teaching activities.

The guarded configuration migration is:

`backend/migrations/002_dei_stage4_b1141_configuration.sql`

Detailed Stage 4 decisions are recorded in:

`docs/STAGE4_CONFIGURATION.md`

## Stage 5 boundary

Deployment/cutover, final host/domain, production secrets, activity activation, live three-surface route checks, reset/session rehearsal, final delivery method and authentic classroom testing remain Stage 5 responsibilities.
