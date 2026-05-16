Developer Specification — SlabClash
=================================

Version: 1.2  
Date: 2026-04-29

Purpose
-------
This document provides a technical specification for the SlabClash MVP. It consolidates architecture, data models, APIs, and implementation details for engineers.

Assumptions
-----------
- **Sport**: Baseball (initial focus).
- **Backend**: NestJS, Prisma (PostgreSQL).
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
- `conditionReported`: Enum (mint, near_mint, excellent, good, fair, poor)
- `conditionEstimatedScore`: Int (Optional)
- `playerStats`: Float (Optional)
- `marketValueCents`: Int (Optional)
- `rarity`: Enum (common, uncommon, rare, ultra_rare, secret_rare)
- `powerScore`: Int (Computed 0-1000)
- `ratingConfigVersion`: String (Optional)
- `provenance`: JSON (Audit trail of ingestion)
- `imageFrontKey`: String
- `imageBackKey`: String (Optional)
- `phash`: String (Perceptual hash)
- `ingestionStatus`: Enum (uploaded, processing, awaiting_user_confirm, verified, flagged)

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
- `weights`: JSON (e.g., `{ playerStats: 0.4, rarity: 0.2, marketValue: 0.2, condition: 0.1, momentum: 0.1 }`)
- `normalizationBounds`: JSON (Min/Max values for each factor)

APIs
----

All private endpoints require `Authorization: Bearer <JWT>`.

### Auth
- `POST /auth/signup`: `{ username, email, password }`
- `POST /auth/login`: `{ email, password }` -> `{ access_token }`

### Ingestion Flow
1. **Upload**: `POST /v1/scan/upload`
   - Request: `{ frontFileName: string, backFileName?: string }`
   - Response: `{ scanJobId, uploadUrlFront, uploadUrlBack }`
2. **Process**: `POST /v1/scan/process/:scanJobId`
   - Triggers OCR, pHash, and candidate matching.
3. **Status/Review**: `GET /v1/scan/status/:scanJobId`
   - Response includes `candidateMatches` (list of potential players/sets identified).
4. **Confirm**: `POST /v1/scan/confirm/:scanJobId`
   - Request: `{ playerId, year, setName, variant?, conditionReported, confirm: true, playerStats?, marketValueCents? }`
   - Response: `{ cardId, powerScore }`

### Rating Engine
- `POST /v1/rating/calc` (Stateless calculation)
  - Request Body:
    ```json
    {
      "card": {
        "id": "uuid",
        "playerStats": 85.5,
        "marketValueCents": 5000,
        "rarity": "rare",
        "conditionEstimatedScore": 9,
        "momentum": 0.5
      },
      "ratingConfigVersion": "v1"
    }
    ```
  - Response Body:
    ```json
    {
      "powerScore": 742,
      "ratingConfigVersion": "v1",
      "breakdown": [
        {
          "factor": "playerStats",
          "inputValue": 85.5,
          "normalizedValue": 0.85,
          "weight": 0.4,
          "contribution": 340,
          "normalizationBounds": { "min": 0, "max": 100 }
        },
        ...
      ]
    }
    ```

### Collection Management
- `GET /v1/users/:userId/cards`
  - Query Parameters:
    - `page`: default 1
    - `limit`: default 20, max 100
    - `rarity`: Filter by enum
    - `setName`: Partial case-insensitive match
    - `year`: Exact match
    - `playerId`: Exact match
  - Response:
    ```json
    {
      "data": [ ...cards ],
      "pagination": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
    }
    ```
- `GET /v1/cards/:cardId`
  - Returns full `Card` model plus:
    - `imageFrontUrl`: Presigned S3 URL
    - `imageBackUrl`: Presigned S3 URL
    - `powerBreakdown`: Detailed rating breakdown (same structure as `rating/calc` response)
- `PATCH /v1/cards/:cardId/metadata`
  - Request: `{ setName?, variant?, conditionReported? }`
  - Side Effect: Changing `conditionReported` triggers an asynchronous rating recalculation.

Rating Engine
-------------
Goal: Produce a stable, reproducible `powerScore` (0-1000).

**Factors**:
1. **Player Stats (40%)**: Normalized performance metrics.
2. **Market Value (20%)**: Recent pricing data.
3. **Rarity (20%)**: Card scarcity (mapped numerically: common=1, uncommon=2, rare=3, ultra_rare=4, secret_rare=5).
4. **Condition (10%)**: Reported or estimated condition.
5. **Momentum (10%)**: Recent performance trends.

**Normalization**:
`normalized = (value - min) / (max - min)`, clipped to [0, 1].

Implementation Status
---------------------
- [x] Sprint 1: Auth and S3 Uploads.
- [x] Sprint 2: OCR and Candidate Matching.
- [x] Sprint 3: Card Confirmation and Rating Engine (Stateless).
- [x] Sprint 4: Collection Management (Basic).
- [x] Sprint 5: Lineups and Deck Building.
- [x] Sprint 6: Matchmaking and Match Engine.
- [x] Sprint 7: Anti-fraud and Admin Dashboard.
