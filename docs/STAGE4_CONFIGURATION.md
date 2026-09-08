# DEI Stage 4 — B1141 Instance Configuration

Status: working Stage 4 configuration, 4 September 2026.

Accepted engine baseline: `stage3-dei-integrated-acceptance@34c6af87c0272fefbfb996970195728eec92f6b6`.

Stage 4 does not activate or deploy teaching instances. All canonical rows remain inactive until Stage 5.

## Canonical B1141 instances

| Alias | Week | Learner title | Internal ID | Information form | State |
|---|---:|---|---|---|---|
| `dei01` | 2 | Who Dopes? | `b1141-w2-who-dopes-dei` | two common documentary/systemic information objects | inactive |
| `dei02` | 8 | A Club Responds | `b1141-w8-disclosure-sequence-dei` | one fictional later-event information object | inactive |

The canonical B1141 Stage 2 architecture contains exactly two DEI instances. Earlier documents that described the disclosure stress-test as Week 9 are qualified by the current teaching placement: the activity occurs in Week 8.

## Academic configuration decisions

Both instances retain the accepted DEI v1 event:

`same five-point statement -> common new information -> same five-point statement -> linked class transition view`

Final learner language deliberately avoids suggesting that movement is expected. The results heading is `What changed — if anything?`, and the review instructions say only that the learner will respond to the same statement again.

`A Club Responds` is the learner-facing title for the activity previously referred to internally as `The Disclosure Sequence`. The latter remains useful as an internal development shorthand but is not required in the learner interface.

The Week 8 setup is included in the repeated statement because the accepted DEI v1 engine has no separate learner-visible entry/context object. No new engine state or response type has been introduced at Stage 4.

## Mechanism-neutral public aliases

Stage 4 review found that the original Stage 3 learner route exposed `/#/respond/<canonical-id>`. A reusable routing correction therefore provides:

- `/dei01`
- `/dei02`

The canonical database IDs remain internal. Lecturer and Presentation routes remain operational/internal surfaces and are unchanged by this correction.

## Configuration migration

`backend/migrations/002_dei_stage4_b1141_configuration.sql`

The migration:

- inserts/updates exactly the two canonical B1141 rows;
- refuses to operate if either canonical row is active;
- refuses to repurpose an active earlier Week 9 Stage 3 validation row;
- retains an inactive historical validation row if one exists;
- verifies that exactly two canonical rows exist and both remain inactive.

CI exercises both a clean PostgreSQL schema and an upgrade-style path with the old inactive validation row present before Stage 4 configuration.

## Lecture placement

Stage 4 placement is fixed at the existing intellectual locations:

- Week 2: replace the obsolete `Activity: who dopes?` slide with `<!-- DEI01 HERE -->`.
- Week 8: replace the obsolete `Activity: the disclosure sequence` slide with `<!-- DEI02 HERE -->`.

The application owns the final learner-facing task wording. Stage 5 will decide how these markers are operationalised for student access.

## Stage 5 boundary

Still deferred:

- deployment/cutover;
- final public host/domain;
- production environment/secrets;
- activity activation;
- live Student/Lecturer/Presentation route testing;
- session/reset rehearsal;
- final delivery mechanism and classroom testing.
