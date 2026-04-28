# Slabclash Monorepo

A sports trading card battle app built with NestJS, React Native, and Prisma.

## Project Structure

- `packages/backend`: NestJS application with Prisma.
- `packages/mobile`: React Native mobile application stub.
- `packages/shared`: Shared TypeScript types and utilities.

## Prerequisites

- Node.js (>= 18)
- Docker & Docker Compose
- Yarn (installed via `corepack enable yarn`)

## Getting Started

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Start infrastructure (Postgres & Redis):**
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

- **GET /health**: Check backend and database connectivity.

## Development Commands

- `yarn install`: Install all dependencies.
- `yarn dev:backend`: Start NestJS in watch mode.
- `yarn db:up`: Start Docker Compose services.
- `yarn prisma:migrate:dev`: Run Prisma migrations.
- `yarn test`: Run all tests in the monorepo.
- `yarn lint`: Run ESLint across all packages.
- `yarn format`: Format code with Prettier.
