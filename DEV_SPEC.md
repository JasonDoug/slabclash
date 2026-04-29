Developer Specification — SlabClash
=================================

Version: 1.1  
Date: 2026-04-29

Purpose
-------
This document provides a technical specification for the SlabClash MVP. It consolidates architecture, data models, APIs, and implementation details for engineers.

Assumptions
-----------
- **Sport**: Baseball (initial focus).
- **Backend**: NestJS, Prisma (PostgreSQL), Redis.
- **Mobile**: React Native.
- **Infrastructure**: Docker Compose (local), AWS/MinIO (S3-compatible storage).
- **CV/OCR**: Google Cloud Vision for OCR, `imghash` for pHash.
- **Match Engine**: Deterministic stat-based comparison.

High-level Architecture
-----------------------
- **Mobile Client**: React Native app for scanning and battling.
- **Backend (NestJS)**:
  - **AuthModule**: JWT-based authentication.
  - **IngestionModule**: Handles card scanning, OCR, pHash, and metadata confirmation.
  - **RatingModule**: Computes power scores (0-1000) based on versioned configurations.
  - **CardModule**: Manages user collections and card details.
  - **Storage**: S3-compatible service for card images.

Data Models (Prisma)
--------------------

### User
- `id`: UUID
- `username`: String (Unique)
- `email`: String (Unique)
- `passwordHash`: String
- `reputationScore`: Int (Default 0)
- `inAppCurrencyBalance`: Int (Default 1000)

### Card
- `id`: UUID
- `userId`: FK -> User
- `playerId`: FK -> Player
- `year`: Int
- `setName`: String
- `variant`: String (Optional)
- `serialNumber`: String (Optional)
- `conditionReported`: Enum (Mint, Near Mint, Excellent, Good, Fair, Poor)
- `conditionEstimatedScore`: Int (Optional)
- `playerStats`: Float (Optional)
- `marketValueCents`: Int (Optional)
- `rarity`: Enum (Common, Uncommon, Rare, Ultra Rare, Secret Rare)
- `powerScore`: Int (Computed 0-1000)
- `ratingConfigVersion`: String (Optional)
- `provenance`: JSON (Audit trail of ingestion)
- `imageFrontKey`: String
- `imageBackKey`: String (Optional)
- `phash`: String (Perceptual hash)
- `ingestionStatus`: Enum (Uploaded, Processing, Awaiting Confirm, Verified, Flagged)

### CardIngestionJob
- `id`: UUID
- `userId`: FK -> User
- `imageFrontKey`: String
- `imageBackKey`: String
- `status`: IngestionStatus
- `ocrText`: String (OCR output)
- `phash`: String
- `candidateMatches`: JSON (Ranked matches from reference data)

### RatingConfig
- `id`: UUID
- `version`: String (Unique)
- `isActive`: Boolean
- `weights`: JSON (e.g., `{ playerStats: 0.4, ... }`)
- `normalizationBounds`: JSON (Min/Max values for each factor)

APIs
----

### Auth
- `POST /auth/signup`: { username, email, password }
- `POST /auth/login`: { email, password } -> { accessToken }

### Ingestion
- `POST /v1/scan/upload`: { frontFileName, backFileName } -> { scanJobId, uploadUrlFront, uploadUrlBack }
- `POST /v1/scan/process/:scanJobId`: Triggers OCR and candidate matching.
- `GET /v1/scan/status/:scanJobId`: Returns job status and candidate list.
- `POST /v1/scan/confirm/:scanJobId`: { playerId, year, setName, conditionReported, confirm: true } -> { cardId, powerScore }

### Rating
- `POST /v1/rating/calc`: { card: { playerStats, rarity, ... }, ratingConfigVersion? } -> { powerScore, breakdown }

### Collection
- `GET /v1/cards/:cardId`: Returns card details and power score.

Rating Engine
-------------
Goal: Produce a stable, reproducible `powerScore` (0-1000).

**Factors**:
1. **Player Stats (40%)**: Normalized performance metrics.
2. **Market Value (20%)**: Recent pricing data.
3. **Rarity (20%)**: Card scarcity (mapped numerically 1-5).
4. **Condition (10%)**: Reported or estimated condition.
5. **Momentum (10%)**: Recent performance trends.

**Normalization**: 
`normalized = (value - min) / (max - min)`, clipped to [0, 1].

Implementation Status
---------------------
- [x] Sprint 1: Auth and S3 Uploads.
- [x] Sprint 2: OCR and Candidate Matching.
- [x] Sprint 3: Card Confirmation and Rating Engine (Stateless).
- [ ] Sprint 4: Collection Management and Lineups.
- [ ] Sprint 5: Matchmaking and Match Engine.
- [ ] Sprint 6: Anti-fraud and Admin Dashboard.
