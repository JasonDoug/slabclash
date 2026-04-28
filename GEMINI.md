# GEMINI.md - SlabClash Project Context

## Project Overview
**SlabClash** is a mobile-first sports trading card battle application. It allows collectors to scan physical cards, convert them into digital assets with data-driven "power" ratings, and compete in head-to-head battles.

### Key Technologies
- **Monorepo Management:** Yarn Workspaces
- **Backend:** NestJS (Node.js/TypeScript)
- **Database:** PostgreSQL via Prisma ORM
- **Mobile:** React Native (TypeScript)
- **Infrastructure:** Docker Compose (local DB), GitHub Actions (CI)
- **Authentication:** JWT-based authentication with Passport and bcrypt

### Architecture
The project follows a monorepo structure under the `packages/` directory:
- `backend/`: NestJS server handling business logic, authentication, and database interactions.
- `mobile/`: React Native mobile application.
- `shared/`: Common types, utilities, and constants shared across packages.

The system is designed with a clear separation of concerns for scanning/ingestion, rating calculations, and match-making, as outlined in `DEV_SPEC.md`.

---

## Building and Running

### Prerequisites
- Node.js (v20+ recommended)
- Yarn (v4+ configured via `.yarnrc.yml`)
- Docker (for PostgreSQL)

### Setup
1.  **Install dependencies:**
    ```bash
    yarn install
    ```
2.  **Start the database:**
    ```bash
    yarn db:up
    ```
3.  **Run migrations:**
    ```bash
    yarn prisma:migrate:dev
    ```

### Development Commands
- **Start Backend (Watch Mode):** `yarn dev:backend`
- **Stop Database:** `yarn db:down`
- **Run All Tests:** `yarn test`
- **Linting:** `yarn lint`
- **Formatting:** `yarn format`

---

## Development Conventions

### Coding Standards
- **Language:** TypeScript for all packages.
- **Linting:** ESLint with Prettier integration.
- **Prisma:** Use Prisma Client for all database operations. Ensure `schema.prisma` is updated and migrations are generated for schema changes.
- **Module Structure:** Backend follows standard NestJS modular patterns (`module`, `controller`, `service`, `dto`).

### Testing Practices
- **Unit Testing:** Use Jest for unit tests. Files should follow the `*.spec.ts` naming convention.
- **E2E Testing:** Located in `packages/backend/test/` using Supertest and Jest.
- **Verification:** Always run `yarn test` and `yarn lint` before pushing changes.

### Contribution Workflow
1.  **Reference Specs:** Consult `ONE_PAGER.md` for product vision and `DEV_SPEC.md` for technical requirements before implementing new features.
2.  **Environment Variables:** Copy `.env.example` to `.env` at the root and in `packages/backend/` and fill in necessary secrets.
3.  **Surgical Updates:** When modifying existing logic, ensure tests are updated or added to cover the changes.
