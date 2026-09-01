# B1141 Dynamic Evidence Injection — Stage 3 Engine

Greenfield implementation of the GEDL Dynamic Evidence Injection (DEI) v1 model.

Core behaviour: `initial five-point response -> common new information -> same five-point response -> linked class transition view`.

Learner-facing surfaces deliberately hide internal mechanism vocabulary. Routes are `/#/respond/:activityId`, `/#/control/:activityId`, and `/#/display/:activityId`.

The API withholds configured information objects until the first response is committed; the revised response is unavailable until the review step is completed. Session-scoped SHA-256 participant hashes preserve anonymous linked pre/post traces without persisting raw browser tokens. The engine derives a 5x5 transition matrix and starting-position subgroup summaries.

Production storage is PostgreSQL (`backend/migrations/001_dei_stage3_architecture.sql`, `backend/storage/postgres-store.mjs`). The two B1141 validation activities are inactive by default so Stage 3 acceptance cannot silently become Stage 4 configuration.

The branch `stage3-dei-integrated-acceptance` is the Stage 3 acceptance line. `main` remains a bootstrap-only deployment boundary until a later deliberate cutover.
