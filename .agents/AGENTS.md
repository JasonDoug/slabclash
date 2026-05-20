# AGENTS.md

Purpose
- Provide concise guidance for code-generation agents (Codex, Claude Code, etc.) and human reviewers so they can interact with this repository effectively.
- Explain key repository documents and the designs directory.
- Include the mandatory repository docs and agent responsibilities section (verbatim) that defines workflows, guardrails, and testing policy.

Repository file overview
- prompt_plan.md
  - The Agent-Ready Prompt Plan. Step-by-step, per-stage prompts and checklists that drive the agent workflow. Each plan step contains prompts the agent should execute, expected artifacts, tests, rollback and idempotency notes, and a TODO checklist using Markdown checkboxes. Agents MUST update this file as they complete work.
- spec.md
  - The developer specification (devSpec). Minimal functional and technical specification that describes architecture, data models, APIs, behavior, and acceptance criteria. Agents should consult spec.md before implementing or altering behavior and must update it if introducing new public APIs or behavior changes.
- idea.md
  - Raw idea notes and brainstorming. High-level context and non-normative ideas that influenced the design. Do not treat this file as a contract; it is background context.
- idea_one_pager.md (or idea_one_pager.md)
  - One-page executive summary of the product idea: problem, users, core flow, and high-level goals. Useful for alignment and quick decisions. Not a substitute for prompt_plan.md or spec.md for engineering work.
- /designs/
  - Design assets and related artifacts. This directory will contain:
    - Source design files (Figma exports, Adobe XD, Sketch, or layered PSDs) or links to hosted Figma documents (include README to point at external design source if file hosting is not possible).
    - Exported PNG/SVG/WEBP assets used by UI (icons, logos, sample screens).
    - Architecture diagrams (SVG/PNG), flowcharts, and other visual artifacts.
    - A small README describing file provenance, licensing, and how to open/source the originals.
  - Agents must not assume designs are authoritative for API behavior. If design files are missing or unusable, state that explicitly and ask the human.

Include the following section verbatim:

## Repository docs
- 'ONE_PAGER.md' - Captures Problem, Audience, Platform, Core Flow, MVP Features; Non-Goals optional.
- 'DEV_SPEC.md' - Minimal functional and technical specification consistent with prior docs, including a concise **Definition of Done**.
- 'PROMPT_PLAN.md' - Agent-Ready Planner with per-step prompts, expected artifacts, tests, rollback notes, idempotency notes, and a TODO checklist using Markdown checkboxes. This file drives the agent workflow.
- 'AGENTS.md' - This file. 

### Agent responsibility
- After completing any coding, refactor, or test step, **immediately update the corresponding TODO checklist item in 'prompt_plan.md'**.  
- Use the same Markdown checkbox format ('- [x]') to mark completion.  
- When creating new tasks or subtasks, add them directly under the appropriate section anchor in 'prompt_plan.md'.  
- Always commit changes to 'prompt_plan.md' alongside the code and tests that fulfill them.  
- Do not consider work “done” until the matching checklist item is checked and all related tests are green.
- When a stage (plan step) is complete with green tests, update the README “Release notes” section with any user-facing impact (or explicitly state “No user-facing changes” if applicable).
- Even when automated coverage exists, always suggest a feasible manual test path so the human can exercise the feature end-to-end.
- After a plan step is finished, document its completion state with a short checklist. Include: step name & number, test results, 'prompt_plan.md' status, manual checks performed (mark as complete only after the human confirms they ran to their satisfaction), release notes status, and an inline commit summary string the human can copy & paste.

#### Guardrails for agents
- Make the smallest change that passes tests and improves the code.
- Do not introduce new public APIs without updating 'spec.md' and relevant tests.
- Do not duplicate templates or files to work around issues. Fix the original.
- If a file cannot be opened or content is missing, say so explicitly and stop. Do not guess.
- Respect privacy and logging policy: do not log secrets, prompts, completions, or PII.

#### Deferred-work notation
- When a task is intentionally paused, keep its checkbox unchecked and prepend '(Deferred)' to the TODO label in 'prompt_plan.md', followed by a short reason.  
- Apply the same '(Deferred)' tag to every downstream checklist item that depends on the paused work.
- Remove the tag only after the work resumes; this keeps the outstanding scope visible without implying completion.

#### When the prompt plan is fully satisfied
- Once every Definition of Done task in 'prompt_plan.md' is either checked off or explicitly marked '(Deferred)', the plan is considered **complete**.  
- After that point, you no longer need to update prompt-plan TODOs or reference 'prompt_plan.md', 'spec.md', 'idea_one_pager.md', or other upstream docs to justify changes.  
- All other guardrails, testing requirements, and agent responsibilities in this file continue to apply unchanged.

---

## Testing policy (non‑negotiable)
- Tests **MUST** cover the functionality being implemented.
- **NEVER** ignore the output of the system or the tests - logs and messages often contain **CRITICAL** information.
- **TEST OUTPUT MUST BE PRISTINE TO PASS.**
- If logs are **supposed** to contain errors, capture and test it.
- **NO EXCEPTIONS POLICY:** Under no circumstances should you mark any test type as "not applicable". Every project, regardless of size or complexity, **MUST** have unit tests, integration tests, **AND** end‑to‑end tests. If you believe a test type doesn't apply, you need the human to say exactly **"I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME"**.

### TDD (how we work)
- Write tests **before** implementation.
- Only write enough code to make the failing test pass.
- Refactor continuously while keeping tests green.

**TDD cycle**
1. Write a failing test that defines a desired function or improvement.  
2. Run the test to confirm it fails as expected.  
3. Write minimal code to make the test pass.  
4. Run the test to confirm success.  
5. Refactor while keeping tests green.  
6. Repeat for each new feature or bugfix.

---

## Important checks
- **NEVER** disable functionality to hide a failure. Fix root cause.  
- **NEVER** create duplicate templates or files. Fix the original.  
- **NEVER** claim something is “working” when any functionality is disabled or broken.  
- If you can’t open a file or access something requested, say so. Do not assume contents.  
- **ALWAYS** identify and fix the root cause of template or compilation errors.  
- If git is initialized, ensure a '.gitignore' exists and contains at least:
  
  .env
  .env.local
  .env.*
  
  Ask the human whether additional patterns should be added, and suggest any that you think are important given the project. 

## When to ask for human input
Ask the human if any of the following is true:
- A test type appears “not applicable”. Use the exact phrase request: **"I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME"**.  
- Required anchors conflict or are missing from upstream docs.  
- You need new environment variables or secrets.  
- An external dependency or major architectural change is required.
- Design files are missing, unsupported or oversized

You also have access to these previously generated documents for context:

### devSpec:
Developer Specification
=======================

Version: 1.0  
Prepared for: Product & Engineering Leadership  
Prepared by: (Generated)  
Date: 2026-03-31

Purpose
-------
This document is a developer-ready specification for the Sports Trading Card Battle App MVP. It consolidates requirements, architecture, data models, APIs, data handling, error handling, anti-fraud, testing, deployment, and an implementation backlog so engineers can begin work immediately.

Assumptions (defaults chosen for MVP)
------------------------------------
- Sport: Baseball (single sport for MVP).
- Mobile: React Native (single codebase; native modules allowed for camera/ML).
- Backend: Node.js + TypeScript (NestJS recommended).
- Cloud: AWS (S3, RDS/Aurora Postgres, ElastiCache Redis, SQS, Lambda where appropriate).
- Real-time: Managed provider (Pusher or Ably) for live matches.
- CV/OCR: Google Cloud Vision for OCR/initial detection + small custom classifier for set/parallel detection and condition estimation.
- Match engine: Deterministic stat-based comparison (per-position weighted stat comparison).
- Marketplace: No real-money trading in MVP. Use in-app currency and controlled rentals.
- Anti-fraud: Image hash duplicate detection, rate limits, moderation queue. Escrow/deposits are Phase 2.

MVP Scope (priority)
--------------------
1. Mobile scanning & ingestion pipeline (front/back images, OCR, identification).
2. Reproducible power rating engine (configurable weights + admin UI).
3. 1v1 match flow (lineup selection, deterministic match resolution) + basic matchmaking.
4. Basic anti-fraud flags and moderation queue.
5. Admin dashboard: ingest queue, rating weight controls, manual verification queue, basic metrics.
6. Persistent collection UI (browse/filter cards).
7. Basic rentals (in-app currency) — optional MVP stretch.

High-level Architecture
-----------------------
- Mobile clients (React Native)
  - Camera UI
  - Scan flow with local pre-checks
  - Collection browsing & match client
- API Gateway + Auth
  - AWS API Gateway or managed gateway
  - Authentication via AWS Cognito (or Auth0)
- Microservices (Node.js / TypeScript)
  - Auth & User Service
  - Collection & Card Service
  - Ingestion Service (image upload + CV inference orchestration)
  - Rating Engine Service (policy-driven, configurable)
  - Matchmaking & Match Engine
  - Marketplace Service (in-app currency, rentals)
  - Admin Service / Dashboard
- Data stores
  - PostgreSQL (RDS/Aurora) — canonical relational store
  - Redis (ElastiCache) — caching, leaderboards, matchmaking queues
  - S3 — card images, thumbnails, CV artifacts
- Queues & async
  - SQS (or SNS + SQS) for ingestion jobs, rating recalculation, match processing
- 3rd-party & managed services
  - Google Vision (OCR & label hints)
  - Sports data provider (Sportradar / Stats Perform)
  - Market price provider (eBay API or licensed aggregator)
  - Pusher/Ably (real-time channels)
  - Sentry, CloudWatch, Prometheus (monitoring & error tracking)
- Infra & CI/CD
  - IaC (Terraform)
  - CI pipeline (GitHub Actions/GitLab)
  - Blue/green or canary deploy patterns

Service Boundaries & Responsibilities
------------------------------------
- Ingestion Service
  - Accepts uploads (front/back), runs OCR & image hashing, triggers CV classifier, stores artifacts in S3, creates a CardIngestion record.
  - Emits events: ingestion.completed, ingestion.flagged.
- Rating Engine
  - Responsible for computing power score given a Card entity, player stats, market value, card attributes, and condition. Weights stored in DB and editable by admins.
- Match Engine
  - Runs deterministic comparison: per-position stat-weighted comparison, sums points, returns winner and break-down.
  - Publishes match events for replay/logging.
- Matchmaking
  - Enqueues players, finds matches using lineup power delta ± tolerance, rank, and rarity caps.
- Collection Service
  - CRUD for User collections, card provenance & audit logs, lineup creation.
- Admin Service
  - Moderation queues, weight configuration, metrics and manual overrides.

Data Models (canonical, simplified)
----------------------------------

Note: include common indexes (e.g., unique constraints and frequent query columns).

- User
  - id (uuid, PK)
  - username (unique)
  - email
  - passwordHash / authProvider
  - createdAt, lastActiveAt
  - reputationScore (float)
  - tier (free, premium)
  - inAppCurrencyBalance (int)
  - settings, preferences (jsonb)

- Card
  - id (uuid, PK)
  - userId (fk -> User) // owner
  - playerId (fk -> Player)
  - year (int)
  - setName (string)
  - variant (string) // parallel, autograph, relic
  - serialNumber (nullable string)
  - conditionReported (enum)
  - conditionEstimatedScore (float 0-100)
  - marketValueCents (int)
  - rarity (enum: common/uncommon/rare/legendary)
  - powerScore (float) // computed
  - provenance (jsonb) // ingestion metadata & audit trail
  - imageFrontS3Key, imageBackS3Key
  - phash (string) // perceptual hash for duplicates
  - ingestionStatus (enum: pending, verified, flagged)
  - createdAt, updatedAt

- Player
  - id (uuid), name, team, position(s)
  - statsSnapshot (jsonb) // normalized stats used in rating; maintain timestamp
  - currentForm (float) // momentum metric

- CardIngestionJob
  - id, userId, s3Keys, status (uploaded, processing, awaiting_user_confirm, verified, flagged)
  - CVConfidence, OCRText, candidateMatches (json)
  - createdAt, updatedAt

- RatingConfig
  - id, name, weights (jsonb), version, lastUpdatedBy, active (bool)
  - example: { playerStats:0.4, marketValue:0.2, rarity:0.2, condition:0.1, momentum:0.1 }

- Lineup
  - id, userId, name, slots (jsonb) // mapping of position to Card.id
  - aggregatePowerScore, rarityCounts

- Match
  - id, matchType (casual/ranked), lineupA, lineupB, result (A/B/draw), events (jsonb), startedAt, finishedAt
  - matchSeed (string) // deterministic seed for reproducibility
  - latencyMs, resolutionTimeMs

- Dispute / Flag
  - id, cardId, userId (who flagged), reason, status, adminNotes

- AuditLog
  - id, entityType, entityId, action, actorId, timestamp, payload

- Leaderboard (Redis store + Postgres snapshot)
  - userId -> ranking metrics

APIs (HTTP + WebSocket/Realtime)
--------------------------------

Auth
- POST /auth/signup
- POST /auth/login
- POST /auth/refresh

Scan & Ingestion
- POST /v1/scan/upload
  - Request: multipart/form-data frontImage, backImage, optional metadata
  - Response: { scanJobId, status }
- GET /v1/scan/status/{scanJobId}
  - Returns detection results, candidate matches, OCR text, confidence
- POST /v1/scan/confirm/{scanJobId}
  - Body: confirmed metadata (playerId, year, setName, variant, conditionReported)
  - Returns: created Card.id and power score (if calculated) or queued for review
- POST /v1/scan/edit/{scanJobId} // optional edits before finalizing

Collection
- GET /v1/users/{userId}/cards
- GET /v1/cards/{cardId}
- PATCH /v1/cards/{cardId}/metadata // for manual edits after verification
- POST /v1/lineups
- GET /v1/lineups/{lineupId}
- POST /v1/cards/{cardId}/flag // user flags a card

Matchmaking & Matches
- POST /v1/matchmaking/enqueue
  - Body: lineupId, matchType (casual/ranked), preferences
  - Response: { queued: true, queuePosition }
- GET /v1/matchmaking/status/{userId}
- WebSocket (Pusher) Channel: user-{userId}
  - Events:
    - match.found (includes opponent lineup summary, matchId)
    - match.start
    - match.event (play-by-play payload)
    - match.result

Admin
- GET /admin/ingestion/queue
- POST /admin/ingestion/{jobId}/approve
- POST /admin/ingestion/{jobId}/reject
- GET /admin/rating-config
- POST /admin/rating-config (create new)
- POST /admin/rating-config/{id}/activate
- GET /admin/disputes

Rating Engine — Detailed
------------------------
Goal: produce stable, auditable powerScore per card. Scores should be reproducible for a given ratingConfig version and source data snapshot.

Pipeline:
1. Gather inputs:
   - Player stats snapshot (from sports data provider).
   - Market price (most recent normalized price).
   - Card attributes (variant, autographs, relics, serials).
   - Condition score (user reported + ML-estimated).
   - Momentum (decay-weighted recent performance).
2. Normalize each input using z-score or min-max with clipped tails to avoid outliers.
   - Maintain rolling mean/std per input or use historical dataset to compute z-score.
3. Apply weights from active RatingConfig.
4. Combine into raw score, map to 0–1000 scale for presentation.
5. Store powerScore and ratingConfigVersion in Card record and log in AuditLog.

Default weights (MVP):
- playerStats: 40%
- marketValue: 20%
- rarityAttributes: 20%
- condition: 10%
- momentum: 10%

Implementations details:
- Rating engine should be stateless and deterministically compute given inputs and config. Host as microservice with endpoints:
  - POST /v1/rating/calc (single card) -> returns breakdown and score
  - POST /v1/rating/batch (list of cards)
  - GET /v1/rating/config (admin)
- Provide batch recalculation job (SQS -> worker) to recalc many cards when config changes or price updates happen.

Match Engine — Deterministic algorithm (MVP)
--------------------------------------------
- Each lineup is a mapping of 9 positions to cards.
- For each position, compute position-specific stat value: weighted combination of relevant player stats (e.g., for batter: OBP, SLG, batting average, recent WAR component).
- Normalize per-position values across both lineups.
- Compare per-position: winner receives 1 point (or scaled points by power difference), tie gives 0.5 points each.
- Sum points across all positions. Higher total wins.
- Tiebreakers (in order): aggregate marketValue, aggregate momentum, sudden-death simulated inning between top-ranked cards.
- Output: match result with breakdown, reproducible by using matchSeed (derived from matchId + sorted cardIds).

Match Engine API:
- POST /v1/match/resolve
  - Body: { lineupA, lineupB, matchSeed, matchType }
  - Response: { winner, scores, events[] }

Matchmaking rules (MVP defaults)
- Primary inputs: aggregate lineup powerScore (sum or weighted average), player rank/tier, rarity caps.
- Defaults:
  - Casual queue: allowed power delta ±5% (configurable).
  - Ranked queue: allowed power delta ±2%.
  - Rarity cap: max 2 legendary per 9-card lineup.
  - Time-based relaxation: after X seconds, increase allowed delta by Y to find opponents.
- Matchmaker picks opponent from Redis-sorted queues (by power bins) to achieve low-latency match assignment.
- On match found, notify both players via Realtime.

Card Scanning & CV Pipeline
---------------------------
Flow:
1. Mobile uploads images to S3 via pre-signed URLs (POST /scan/upload returns presigned).
2. Ingestion service pulls images and submits OCR request to Google Vision.
3. Extract text (player name, year, set name, serial numbers, detectable text).
4. Run custom image classifier:
   - Identify set template (found via feature detection).
   - Detect parallel/variant elements (autograph presence, relic patch).
   - Estimate condition: use CNN model trained to predict condition score (0–100) and grade class.
5. Compute perceptual hash (pHash) of front image for duplicate detection.
6. Lookup candidate card entries in reference dataset (player, set, year) using OCR text and classifier hints.
7. If high-confidence single match: auto-propose metadata and call rating engine to compute score. If below threshold or marketValue > highValueThreshold, mark as awaiting_user_confirm or flagged for manual review.
8. Save CardIngestionJob with details and create Card record once user confirms (or admin approves).

CV/ML notes:
- Use off-the-shelf OCR for MVP (Google Vision) and custom classifier only where necessary.
- Keep training dataset isolated and versioned. Start with 50–100 labeled cards for spike; expand dataset progressively.
- Store model metadata, version, and predictions in ingestion artifacts.

Data Handling & Normalization
-----------------------------
- Time-series data from sports feeds: snapshot and store timestamped player stats. Use TTL/retention policy; store daily snapshots.
- Market pricing: store lastPriceCents and history of prices with timestamps. When recomputing ratings, use latest price within X days; if none, fallback to regional baseline.
- Normalization:
  - For player stats: compute z-score based on historical mean/std for the chosen stat-window (career/season).
  - Momentum: exponential decay of recent games; config param for half-life.
- Sensitive fields (e.g., user PII) stored encrypted at rest (RDS encryption + AWS KMS).
- Images stored in S3 with private access; serve thumbnails via signed URLs.
- Audit logs: write immutable logs for ingestion, rating changes, manual overrides.

Anti-fraud & Trust & Safety
---------------------------
MVP anti-fraud stack:
- Perceptual image hashing (pHash) and similarity clustering; reject or flag near-duplicates to existing cards unless legitimate (duplicates intentionally owned by different users).
- Device & user rate limiting (API Gateway + WAF).
- Reputation system (reputationScore increments/decrements based on disputes, confirmed fraud, helpful flags).
- Flagging & Disputes flow:
  - User flags card -> creates Dispute record -> card moves to “locked for contest” state (cannot be used in ranked matches if high-risk) -> admin reviews -> resolved -> outcomes: revert powerScore, suspend user, or mark as valid.
- Image provenance: store EXIF metadata where present and log IP/device fingerprint at upload time.
- Manual review dashboard for admin with filtered queues for high-value cards, low-confidence scans, and duplicate detection hits.
- Rate-limit for high-value submissions (e.g., require manual confirmation and identity verification for cards estimated > $X).
- Daily automated checks: price anomalies, rapid value increases, suspicious ownership transfers.

Image provenance: store EXIF metadata where present and log IP/device fingerprint at upload time.
Manual review dashboard for admin with filtered queues for high-value cards, low-confidence scans, and duplicate detection hits.
Rate-limit for high-value submissions (e.g., require manual confirmation and identity verification for cards estimated > $X).
Daily automated checks: price anomalies, rapid value increases, suspicious ownership transfers.

Error Handling & Resilience Patterns
------------------------------------
General strategies:
- Fail-fast on invalid requests (400) with structured error objects { code, message, details }.
- For async jobs (ingestion, rating recalculation) use SQS with dead-letter queues (DLQ). On repeated failures (> N attempts), send to DLQ and notify admin.
- Retries with exponential backoff for transient external errors (CV API failures, sports API rate limits).
- Circuit breaker for external dependencies to fail gracefully and degrade features (e.g., if market price provider fails, fallback to cached price or default).
- Idempotency keys for operations that can be retried (scan upload, match enqueue).
- Transaction boundaries: use Postgres transactions for updates requiring multiple changes (e.g., finalize card ingest + rating write).
- Timeouts: UI-facing APIs default 10–30s; long-running jobs must be async with pollable status endpoints.

Security & Compliance
---------------------
- Auth: JWT issued by Cognito / Auth0. Access tokens scoped by service.
- Role-based access control for admin endpoints.
- Secrets management: AWS Secrets Manager or Parameter Store, encrypted with KMS.
- Rate limiting: API Gateway / WAF limits per IP and per user.
- Data encryption: at rest (RDS encryption), in transit (TLS).
- PII minimization: don't store more user information than necessary; redact logs where needed.
- Logging: structured JSON logs with request IDs; Sentry for exceptions.
- Legal: avoid using official league logos in UI without licensing; only use player names & publicly available stats if licensing allows.

Operational Monitoring & SLOs
----------------------------
- Metrics to emit:
  - scan.recognition_accuracy (from post-verified labels)
  - ingestion.latency
  - match.resolution.latency
  - api.95p_latency
  - match.queue_wait_time
  - flagged.card_rate
- Dashboards: CloudWatch / Grafana for system metrics; custom dashboards for business metrics (DAU, matches/day, GMV if applicable).
- Alerts:
  - High error rate (>1% of requests)
  - DLQ messages > threshold
  - Match queue growth (significant backlog)
- Suggested SLOs for MVP:
  - API 95p latency < 300ms
  - Match resolution < 2s (deterministic)
  - Scan recognition accuracy >= 90% for common sets
  - System uptime 99.5%

Testing Plan
------------
Unit, Integration, E2E, Load, Security tests — staged and automated.

1. Unit Tests
   - Service logic (rating computation, match resolution).
   - Validation for API endpoints.
   - CV model wrapper tests (mocked responses).
   - Use Jest for TypeScript.

2. Integration Tests
   - Database interactions (Postgres test instances).
   - S3 pre-signed upload & retrieval flow (localstack for CI or test bucket).
   - Queue handling (SQS or localstack).
   - External API mocks (Google Vision, sports feed, pricing API).

3. End-to-End (E2E) Tests
   - Simulate full scan -> confirm -> rating -> lineup -> enqueue -> match resolution.
   - Use Cypress or Detox for mobile flows (Detox recommended for React Native).
   - Include admin flows: weight update -> batch recalculation -> verify changes.

4. CV Model Validation
   - Holdout dataset & metrics (precision/recall for identification, accuracy for condition classification).
   - Periodic retrain & data drift monitoring.

5. Load & Stress Tests
   - Match engine: simulate concurrent match resolutions (up to expected concurrency).
   - Ingestion pipeline: ramping image uploads and CV calls.
   - Use k6, Locust or Gatling.

6. Security Tests
   - Static analysis (Snyk, npm audit).
   - Pen-test for common vulnerabilities and authentication flows.
   - OWASP dependency checks.

7. Acceptance Criteria (per one-pager & product)
   - Scan recognition accuracy >= 90% for major sets.
   - Cards have reproducible power ratings exposed to client.
   - Users can create a lineup and play 1v1 matches.
   - Basic matchmaking provides balanced matches by configured tolerance.
   - Admin dashboard to moderate ingestion and change rating weights.

Deployment & CI/CD
------------------
- IaC: Terraform modules for VPC, RDS, ElastiCache, S3 buckets, ECR, IAM.
- CI: GitHub Actions pipeline:
  - Lint -> unit tests -> build images -> push to ECR -> deploy to staging.
  - Integration & e2e run on staging environment.
  - Manual gating for production deploys.
- Blue/Green or Canary via ECS Fargate or EKS (ECS/Fargate recommended for MVP).
- Database migrations via TypeORM or Knex migrations executed during deploy.
- Secrets stored in Secrets Manager; rotated periodically.

Backlog & Implementation Plan (12 weeks, 2-week sprints)
--------------------------------------------------------

Priority features (top 3)
1. Scanning / Ingest pipeline
2. Reproducible Rating Engine
3. 1v1 Match flow + Matchmaking

Sprint 0 (Week 0 — planning + spikes)
- Tasks:
  - Finalize contracts for sports feed and pricing provider.
  - Acquire sample dataset (50–100 cards).
  - Infra spike (Terraform + basic networking).
  - CV spike using Google Vision + quick classifier.
  - Decide on Pusher vs Ably (procure dev account).
Deliverables: spike results, datasets, architecture diagram.

Sprint 1 (Weeks 1–2)
- Mobile: basic camera UI, image upload to pre-signed S3.
- Backend: upload endpoints, S3 presigned flow, IngestionService skeleton.
- CV integration (Google Vision mock) + ingestion job creation.
- DB schema creation for CardIngestion and Card.
Deliverables: end-to-end upload -> job created.

Sprint 2 (Weeks 3–4)
- Implement OCR flow, text extraction, simple matching against reference dataset.
- Build ingestion UI in admin for queue viewing.
- Implement pHash calculation and duplicate detection pipeline.
- Add user confirm flow for scan results on mobile.
Deliverables: scan -> candidate matches -> user confirm -> card created.

Sprint 3 (Weeks 5–6)
- Rating engine service: implement normalization, default weights, single-card calc endpoint.
- Wire rating calculation into ingestion finalization.
- Admin UI to view and edit ratingConfig (create, version).
Deliverables: card created with powerScore visible.

Sprint 4 (Weeks 7–8)
- Collection management: user collection list, card detail with breakdown.
- Lineup creation UI & Lineup endpoints.
- Basic matchmaking queue + Redis-based queuing.
Deliverables: user can create lineup; enqueue for match.

Sprint 5 (Weeks 9–10)
- Match engine deterministic algorithm & resolve API.
- Realtime notifications (Pusher): match.found, match.start, match.result.
- Frontend match result display and play-by-play simple animation.
Deliverables: full 1v1 flow: enqueue -> match found -> resolved -> result shown.

Sprint 6 (Weeks 11–12)
- Anti-fraud flags, moderation queue, dispute flow, manual admin actions.
- Load testing & performance tuning for match engine and ingestion.
- Hardening: retries, DLQ, monitoring dashboards, SLO validation.
Deliverables: MVP-ready system, e2e tests passing, monitoring in place.

Deliverables & Artifacts
-----------------------
- API spec (OpenAPI/Swagger)
- Database schema & migration scripts
- Terraform modules for core infra
- CV model artifacts and training metadata
- Admin dashboard MVP
- CI/CD pipelines & runbooks
- Testing suites (unit, integration, e2e, load)
- Security checklist & compliance notes

Operational Runbooks & Playbooks
--------------------------------
- Ingestion stuck jobs: how to inspect DLQ, reprocess jobs, escalate to admin.
- Match backlog: analyze queue metrics, re-balance workers.
- Recalculate ratings: steps for running batch recalculation on config change (create job, dry run, sample verification).
- Incident response: who to notify (on-call), how to rollback changes (deployment rollback, DB migration rollback).
- Fraud escalation: require steps for manual verification and user sanctions.

Edge Cases & Implementation Notes
---------------------------------
- Ambiguous OCR matches: require user confirmation; keep candidate list and allow fuzzy matching.
- Duplicates legitimately owned by different users: check for exact duplicate + ownership; only flag if suspicious patterns (same device/user or same image used across accounts).
- Race conditions when finalizing scan & match creation: idempotency keys & DB transactions.
- Price feed outages: fallback to cached price snapshot; mark rating with "priceStale: true".
- Model drift: keep a small percentage of scans routed to manual review for quality monitoring, increase sampling if accuracy drops.

APIs — Example payloads
-----------------------
1) POST /v1/scan/upload (client)
- Response:
  {
    "scanJobId": "uuid",
    "uploadUrlFront": "https://s3-presigned",
    "uploadUrlBack": "https://s3-presigned"
  }

2) GET /v1/scan/status/{scanJobId}
- Response:
  {
    "status": "awaiting_user_confirm",
    "candidates": [
      { "playerId":"uuid", "playerName":"M. Ramirez", "year":2018, "set":"Topps", "confidence":0.92 }
    ],
    "ocrText": "MARCUS RAMIREZ 2018 TOPPS"
  }

3) POST /v1/scan/confirm/{scanJobId}
- Body:
  {
    "playerId":"uuid",
    "year":2018,
    "setName":"Topps",
    "variant":"Base",
    "conditionReported":"EX",
    "confirm":true
  }
- Response:
  {
    "cardId":"uuid",
    "powerScore":742,
    "powerBreakdown": {
      "playerStats": 0.48,
      "marketValue": 0.12,
      "rarity": 0.18,
      "condition":0.05,
      "momentum":0.17
    }
  }

4) POST /v1/matchmaking/enqueue
- Body:
  { "userId":"uuid", "lineupId":"uuid", "matchType":"casual" }

5) WebSocket match.found event
- Payload:
  {
    "matchId":"uuid",
    "opponent":{ "userId":"uuid", "displayName":"CollectorA", "lineupPower": 742 },
    "matchType":"casual"
  }

Operational & Business Metrics to Track
--------------------------------------
- Scan conversion rate: uploaded scans → verified cards %
- Scan recognition accuracy (manual verification)
- Matches per user per week
- Average match queue time
- DAU/MAU
- Retention (1d/7d/30d)
- % flagged cards and resolution time
- Server error rates and API latency

Open Questions & Decisions to Finalize (recommend acting on early)
------------------------------------------------------------------
- Confirm sports data provider contract (Sportradar/Stats Perform) and pricing.
- Confirm pricing provider (eBay API or licensed aggregator).
- Define highValueThreshold for manual review (e.g., $500).
- Decide on identity verification requirement for users listing high-value cards (Phase 2 decision).
- Confirm payment provider if later enabling real-money marketplace.

Appendix A — Error Codes (suggested)
-------------------------------------
- 40001: INVALID_REQUEST — missing or invalid params.
- 40101: UNAUTHORIZED — token invalid/expired.
- 40401: NOT_FOUND — entity not found.
- 40901: CONFLICT_IDEMPOTENCY — duplicate request detected.
- 42201: CV_LOW_CONFIDENCE — scan needs user confirmation.
- 50001: EXTERNAL_DEP_FAIL — third-party failure, try later.
- 50000: INTERNAL_SERVER_ERROR

Appendix B — Testing Checklist (Before Beta)
--------------------------------------------
- End-to-end ingest → match successful for 100 sample cards.
- Rating engine reproducibility test: same inputs → same score.
- Duplicate detection test suite with similar images.
- Load tests: match engine under expected concurrency.
- Security scan & remediation backlog cleared.
- Monitoring & alerts configured and tested.

Next Steps (recommended)
------------------------
1. Approve assumptions (baseball, React Native, Node/TypeScript, AWS, Google Vision).
2. Procure sports & pricing feeds.
3. Run CV spike with 50–100 labeled cards and validate recognition targets.
4. Kick off Sprint 0 activities and create initial Terraform skeleton + staging account.
5. Start development with the top three priorities: ingestion, rating, match flow.

If you want, I can:
- Produce the OpenAPI spec for the APIs above.
- Create a more granular sprint backlog with ticket-level tasks.
- Generate architecture diagrams (PNG/SVG).
Which should I prepare next?

### checklist:
# Prompt Plan — Sports Trading Card Battle App (MVP)
Prepared: 2026-03-31

This document is a comprehensive, step-by-step Prompt Plan to guide code-generation LLM agents and engineers to implement the Sports Trading Card Battle App MVP described in the devSpec. It provides a staged blueprint, iteratively refined tasks broken into safe implementation-sized steps, and a series of code-generation prompts (each in a text block) that can be executed by an LLM to produce working code and tests. Each prompt closes with a todo checklist that the agent can check off once finished.

How to use this document
- Follow the stages in order. Each stage builds on prior stages and contains one or more prompts.
- Execute prompts sequentially. Each prompt is designed to be test-driven: it asks for code + unit tests + basic integration tests (mocked where necessary).
- After an LLM produces code for a prompt, run the included tests and manual verification steps before moving to the next prompt.
- If manual steps are required (e.g., cloud account setup, dataset procurement), they are listed as separate prompts or checkboxes.
- Keep each change small and verifiable. No orphaned code: every implementation should be wired into the existing codebase or a clearly defined integration point.

Summary — Staged Blueprint (high-level)
1. Foundation & infra skeleton (local-first): repo layout, tooling, TypeScript monorepo with backend (NestJS) and mobile (React Native) packages, local Docker compose for Postgres+Redis, ESLint/Prettier, Jest.
2. Auth & User model basics: minimal auth (JWT stub / local dev accounts), User DB model, migrations.
3. Upload & Ingestion pipeline skeleton: presigned URL endpoint, CardIngestionJob DB model, S3-localstack integration, image pHash calculation (server-side), job creation.
4. CV integration (mock): Google Vision adapter stub + integration test; OCR extraction saved to ingestion job.
5. Candidate matching & ingestion confirmation flow: reference dataset lookup (small seeded dataset), API to check job status and confirm metadata, create Card record.
6. Rating engine service (stateless): normalization & deterministic score calculation endpoint + unit tests. Wire rating into ingestion finalization.
7. Collection & Lineup APIs: CRUD for Card, Lineup creation endpoints and UI stubs.
8. Matchmaking queue & Match engine: Redis queue, enqueue endpoint, deterministic match resolve endpoint & unit tests, simple WebSocket/pusher-mock notification.
9. Admin & moderation basics: ingestion queue list, approve/reject endpoints, rating config manage.
10. Anti-fraud basics: pHash duplicate detection, flagging endpoint, manual lock state.
11. Mobile (React Native) minimal flows: camera capture -> upload -> poll scan status -> confirm metadata -> view card & create lineup -> enqueue match -> show result.
12. CI & local e2e: GitHub Actions workflow skeleton + localstack workflows for CI, Cypress/Detox e2e smoke tests.

Iterative chunking rationale
- Each prompt is intentionally small: one endpoint/service or a tightly coupled set (model + endpoint + tests).
- Each step includes unit tests and a short integration test (mocking external services) so we can verify correctness before moving on.
- No step depends on large-scale infra — use localstack, Docker compose, and in-memory mocks during early sprints.

Implementation conventions (must be followed across prompts)
- Backend: Node.js + TypeScript. Prefer NestJS (or express if LLM/agent simpler) — prompts will ask for NestJS structure.
- ORM: TypeORM or Prisma (Prisma recommended for developer ergonomics). Prompts will use Prisma for clarity unless otherwise requested.
- Testing: Jest for unit tests. Use Supertest for HTTP integration tests.
- Local infra: Docker compose with Postgres and Redis. For S3, use localstack in CI/dev or minio.
- Auth: Simple JWT-based dev auth service with in-memory user creation; later swapped to Cognito.
- Realtime: Use Pusher-like abstraction with a local mock implementation for dev.
- CI: GitHub Actions skeleton (lint, unit tests).
- Code style: ESLint + Prettier; strict TS settings.

PROMPTS
Below are the prompts for each implementation step. Each prompt is contained in a code block tagged as text. After each prompt there's a todo checklist for the code-generation agent and human reviewers.

------------------------------------------------------------
Prompt 00 — Repo & Local Dev Foundation
------------------------------------------------------------
```text
Context:
We will build the backend and mobile app in a monorepo. Start with a minimal, local-first developer environment so later features can integrate smoothly. Use TypeScript, Prisma for DB, NestJS for backend services, and Yarn workspaces. Provide Docker Compose for Postgres and Redis. Add basic linting, formatting, and Jest config.

Goal:
Create a repository skeleton with:
- /backend (NestJS app)
- /mobile (React Native app skeleton — Expo or bare RN; create minimal stub)
- /shared (shared types)
- package.json workspaces
- Docker Compose with Postgres (latest supported) and Redis
- Prisma init in backend with schema for User and migration scripts
- ESLint, Prettier, and Jest configuration
- README with dev-run instructions and commands:
  - yarn install
  - yarn dev:backend (start NestJS with ts-node + watch)
  - yarn db:up (start Docker Compose)
  - yarn prisma:migrate:dev
  - yarn test

Acceptance criteria:
- Running "yarn dev:backend" starts NestJS and connects to Postgres (container must be available)
- "yarn test" runs and passes (initial trivial tests)
- README with clear steps

Deliverables (code + tests):
- Repo skeleton committed with package.json workspaces
- A basic NestJS controller: GET /health -> 200 { status: "ok" } and unit test

Testing:
- Unit test for health endpoint using Jest & Supertest
- Integration test that starts NestJS in test mode and verifies /health

Notes:
- Keep the Prisma schema minimal: User table with id, username, email, createdAt
- Use environment variables (.env.example) for DB connection

Files to create/modify:
- package.json (root)
- backend/{src, test, prisma schema, nest config}
- docker-compose.yml
- .github/workflows/ci.yml (basic lint + tests stub)

Provide instructions for how to run and verify locally.
```

Todo checklist:
- [ ] Create monorepo skeleton with backend, mobile, shared
- [ ] Add Docker Compose for Postgres + Redis
- [ ] Initialize Prisma schema (User) and migrations
- [ ] Implement NestJS health endpoint + unit/integration tests
- [ ] Add ESLint/Prettier and Jest configs
- [ ] Write README dev instructions

------------------------------------------------------------
Prompt 01 — Auth & User Model (Dev Auth)
------------------------------------------------------------
```text
Context:
With the repo foundation complete, add a basic auth system for dev environment to manage users and issue JWT tokens. This will be swapped with Cognito later but must be functional and testable in dev.

Goal:
Implement in backend:
- Prisma User model (id uuid PK, username unique, email unique, passwordHash, createdAt, reputationScore default 0, inAppCurrencyBalance default 1000)
- POST /auth/signup: create user with username, email, password (hash using bcrypt)
- POST /auth/login: accept email+password -> return JWT accessToken (signed with dev secret) and user info
- Middleware/Guard to protect endpoints requiring userId
- Unit tests for signup/login and a protected test endpoint that requires JWT

Acceptance criteria:
- signup persists a user in DB and returns safe user info (no password hash)
- login returns JWT that can be used against auth-protected endpoints
- tests for signup + login + protected resource

Testing:
- Jest tests for signup/login endpoints and jwt guard

Deliverables:
- Prisma migration updating User model
- /auth controller, service, jwt guard
- tests using test DB instance (docker-compose)

Notes:
- Use short-lived dev secret via env var.
- The token payload should include userId and username.

Manual verification:
- Start DB, start backend, sign up a user, login, call protected endpoint with Authorization: Bearer <token>
```

Todo checklist:
- [ ] Extend Prisma schema with full User model
- [ ] Implement signup & login endpoints with bcrypt + JWT
- [ ] Implement JWT Guard for protected endpoints
- [ ] Write Jest tests for auth flows
- [ ] Document test commands in README

(remaining prompts omitted for brevity in this listing)
--- End of verbatim section ---

Agent workflow (minimal)
- Always read spec.md and prompt_plan.md before making changes.
- Implement TDD: add failing tests first, run them, then implement minimal code to pass, refactor.
- After each code change, run tests locally; update prompt_plan.md checklist and commit it with code & tests.
- When uncertain about missing files or conflicting anchors, pause and ask the human with a clear question.

If a file is missing or cannot be opened
- Say so explicitly. Stop. Do not guess or invent contents.

Quick checklist for agents (short)
- [ ] Read prompt_plan.md step for the work to be done.
- [ ] Confirm required artifacts exist (tests, spec anchors, designs).
- [ ] Write failing tests.
- [ ] Implement minimal code to pass.
- [ ] Run tests — must be green.
- [ ] Update prompt_plan.md checklist and README release notes as required.
- [ ] Commit code, tests, and prompt_plan.md together with a concise commit message.

Contact the human when:
- You need new env/secrets, major infra, or permission to skip tests ("I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME").
- Design files are missing or too large/unreadable.
- Anchor conflicts exist in upstream docs.

End of AGENTS.md.

<!-- Generated with vibescaffold.dev -->
