# SlabClash Backend

This is the NestJS backend for the SlabClash application.

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

# watch mode (from within packages/backend)
yarn start:dev
```

## Testing

```bash
# unit tests (from within packages/backend)
yarn test

# e2e tests
yarn test:e2e

# test coverage
yarn test:cov
```

## Environment Variables

- `CV_PROVIDER`: Set to `google` to use Google Vision API, or `mock` (default) for local development.
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: (Optional) Inline JSON credentials for Google Cloud.
- `S3_ENDPOINT`: Endpoint for S3-compatible storage (e.g., `http://localhost:9100` for local MinIO).

## Manual Verification (Scanning & OCR)

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
4. **Status**: Check results.
   ```bash
   curl -X GET http://localhost:3000/v1/scan/status/<scanJobId> \
     -H "Authorization: Bearer <TOKEN>"
   ```
