# SlabClash Backend

This is the NestJS backend for the SlabClash application.

## Prerequisites

- Node.js (>= 20)
- Docker
- Yarn (v4)

## Setup

```bash
# Start required databases (PostgreSQL, Redis, MinIO)
yarn db:up

# Install dependencies (from the root workspace)
yarn install

# Run database migrations
yarn prisma:migrate:dev
```

## Running the app

```bash
# development
yarn dev:backend

# watch mode (from within backend)
yarn start:dev
```

## Testing

```bash
# unit tests (from within backend)
yarn test

# e2e tests
yarn test:e2e

# test coverage
yarn test:cov
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `CV_PROVIDER`: Set to `google` to use Google Vision API, or `mock` (default) for local development.
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: (Optional) Inline JSON credentials for Google Cloud.
- `S3_ENDPOINT`: Endpoint for S3-compatible storage (e.g., `http://localhost:9100` for local MinIO).
- `JWT_SECRET`: Secret for signing JWT tokens.

## Manual Verification (Scanning & Rating)

1. **Upload**: Get presigned URLs and a `scanJobId`.
   ```bash
   curl -X POST http://localhost:3000/v1/scan/upload \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"frontFileName":"card.png"}'
   ```
2. **PUT Image**: Use the `uploadUrlFront` from the previous step.
   ```bash
   curl -X PUT <UPLOAD_URL> --upload-file /path/to/image.png -H "Content-Type: image/png"
   ```
3. **Process**: Trigger OCR and pHash calculation.
   ```bash
   curl -X POST http://localhost:3000/v1/scan/process/<scanJobId> \
     -H "Authorization: Bearer <TOKEN>"
   ```
4. **Status**: Check results and candidates.
   ```bash
   curl -X GET http://localhost:3000/v1/scan/status/<scanJobId> \
     -H "Authorization: Bearer <TOKEN>"
   ```
5. **Confirm**: Confirm card details and create Card record with power score.
   ```bash
   curl -X POST http://localhost:3000/v1/scan/confirm/<scanJobId> \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"playerId":"<PLAYER_ID>", "year":2023, "setName":"Topps", "conditionReported":"near_mint", "confirm":true}'
   ```
6. **Calculate Rating**: Test the rating engine directly.
   ```bash
   curl -X POST http://localhost:3000/v1/rating/calc \
     -H "Content-Type: application/json" \
     -d '{"card": {"id":"123", "playerStats":80, "rarity":"rare", "conditionEstimatedScore":90, "momentum":5}}'
   ```
