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
- /packages/backend (NestJS app)
- /packages/mobile (React Native app skeleton — Expo or bare RN; create minimal stub)
- /packages/shared (shared types)
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
- packages/backend/{src, test, prisma schema, nest config}
- docker-compose.yml
- .github/workflows/ci.yml (basic lint + tests stub)

Provide instructions for how to run and verify locally.
```

Todo checklist:
- [ ] Create monorepo skeleton with packages/backend, packages/mobile, packages/shared
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

------------------------------------------------------------
Prompt 02 — CardIngestionJob model & Presigned Upload Endpoint
------------------------------------------------------------
```text
Context:
We need to accept front/back images for a scan. For dev, use localstack or MinIO as S3. Implement presigned upload URLs and create an ingestion job record.

Goal:
- Prisma model: CardIngestionJob with fields:
  - id (uuid), userId (FK), imageFrontKey (nullable), imageBackKey (nullable),
  - status (enum: uploaded, processing, awaiting_user_confirm, verified, flagged),
  - ocrText (nullable string), createdAt, updatedAt
- Endpoint POST /v1/scan/upload
  - Auth required
  - Input: JSON { frontFileName, backFileName } (back optional)
  - Output: { scanJobId, uploadUrlFront, uploadUrlBack }
  - Generate pre-signed PUT URLs to S3-compatible storage (localstack/minio)
  - Persist CardIngestionJob with status "uploaded" and s3 keys set
- Unit tests:
  - Create job and validate DB row
  - Validate pre-signed URLs are reachable and accept a test upload (integration test using MinIO)

Acceptance criteria:
- Pre-signed URLs allow PUT upload in integration test
- Job inserted into DB with correct fields

Notes:
- Provide configuration to switch S3 provider between localstack/minio and AWS via env
- The presigned URL should include an idempotency key header to help retries

Manual verification:
- Use curl to PUT to uploadUrlFront and then call GET /v1/scan/status/{scanJobId} (next prompt will implement status but ensure job exists)
```

Todo checklist:
- [ ] Add CardIngestionJob model to Prisma and migrate
- [ ] Implement POST /v1/scan/upload to return presigned URLs
- [ ] Integration test uploading to presigned URLs (MinIO/localstack)
- [ ] Document S3 provider env config in README

------------------------------------------------------------
Prompt 03 — Minimal CV Adapter (Google Vision Mock) + OCR Extraction Job
------------------------------------------------------------
```text
Context:
Implement a CV adapter layer that can call Google Vision in production but for dev returns deterministic mocked OCR output. The ingestion service will call this adapter to extract OCR text and save to CardIngestionJob.

Goal:
- Create a CVService interface and two implementations:
  - cv/googleVisionAdapter.ts (real implementation skeleton with config)
  - cv/mockAdapter.ts (deterministic output for tests)
- Implement a background worker endpoint or controller to run OCR for a given scan job:
  - POST /v1/scan/process/{scanJobId} — starts processing (auth protected with admin role or same user)
  - Processing steps:
    - Fetch ingestion job and S3 keys
    - Download images from S3 (or read from store)
    - Pass front image to CV adapter to get OCRText
    - Compute perceptual hash (pHash) of front image, store into CardIngestionJob.provenance (or phash field)
    - Update CardIngestionJob.status to "awaiting_user_confirm" and set ocrText and phash
- Tests:
  - Unit test for processing flow using mockAdapter and a small fixture image (or synthetic buffer)
  - Integration test calling /v1/scan/process after uploading image to presigned URL

Acceptance criteria:
- CardIngestionJob updated with ocrText and phash
- Mock adapter used during tests and returns predictable ocrText

Notes:
- For pHash, use an npm library (e.g., image-hash or phash-imagemagick). If installing native deps is heavy, use a pure-node implementation or a simple SHA256 of a resized grayscale thumbnail as a placeholder for dev (but label it as phash placeholder).
- Store CV adapter response in CardIngestionJob.candidateMatches (json) even if empty.

Manual verification:
- Upload a test image, call /v1/scan/process/{id}, then GET /v1/scan/status/{id} to see ocrText and status change.
```

Todo checklist:
- [ ] Add CVService interface and mock implementation
- [ ] Implement /v1/scan/process/{scanJobId}
- [ ] Compute & store pHash (or placeholder) on the job
- [ ] Unit/integration tests for OCR processing
- [ ] Document how to switch to real Google Vision client via env

------------------------------------------------------------
Prompt 04 — Candidate Matching Against Reference Dataset (Seeded)
------------------------------------------------------------
```text
Context:
After OCR extraction, offer candidate matches from a small reference dataset (seeded players and sets). This permits user confirmation and later automated match suggestions.

Goal:
- Add a reference table in DB (PlayerReference) or a JSON seed file with entries: playerName, playerId (uuid), year, setName, canonical keys.
- Implement a MatchCandidateService that:
  - Takes OCR text and returns ranked candidate matches with confidence
  - Uses simple fuzzy string matching (e.g., fuse.js or string-similarity) and year extraction (regex)
- Implement GET /v1/scan/status/{scanJobId}
  - Returns: status, ocrText, candidates: [{ playerId, playerName, year, setName, confidence }]
- Tests:
  - Unit test for candidate matcher with several OCR text examples
  - Integration test connecting processing result to status endpoint returning candidates

Acceptance criteria:
- Endpoint returns candidates for known OCR examples
- Confidence is deterministic and monotonic (higher for clearer matches)

Notes:
- Seed with ~20 players and sets for MVP tests; store seed in /data/refPlayers.json and load at backend startup into an in-memory table for matching.
- Keep matching logic simple for now: name fuzzy match + year exact match boosts confidence.
```

Todo checklist:
- [ ] Add seed dataset for reference players/sets
- [ ] Implement MatchCandidateService with fuzzy-matching
- [ ] Implement GET /v1/scan/status/{scanJobId}
- [ ] Unit tests for fuzzy matching and status endpoint

------------------------------------------------------------
Prompt 05 — User Confirm Scan & Create Card Record
------------------------------------------------------------
```text
Context:
After receiving candidate matches, the user can confirm metadata. Build the confirm endpoint to create Card record using provided metadata and optionally trigger rating.

Goal:
- Prisma Card model per devSpec minimal fields:
  - id uuid, userId FK, playerId (ref to Player model or referenced by playerId string), year, setName, variant, serialNumber, conditionReported enum, conditionEstimatedScore nullable, marketValueCents nullable, rarity enum, powerScore nullable, provenance jsonb, imageFrontKey, imageBackKey, phash, ingestionStatus enum, createdAt
- Implement POST /v1/scan/confirm/{scanJobId}
  - Body: { playerId, year, setName, variant (string), conditionReported (enum), confirm: true }
  - Actions:
    - Validate that scanJob belongs to user
    - Create Card record (with image keys and phash copied from job), set ingestionStatus "verified" unless conditions require manual review
    - Link provenance (include OCR string, candidateMatches)
    - Trigger synchronous call to Rating Engine calc endpoint (if available) to compute powerScore; if rating service not yet implemented return powerScore null but schedule rating job (insert into queue)
    - Return cardId and powerScore (if computed)
- Tests:
  - Unit tests for confirm flow, ensuring Card record created, job updated status, and rating trigger enqueued or called
  - Integration test end-to-end: upload -> process -> status -> confirm -> card record present

Acceptance criteria:
- Card is created with correct fields and references to ingestion job
- The confirm endpoint returns expected payload and sets ingestionStatus appropriately

Manual verification:
- Use example flow: upload mock image, process, confirm with candidate playerId, then GET /v1/cards/{cardId} to view created card
```

Todo checklist:
- [ ] Add Card model and Prisma migration
- [ ] Implement POST /v1/scan/confirm/{scanJobId}
- [ ] Trigger rating calculation (sync or enqueue)
- [ ] Unit/integration tests for confirm flow
- [ ] Document behavior/flags for manual review threshold

------------------------------------------------------------
Prompt 06 — Rating Engine (Stateless Service) — Single-card Calc
------------------------------------------------------------
```text
Context:
Add a stateless Rating Engine microservice (initially as a module in the backend monolith) to compute a deterministic powerScore given inputs and a ratingConfig. It must be reproducible with the same inputs.

Goal:
- Implement /v1/rating/calc endpoint (internal) that accepts:
  {
    card: { id, playerStats: {...}, marketValueCents, rarity, conditionEstimatedScore, momentum },
    ratingConfigVersion (optional)
  }
- Implement default rating config inline (weights as per devSpec) stored in DB RatingConfig table; default active config used if none provided.
- Rating steps (deterministic):
  1. Normalize inputs via min-max with clamping based on observed test bounds (configurable).
  2. Apply weights and compute raw score.
  3. Map raw score to 0–1000 scale and round to integer.
  4. Return detailed breakdown: per-factor normalized value and contribution.
- Unit tests:
  - Deterministic test: same inputs -> same outputs
  - Edge cases: missing marketValue -> fallback to median; zero momentum -> handled
- Integration:
  - Wire the rating calc into confirm endpoint: confirm should call rating/calc and store card.powerScore and ratingConfigVersion
- Acceptance criteria:
  - rating/calc returns reproducible output and confirm flow results in stored powerScore

Notes:
- Keep the algorithm explicit and easily testable: show normalization params in response for debugging.
- Provide a small CLI or POST route to run calc for sample cards for debug.
```

Todo checklist:
- [ ] Add RatingConfig model and default config migration/seed
- [ ] Implement rating calc endpoint with deterministic normalization
- [ ] Unit tests for rating determinism and integration with scan confirm
- [ ] Save powerScore + ratingConfigVersion on Card record

------------------------------------------------------------
Prompt 07 — Card API & Collection UI Stubs (Backend + Mobile)
------------------------------------------------------------
```text
Context:
Expose CRUD for user cards and provide minimal mobile screens to display cards and their power breakdowns. This enables users to view created cards and proceed to lineup creation.

Goal (Backend):
- GET /v1/users/{userId}/cards — list cards (pagination)
- GET /v1/cards/{cardId} — card detail with powerBreakdown
- PATCH /v1/cards/{cardId}/metadata — allow user edits to metadata (setName, variant, conditionReported); if edits affect rating, re-enqueue rating job
- Implement basic authorization checks: only owner can edit

Goal (Mobile):
- Implement a minimal React Native screen to:
  - List current user's cards (call GET /v1/users/{userId}/cards)
  - Show card detail screen with image (signed URL) and power score/breakdown
  - Basic navigation between list and detail

Tests:
- Backend unit tests for endpoints
- Mobile: minimal Jest snapshot tests or an E2E smoke test via Detox (optional for now)

Acceptance criteria:
- Backend endpoints functional and tested
- Mobile app can display list and details (mock data acceptable until API available)

Notes:
- Use signed URL generation endpoint or include pre-signed GET URLs in card DTO for images
- For the mobile build, use Expo for speed; images display from dev backend signed URLs
```

Todo checklist:
- [ ] Implement GET /v1/users/{userId}/cards and GET /v1/cards/{cardId}
- [ ] Implement PATCH /v1/cards/{cardId}/metadata with auth checks
- [ ] Mobile screens: Cards list and Card detail (stubbed if necessary)
- [ ] Tests for backend endpoints

------------------------------------------------------------
Prompt 08 — Lineup Model & API (Backend) + Mobile UI Stub
------------------------------------------------------------
```text
Context:
Users must create lineups (mapping 9 positions to card IDs) to play matches.

Goal:
- Prisma Lineup model:
  - id, userId, name, slots jsonb (object mapping positions to cardId), aggregatePowerScore (float), rarityCounts jsonb, createdAt
- Endpoints:
  - POST /v1/lineups — create lineup { name, slots }
  - GET /v1/lineups/{lineupId}
  - GET /v1/users/{userId}/lineups
  - DELETE /v1/lineups/{lineupId}
- Behavior:
  - Validate that the cards in slots belong to user and are not currently locked in disputes
  - Compute aggregatePowerScore = sum of card.powerScore; compute rarityCounts
  - Save lineup
- Mobile:
  - UI stub to select cards (from list) and create a lineup; show computed lineup power

Tests:
- Unit tests for lineup creation validation, aggregate power calculation, and rejection when card not owned.

Acceptance criteria:
- Lineup endpoints pass tests and lineup creation enforces ownership rules
- Mobile can send a lineup creation request and display returned lineup

Notes:
- Positions are flexible; for MVP treat positions as keys 1..9 or strings like "P1".."P9"
```

Todo checklist:
- [ ] Add Lineup model and migration
- [ ] Implement lineup endpoints and validations
- [ ] Mobile lineup creation stub
- [ ] Tests for lineup creation & aggregate scoring

------------------------------------------------------------
Prompt 09 — Matchmaking Enqueue & Redis Queue (Basic)
------------------------------------------------------------
```text
Context:
Implement a simple Redis-backed matchmaking queue and enqueue API. For MVP keep matchmaking simple (match by aggregatePowerScore +/- tolerance).

Goal:
- Implement POST /v1/matchmaking/enqueue
  - Body: { lineupId, matchType ("casual"|"ranked") }
  - Validate lineup ownership
  - Compute userQueueKey = matchType:powerBin (e.g., floor(aggregatePowerScore / 50))
  - Insert entry into Redis sorted set or list with score = timestamp or aggregatePowerScore as appropriate
  - Return queued:true and queuePosition (approximate)
- Implement GET /v1/matchmaking/status/{userId}
  - Returns player's queue status and approximate wait
- Implement a background matchmaker worker process:
  - Periodically scan Redis bins for pairable entries (within tolerance) and if found:
    - Remove both from queue and create a Match record (DB) with lineupA & lineupB and matchSeed
    - Notify both users via Realtime event match.found (use local mock)
- Tests:
  - Unit tests for binning and enqueue logic
  - Integration test using Redis docker container; simulate two users enqueuing and verify match created

Acceptance criteria:
- Enqueue returns valid response and worker can pair two compatible lineups in integration tests
- Redis-based queue works in dev

Notes:
- Keep matching tolerance small (configurable): casual +/-5%, ranked +/-2%
- Implement time-based relaxation in next iteration
```

Todo checklist:
- [ ] Implement enqueue endpoint and Redis queue semantics
- [ ] Worker to pair entries and create Match record
- [ ] Implement matchmaking status endpoint
- [ ] Unit/integration tests using Redis

------------------------------------------------------------
Prompt 10 — Match Engine & Resolve API (Deterministic)
------------------------------------------------------------
```text
Context:
Implement the deterministic Match Engine that resolves two lineups into a winner using the algorithm in the devSpec.

Goal:
- Implement POST /v1/match/resolve (internal) that accepts { matchId } or { lineupA, lineupB, matchSeed } and returns:
  - winner ("A"|"B"|"draw"), scores breakdown, per-position results array, events play-by-play (synthetic)
- Algorithm (MVP simplified):
  - For each slot position, compute a "positionStat" = a weighted sum of playerStats relevant for that position (backend must accept playerStats snapshot in lineup or lookup Player stats)
  - Compare corresponding positions: if diff > threshold award 1 point to winner; tie gives 0.5 each
  - Sum points, apply tiebreakers: aggregateMarketValue, aggregateMomentum, sudden-death using seeded RNG derived from matchSeed
- Determinism:
  - matchSeed must be used for any RNG and must be stored in Match record to allow reproducibility
- Tests:
  - Unit tests validating deterministic resolution with fixed inputs & seed
  - Integration test: create two lineups with seeded card/player stats and call resolve -> consistent result

Acceptance criteria:
- Match resolve yields deterministic, reproducible outcomes with same inputs and seed
- Output includes per-position breakdown

Notes:
- For now, playerStats can be stored on cards as part of provenance (snapshot) to avoid fetching external sports feed; later replace with Player table lookups
```

Todo checklist:
- [ ] Implement match resolve algorithm and endpoint
- [ ] Store matchSeed in Match records and ensure deterministic RNG usage
- [ ] Unit/integration tests for deterministic resolution
- [ ] Provide example payloads and expected results for dev tests

------------------------------------------------------------
Prompt 11 — Realtime Notifications (Pusher Mock) & Client Hooks
------------------------------------------------------------
```text
Context:
Implement a simple Realtime notification abstraction. For dev, use a local in-memory broadcaster with WebSocket or Server-Sent Events (SSE) for clients.

Goal:
- Create a RealtimeService with methods: publishToUser(userId, eventName, payload), subscribe (for local integration tests)
- Implement Pusher-compatible event payloads for:
  - match.found
  - match.start
  - match.result
- Integrate RealtimeService into Matchmaker to publish match.found when a match is created
- Implement a simple WebSocket server endpoint /ws for mobile dev clients to connect and receive events (or provide SSE endpoints)
- Mobile:
  - Hook to open WebSocket connection, listen for match.found and display a "match found" modal

Tests:
- Integration test: worker creates match and RealtimeService published event; client subscribed receives message

Acceptance criteria:
- Realtime mock works in dev and mobile can display match.found
- Code is structured to swap out for Pusher/Ably in production easily

Notes:
- Keep payload small. Include matchId, opponent summary, lineupPower
```

Todo checklist:
- [ ] Implement RealtimeService mock with WebSocket/SSE
- [ ] Integrate publish on match creation
- [ ] Mobile client listens for events and shows match.found
- [ ] Integration test for event delivery

------------------------------------------------------------
Prompt 12 — Match Play Flow & Result Display (Mobile + Backend)
------------------------------------------------------------
```text
Context:
Complete the user-facing 1v1 flow: user enqueues, receives match.found, match.start is sent, match.resolve runs, and match.result is shown.

Goal:
- Backend:
  - When two users matched, create Match record with state "found", send match.found to both
  - After a short countdown (simulate immediate for MVP), call match.resolve and update Match record with result and events, send match.result to both
- Mobile:
  - On receiving match.found show opponent summary and "Accept" button (auto-accept for MVP)
  - Show countdown, then subscribe to match.result and render play-by-play and final winner
- Tests:
  - Integration test simulating full flow (two user clients) that verifies events sequence and final match result is displayed

Acceptance criteria:
- End-to-end 1v1 match flow works in local dev environment with two clients
- match.result event contains full breakdown and deterministically reproducible info

Notes:
- For MVP, keep play-by-play synthetic (derive from per-position results)
```

Todo checklist:
- [ ] Implement match lifecycle: found -> start -> resolve -> result
- [ ] Mobile UI to accept and show results
- [ ] Integration test for full flow (two clients)

------------------------------------------------------------
Prompt 13 — Admin Endpoints: Ingestion Queue & Rating Config
------------------------------------------------------------
```text
Context:
Admins must review ingestion jobs and manage rating weights.

Goal:
- Add Admin role logic (simple role flag on User)
- Endpoints:
  - GET /admin/ingestion/queue — list pending ingestion jobs (paging, filters)
  - POST /admin/ingestion/{jobId}/approve -> mark job and optionally finalize to create Card or mark verified
  - POST /admin/ingestion/{jobId}/reject -> mark flagged with reason
  - GET /admin/rating-config -> list configs
  - POST /admin/rating-config -> create new config (weights json)
  - POST /admin/rating-config/{id}/activate -> set active config id and enqueue batch recalculation job (insert DB job record)
- Tests:
  - Unit tests for admin endpoints and RBAC

Acceptance criteria:
- Admin endpoints protected and functional
- RatingConfig activation enqueues recalculation job record

Notes:
- Recalculation job worker will be implemented later; for MVP store job record and allow manual processing via worker script
```

Todo checklist:
- [ ] Add admin role checks and endpoints
- [ ] Implement rating config create & activate
- [ ] Admin ingestion queue endpoints
- [ ] Tests for admin RBAC and endpoints

------------------------------------------------------------
Prompt 14 — Anti-fraud: pHash Duplicate Detection & Flagging
------------------------------------------------------------
```text
Context:
Implement duplicate detection via pHash and provide a user flag endpoint. Low-risk rules only for MVP.

Goal:
- Implement a pHash index on Card table and a helper function to compute Hamming distance between hashes
- On confirm/create card:
  - Check recent cards for similar phash distance <= threshold (e.g., <= 10 bits) and if found, mark new card ingestionStatus "flagged" and create Dispute record with reason "possible duplicate"
  - Notify user the card is flagged and needs review
- Endpoint POST /v1/cards/{cardId}/flag — create Dispute record with user-supplied reason
- Admin endpoints to list disputes already added in Prompt 13
- Tests:
  - Unit tests for phash similarity detection and automatic flagging
  - Integration test: confirm two identical uploads create one flagged

Acceptance criteria:
- Duplicate detection runs and flags near-duplicates
- Flag endpoint creates Dispute record

Notes:
- Keep threshold configurable via env var
```

Todo checklist:
- [ ] Add phash index and Hamming distance helper
- [ ] Auto-flag similar pHash on card creation
- [ ] Implement user flag endpoint
- [ ] Tests for flagging logic

------------------------------------------------------------
Prompt 15 — Batch Jobs: Rating Recalculation Worker
------------------------------------------------------------
```text
Context:
When rating config changes or price data updates, we need a worker that recalculates scores in batch.

Goal:
- Implement a worker that:
  - Reads a job record (recalc job) listing cardIds or a filter (e.g., all cards)
  - For each card: fetch current inputs, call rating engine calc, write new powerScore with ratingConfigVersion (in a DB transaction), and write AuditLog entry
  - Use SQS-like semantics simulated with a DB jobs table and a background worker process (cron or manual worker script)
- Endpoint for admin to enqueue recalculation job (already placed in Prompt 13)
- Tests:
  - Unit test for worker logic with small sample of cards and a mocked rating calc
  - Integration test running worker against local DB verifying scores updated

Acceptance criteria:
- Worker recalculates and persists powerScore for target cards and logs audit entries
- Safe idempotency: re-running job should not create duplicate audit logs for same change if inputs unchanged (but can append logs that explicit re-run occurred)

Notes:
- Keep worker simple for MVP; paginated processing for large datasets is out of scope for immediate tests but include comments and a TODO
```

Todo checklist:
- [ ] Implement recalculation worker and DB job model
- [ ] Integrate with admin activate rating-config action
- [ ] Tests for recalculation worker behavior
- [ ] Document how to run worker manually in README

------------------------------------------------------------
Prompt 16 — CI & Local E2E Smoke Tests
------------------------------------------------------------
```text
Context:
Add CI pipeline skeleton to run tests and a minimal local e2e smoke test that runs core flows: upload -> process -> confirm -> create lineup -> enqueue -> match -> resolve.

Goal:
- GitHub Actions workflow:
  - Step 1: Checkout, install, lint
  - Step 2: Start services via docker-compose (Postgres, Redis, MinIO/localstack) using services container action
  - Step 3: Run backend tests (unit + integration)
  - Step 4: Optionally run a smoke e2e node script that:
    - Spins up backend in test mode
    - Uses Supertest to run the core flow and asserts expected responses at each stage
- Add a local script dev:e2e that runs the same smoke tests locally

Acceptance criteria:
- CI completes unit and integration tests
- Smoke e2e script runs locally given docker-compose up

Notes:
- Keep e2e minimal and deterministic: use mock CV adapter so CV outputs predictable OCR strings
```

Todo checklist:
- [ ] Add GitHub Actions workflow for tests
- [ ] Add smoke e2e script and tests
- [ ] Document run commands for CI and local smoke test

------------------------------------------------------------
Prompt 17 — Mobile: Complete minimal user flow & e2e
------------------------------------------------------------
```text
Context:
The mobile app should allow a user to:
- Sign up / login (dev auth)
- Capture image (or pick from file)
- Upload via presigned URL
- Poll scan status
- Confirm scan -> create card
- Create lineup and enqueue match
- Show match.found and match.result

Goal:
- Implement RN screens (Expo) for the above flow with network code using provided backend endpoints
- Implement WebSocket client to receive realtime events
- Add Detox or a simpler Appium/Cypress-based e2e script that simulates the flow using test accounts and verifies match result displayed
- Keep UI minimal and functional, focusing on flow correctness

Acceptance criteria:
- Mobile app can run in Expo dev mode and complete the flow in a local environment against backend
- e2e run verifies major state transitions

Notes:
- For time-saving, use image selection from camera roll for test images
- Use emulator/simulator for e2e

Manual verification:
- Run backend + docker-compose + mobile app locally; perform manual test flow
```

Todo checklist:
- [ ] Implement mobile screens for full user flow
- [ ] Add WebSocket event handling
- [ ] Implement mobile e2e script (Detox or equivalent)
- [ ] Document setup in mobile/README

------------------------------------------------------------
Prompt 18 — Hardening & Monitoring Baseline (Dev SLOs)
------------------------------------------------------------
```text
Context:
Before beta, add some basic monitoring, logging, and resilience features.

Goal:
- Add structured logging with request IDs
- Add basic metrics endpoints:
  - GET /health returns service + dependency health
  - /metrics exposes simple Prometheus-format counters for ingestion.jobs_processed, matches_resolved
- Implement retry/backoff wrapper for external calls (S3/CV)
- Add DLQ-like behavior for failed ingestion processing (persist failure after N attempts)
- Add Sentry integration stub (DSN env var)
- Add recommended Prometheus + Grafana docker-compose for dev (optional)

Acceptance criteria:
- Structured logs with request IDs exist
- /metrics returns counters that increment in integration tests
- Doc runbook entries for failure handling included

Notes:
- Production-grade SLOs and alerting will be configured separately, but include basic scripts to emit metrics for demo
```

Todo checklist:
- [ ] Add structured logging & request IDs
- [ ] Implement /metrics and increment in ingestion & match resolution flows
- [ ] Add retry/backoff helper for external calls
- [ ] Document monitoring/dev runbook

------------------------------------------------------------
Final verification & Delivery
------------------------------------------------------------
```text
Context:
Before declaring MVP complete, run the full acceptance checklist and smoke tests.

Goal:
- Run the full smoke e2e locally: upload -> process -> confirm -> create lineup -> enqueue -> match -> resolve (both automated tests and manual validation)
- Confirm admin endpoints: view ingestion queue, create & activate rating config, enqueue recalculation job
- Confirm anti-fraud flows: duplicate detection on identical image upload
- Ensure tests pass in CI

Deliverables:
- All endpoints implemented and tested
- Mobile flow works in Expo
- README updated with developer setup, run instructions, and operator runbooks

Acceptance criteria (all must pass):
- E2E smoke test passes
- Unit + integration test coverage for critical flows (>60% on key services)
- Reproducible rating engine results for identical inputs
- Match engine deterministic with same seed

Manual checklist:
- [ ] Run "yarn dev:backend" and ensure health check passes
- [ ] Start docker-compose and run "yarn dev:e2e" smoke script
- [ ] Use the mobile app to upload and confirm a card; create lineup and play against another test account
- [ ] Admin: create rating config & activate; run recalculation worker manually on a small sample and verify changes
```

Todo checklist:
- [ ] Run full e2e smoke tests locally and resolve any failures
- [ ] Confirm admin flows and recalculation worker operate
- [ ] Validate duplicate detection manual case
- [ ] Merge to main branch and tag MVP release

------------------------------------------------------------
Appendix — Developer Hints & Example Payloads
------------------------------------------------------------
Provide the LLM with these example payloads when executing prompts that require them:

1) POST /v1/scan/upload request body:
{
  "frontFileName": "2026_topps_ronaldo_front.jpg",
  "backFileName": "2026_topps_ronaldo_back.jpg"
}

2) Processed OCR mocked output:
{
  "ocrText": "MIKE ROMERO 2018 TOPPS",
  "candidateMatches": [
    { "playerId":"player-uuid-123", "playerName":"Mike Romero", "year":2018, "setName":"Topps", "confidence":0.92 }
  ]
}

3) POST /v1/scan/confirm/{scanJobId} body:
{
  "playerId":"player-uuid-123",
  "year":2018,
  "setName":"Topps",
  "variant":"Base",
  "conditionReported":"EX",
  "confirm":true
}

4) POST /v1/matchmaking/enqueue:
{ "lineupId":"lineup-uuid-1", "matchType":"casual" }

5) Expected match.found event:
{
  "matchId":"uuid",
  "opponent":{ "userId":"uuid", "displayName":"CollectorA", "lineupPower": 742 },
  "matchType":"casual"
}

------------------------------------------------------------
Notes on running LLM prompts
------------------------------------------------------------
- For each prompt above, pass the relevant section of devSpec and the necessary repo context (file lists, current commits). If the code-generation LLM doesn't have access to the repo, ask it to output a patch/patchset (diff or file tree) and necessary tests so a developer can apply them.
- Always ask the LLM to provide unit tests and integration tests. If external services are referenced (S3, Google Vision), require mock adapters and environment-switchable configs.
- If generated code includes native dependencies (image processing libs), request pure-Node fallback options for dev to avoid CI build complexity.

------------------------------------------------------------
Closing
------------------------------------------------------------
This Prompt Plan lays out a deterministic, test-driven path from repository skeleton to a working MVP for the Sports Trading Card Battle App. Each prompt is small, verifiable, and integrates into the prior steps. Execute them in order; use the checkboxes as progress indicators. If you want, I can now convert any specific prompt into a runnable LLM prompt with explicit repo-file patch format and sample unit test scaffolding — tell me which prompt to expand into code-level instructions first.
