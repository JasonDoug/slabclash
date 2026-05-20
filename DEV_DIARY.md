# Dev Diary — Slabclash MVP

## Prompt 06 — Deterministic Rating Engine & Configuration (2026-04-29)

### Summary
Implemented a deterministic rating engine that computes a power score (0-1000) based on weighted factors and versioned configurations.

### Changes Made

#### Prisma Schema (`backend/prisma/schema.prisma`)
- Added `RatingConfig` model with fields: id, version, isActive, weights, normalizationBounds.
- Updated `Card` model to include `playerStats`, `marketValueCents`, and `ratingConfigVersion`.

#### New Files Created
- `backend/src/rating/dto/calc-rating.dto.ts` — DTO for rating calculation requests.
- `backend/src/rating/dto/calc-rating-response.dto.ts` — DTO for rating calculation responses.
- `backend/src/rating/rating.controller.ts` — POST /v1/rating/calc endpoint for manual/preview calculations.

#### Modified Files
- `backend/src/rating/rating.service.ts` — Implemented core `calculate()` logic using `RatingConfig`.
- `backend/src/rating/rating.service.spec.ts` — Added tests for deterministic results and fallback logic.
- `backend/src/ingestion/ingestion.service.ts` — Integrated `RatingService.calculate()` into the `confirmScanJob` flow.

### Key Implementation Details

#### Rating Factors
The engine uses five factors:
1. `playerStats` (Weight: 40%)
2. `marketValueCents` (Weight: 20%)
3. `rarity` (Weight: 20%)
4. `conditionEstimatedScore` (Weight: 10%)
5. `momentum` (Weight: 10%)

#### Normalization
Each factor is normalized to a 0.0 - 1.0 range using `min` and `max` bounds defined in the `RatingConfig`. The final power score is the weighted sum multiplied by 1000.

#### Fallback Logic
- If `marketValueCents` is missing, it defaults to the midpoint of the normalization bounds.
- If `conditionEstimatedScore` is missing, it defaults to the midpoint.
- If `momentum` is missing, it defaults to 0.

### Tests
- Added tests in `rating.service.spec.ts` to verify:
  - Deterministic results for identical inputs.
  - Correct fallback behavior for missing data.
  - Handling of zero momentum.

### Next Steps
- Prompt 07: Collection Management (List/Filter Cards)
- Prompt 08: Lineup Creation and Validation

## Prompt 07 — Collection Management (2026-05-01)

### Summary
Implemented CRUD endpoints for user card collections, including filtering and pagination.

### Changes Made
- `backend/src/card/card.controller.ts` — Added GET /v1/users/:userId/cards and GET /v1/cards/:cardId.
- `backend/src/card/card.service.ts` — Implemented list and detail logic with ownership checks.

## Prompt 08 — Lineup Creation & Validation (2026-05-02)

### Summary
Implemented lineup management allowing users to create 9-position rosters from their collected cards.

### Changes Made
- `backend/src/lineup/lineup.controller.ts` — Added CRUD for lineups.
- `backend/src/lineup/lineup.service.ts` — Added validation for card ownership and aggregate power score calculation.

## Prompt 09 — Matchmaking Queue (2026-05-03)

### Summary
Implemented a Redis-backed matchmaking system that buckets players by power score.

### Changes Made
- `backend/src/redis/redis.service.ts` — Created Redis wrapper.
- `backend/src/matchmaking/matchmaking.service.ts` — Implemented enqueue/status logic and background worker.

## Prompt 10 — Match Engine (2026-05-04)

### Summary
Implemented a deterministic match resolution engine that compares lineups position-by-position.

### Changes Made
- `backend/src/match-engine/match-engine.service.ts` — Core resolution logic with tiebreakers and seeded RNG.
- `backend/test/match-engine/match-engine.e2e-spec.ts` — Comprehensive e2e tests for match resolution.

## Prompt 11 — Realtime Notifications (2026-05-05)

### Summary
Implemented a Server-Sent Events (SSE) notification system to inform users of matchmaking results.

### Changes Made
- `backend/src/realtime/realtime.controller.ts` — Added /v1/notifications/stream endpoint.
- `backend/src/realtime/in-memory-realtime.service.ts` — Implemented in-memory event publishing and subscription.

### Next Steps
- Prompt 12: Mobile (React Native) minimal flows: Camera, Upload, and Match UI.
- Prompt 13: Admin Endpoints: Ingestion Queue & Rating Config

## Prompt 13 — Admin Endpoints (2026-05-07)

### Summary
Implemented Admin-only endpoints for managing the card ingestion queue and rating engine configurations. Added RBAC with an Admin role.

### Changes Made
- `backend/prisma/schema.prisma` — Added `UserRole` enum and `role` field to `User`.
- `backend/src/auth/admin.guard.ts` — Created RBAC guard for Admin access.
- `backend/src/admin/` — Created new module with controllers for ingestion queue and rating configs.
- `backend/src/admin/admin-rating.controller.ts` — Implemented config activation that enqueues batch recalculations.
- `backend/test/admin.e2e-spec.ts` — Added E2E tests for Admin RBAC and functionality.

### Next Steps
- Prompt 14: Anti-fraud: Duplication and Phash checks
- Prompt 15: Batch Jobs: Rating Recalculation Worker

## Prompt 14 — Anti-fraud: pHash Detection (2026-05-16)

### Summary
Implemented image-similarity detection via pHash to prevent duplicate card uploads. Added a user-facing flagging system.

### Changes Made
- `backend/src/ingestion/anti-fraud.service.ts` — Implemented Hamming distance and duplicate checking.
- `backend/src/admin/admin-dispute.controller.ts` — Admin endpoints to resolve flagged cards.
- `backend/test/anti-fraud.e2e-spec.ts` — E2E test for duplicate detection.

## Prompt 15 — Batch Jobs: Recalculation Worker (2026-05-16)

### Summary
Implemented a background worker that processes batch rating recalculation jobs. Added AuditLog model for change tracking.

### Changes Made
- `backend/prisma/schema.prisma` — Added `AuditLog` model.
- `backend/src/rating/rating-recalculation.worker.ts` — Implemented the worker process.
- `backend/test/rating-recalculation.e2e-spec.ts` — E2E test for batch recalculation.

### Next Steps
- Prompt 16: CI & Local E2E Smoke Tests
