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

## Manual Verification (Auth)

1. Start the DB and Backend: `yarn db:up` and `yarn dev:backend`
2. Sign up: 
   ```bash
   curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d '{"username":"testuser", "email":"test@test.com", "password":"password123"}'
   ```
3. Log in:
   ```bash
   curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com", "password":"password123"}'
   ```
   (This returns an `accessToken` you can use as a Bearer token in the `Authorization` header).
