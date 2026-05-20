# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Slabclash is a sports trading card battle app built as a monorepo with three packages:
- **backend**: NestJS API with Prisma ORM, JWT auth, S3 storage, and OCR processing
- **mobile**: React Native app (currently a stub)
- **shared**: Shared TypeScript types consumed by backend via `@slabclash/shared`

## Common Commands

```bash
yarn install                 # Install all workspace dependencies
yarn dev:backend             # Start NestJS in watch mode
yarn db:up                   # Start Postgres + Redis via Docker Compose
yarn prisma:migrate:dev      # Run Prisma migrations (from root)
yarn test                    # Run all tests across workspaces
yarn lint                    # Run ESLint across all packages
yarn format                  # Format code with Prettier
```

Run a single backend test:
```bash
cd backend && npx jest --testPathPattern="auth"
```

## Architecture

Backend follows standard NestJS module structure. Each feature module (auth, ingestion, health, prisma, storage) has its own controller, service, module, and DTOs (where applicable).

**Key modules:**
- `auth/` — JWT authentication with Passport, bcrypt password hashing, signup/login flows
- `ingestion/` — Card scanning pipeline: presigned S3 uploads → Google Vision OCR → perceptual hashing (imghash) → fuzzy matching (fuse.js) via `MatchCandidateService`
  - `POST /v1/scan/confirm/:scanJobId` — Confirm scan metadata, create Card record, trigger rating
- `card/` — Card collection management with GET `/v1/cards/:cardId` endpoint
- `rating/` — Rating service with `scheduleRating()` for queued jobs and `calculatePowerScore()` stub
- `ingestion/cv/` — `CvService` wraps OCR logic, `GoogleVisionAdapter` interfaces with Google Cloud Vision API
- `storage/` — S3 service for presigned URL generation (AWS SDK)
- `prisma/` — Prisma service and module wrapping the client
- `health/` — Health check endpoint

**Data models** (see `backend/prisma/schema.prisma`):
- `User` — id, username, email, passwordHash, reputationScore, inAppCurrencyBalance
- `Card` — id, userId, playerId, year, setName, variant, conditionReported, rarity, powerScore, imageFrontKey, imageBackKey, phash, ingestionStatus
- `Player` — id, name (referenced by Card)
- `CardIngestionJob` — card scan job with status enum (`uploaded → processing → awaiting_user_confirm → verified/flagged`), stores OCR text, phash, and candidate match JSON
- `RatingJob` — id, cardId, status (for queued rating recalculations)

**Shared types** (`shared/src/index.ts`): `User` and `HealthStatus` interfaces, built and consumed via the `@slabclash/shared` package name.

## Environment

Requires `.env` file with `DATABASE_URL`, JWT secret, AWS S3 credentials, and Google Cloud credentials for Vision API. Copy from `.env.example`.

## Manual Review Thresholds

Cards automatically flagged for manual review based on condition:
- `poor` or `fair` → `ingestionStatus: "flagged"`
- `near_mint`, `excellent`, `good`, `mint` → `ingestionStatus: "verified"`

## Tech Details

- TypeScript with decorators enabled (experimentalDecorators, emitDecoratorMetadata)
- Jest with ts-jest for testing, test files match `*.spec.ts`
- Prisma client pinned to 5.22.0 (both runtime and dev dependency must match)
- Backend uses `@nestjs/cli` for generation: `cd backend && nest generate service foo`
- Run single test: `cd backend && npx jest --testPathPatterns="ingestion.service.spec"`
