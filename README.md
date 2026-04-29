# Slabclash Monorepo

A sports trading card battle app built with NestJS, React Native, and Prisma.

## Project Structure

- `packages/backend`: NestJS application with Prisma.
- `packages/mobile`: React Native mobile application stub.
- `packages/shared`: Shared TypeScript types and utilities.

## Prerequisites

- Node.js (>= 20)
- Docker & Docker Compose
- Yarn (v4+ configured via `.yarnrc.yml`)

## Getting Started

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Start infrastructure (Postgres, Redis, MinIO):**
   ```bash
   yarn db:up
   ```

3. **Set up database:**
   ```bash
   cp .env.example .env
   yarn prisma:migrate:dev
   ```

4. **Run the backend:**
   ```bash
   yarn dev:backend
   ```

5. **Run tests:**
   ```bash
   yarn test
   ```

## API Endpoints

### Auth
- **POST /auth/signup**: Create account (username, email, password)
- **POST /auth/login**: Login and receive JWT token

### Scan & Ingestion
- **POST /v1/scan/upload**: Get presigned S3 URLs for front/back card images
- **POST /v1/scan/process/:scanJobId**: Process uploaded images (OCR + pHash + candidate matching)
- **GET /v1/scan/status/:scanJobId**: Check scan job status and view candidates
- **POST /v1/scan/confirm/:scanJobId**: Confirm scan metadata and create Card record

### Rating Engine
- **POST /v1/rating/calc**: Calculate power score for a card given its attributes and a rating configuration.

### Cards & Collection
- **GET /v1/cards/:cardId**: View card details with power score and provenance

### Admin (Planned)
- **GET /admin/ingestion/queue**: List pending ingestion jobs
- **POST /admin/ingestion/:jobId/approve**: Approve ingestion job
- **POST /admin/ingestion/:jobId/reject**: Reject ingestion job

## Data Models

Key Prisma models (see `packages/backend/prisma/schema.prisma`):
- **User**: id, username, email, passwordHash, reputationScore, inAppCurrencyBalance
- **Card**: id, userId, playerId, year, setName, variant, serialNumber, conditionReported, conditionEstimatedScore, playerStats, marketValueCents, rarity, powerScore, ratingConfigVersion, imageFrontKey, imageBackKey, phash, ingestionStatus
- **Player**: id, name (referenced by Card)
- **CardIngestionJob**: id, userId, imageFrontKey, imageBackKey, status, ocrText, phash, candidateMatches
- **RatingJob**: id, cardId, status (for queued rating recalculations)
- **RatingConfig**: id, version, isActive, weights, normalizationBounds

## Manual Review Thresholds

Cards are automatically flagged for manual review based on condition:
- **poor** or **fair** condition → `ingestionStatus: "flagged"`
- **near_mint**, **excellent**, **good**, **mint** → `ingestionStatus: "verified"` (auto-approved)

## Development Commands

- `yarn install`: Install all dependencies.
- `yarn dev:backend`: Start NestJS in watch mode.
- `yarn db:up`: Start Docker Compose services.
- `yarn prisma:migrate:dev`: Run Prisma migrations.
- `yarn test`: Run all tests in the monorepo.
- `yarn lint`: Run ESLint across all packages.
- `yarn format`: Format code with Prettier.
