# Slabclash Web Front‑End (MVP)

## Goal
Create a **single‑page React web application** that implements the full Slabclash game experience and seamlessly connects to the existing NestJS backend. The UI should be polished, responsive, and ready for production (TypeScript, React‑Router, React‑Query or TanStack Query for data fetching, and a UI kit such as **shadcn/ui** or **Material‑UI**).

## Core Requirements  

| Feature | Backend Endpoint(s) | UI Page / Component | Important Details |
|---------|--------------------|---------------------|-------------------|
| **Authentication** | `POST /v1/auth/signup` (SignupDto) <br/> `POST /v1/auth/login` (LoginDto) | `AuthPage` with **Sign‑Up** and **Login** tabs | Store JWT in **HttpOnly** cookie or localStorage (explain security trade‑off). After login, set global auth state (React Context). |
| **Upload Card Images** (S3 pre‑signed URLs) | `POST /v1/scan/upload` (CreateUploadUrlsDto) → returns `{ scanJobId, uploadUrlFront, uploadUrlBack }` | `ScanUploadModal` (file picker) | Use `fetch` PUT to upload the files to the returned URLs, then call **Process**. |
| **Process Scan Job** | `POST /v1/scan/process/:scanJobId` | Called automatically after uploads | Show spinner until `GET /v1/scan/status/:scanJobId` returns `status: awaiting_user_confirm`. |
| **Confirm Scan / Create Card** | `POST /v1/scan/confirm/:scanJobId` (ConfirmScanDto) → returns `{ cardId, powerScore }` | `ScanConfirmDialog` showing candidate matches (from status call) and fields: player, year, set, variant, condition, optional stats/value | After confirmation, navigate to **Card Detail** page. |
| **View Card Detail** | `GET /v1/cards/:cardId` | `CardDetailPage` | Show card image (presigned URLs), power breakdown (match rating response), metadata, button to **Edit Metadata**. |
| **Edit Card Metadata** | `PATCH /v1/cards/:cardId/metadata` (UpdateCardMetadataDto) | `EditCardModal` | On submit, refresh card detail. |
| **List User’s Cards** | `GET /v1/users/:userId/cards` (ListCardsQueryDto) | `MyCollectionPage` (grid with filters: rarity, set, year, player) | Use pagination (page/limit). |
| **Rating Calculation (Stateless)** | `POST /v1/rating/calc` (CalcRatingDto) → returns `CalcRatingResponseDto` with `breakdown` | `RatingCalculatorPage` (optional dev tool) | Show breakdown chart. |
| **Create Lineup** | `POST /v1/lineup` (CreateLineupDto – see source) | `LineupBuilderPage` | Drag‑and‑drop cards, enforce 9‑card limit, position constraints. |
| **Enqueue for Matchmaking** | `POST /v1/matchmaking/enqueue` (EnqueueMatchmakingDto) | `MatchmakingQueueButton` on lineup page | After enqueue, show position via `GET /v1/matchmaking/status`. |
| **Matchmaking Status** | `GET /v1/matchmaking/status` | `QueueStatusBanner` | Show “Waiting in queue – position X”. |
| **Cancel Matchmaking** | `POST /v1/matchmaking/cancel` | Same banner – **Cancel** button. |
| **Resolve Match** | `POST /v1/match/resolve` (ResolveMatchDto) → returns `ResolutionResult` | `MatchResultPage` (display winner, per‑position results, rewards) | Only accessible to participants; guard with JWT. |
| **Realtime (stub)** | `GET /v1/realtime/...` (not required for MVP) | Show placeholder “Live updates coming soon”. |
| **Health / Admin** | Not needed for player UI. |

## Technical Stack  

1. **React 18 + TypeScript**  
2. **React Router v6** – routes for `/`, `/login`, `/signup`, `/collection`, `/cards/:id`, `/lineup/:id`, `/match/:id`, etc.  
3. **TanStack Query** (React‑Query) for caching, auto‑refetch, and optimistic updates.  
4. **Axios** (or native fetch) with an interceptor that injects `Authorization: Bearer <token>` header on every request after login.  
5. **State Management** – simple React Context for auth + TanStack Query for data.  
6. **UI Library** – **shadcn/ui** (or Material‑UI) to get a modern, accessible look; use component library’s theming for dark/light mode.  
7. **Form handling** – **React Hook Form** + **Zod** for client‑side validation matching backend DTOs.  
8. **File upload** – use presigned URLs directly (PUT binary). Show progress bars.  
9. **Responsive design** – mobile‑first layout, grid cards, collapsible side navigation.  

## Data Flow Example (Upload → Confirm → Card)  

1. User clicks **Add Card** → opens `ScanUploadModal`.  
2. Call `POST /v1/scan/upload` → receive `scanJobId` + S3 URLs.  
3. Upload front/back images with `PUT` to the URLs (use `axios.put` with `Content-Type: image/jpeg`).  
4. Call `POST /v1/scan/process/:scanJobId`. Show spinner.  
5. Poll `GET /v1/scan/status/:scanJobId` every 2 s until `status === 'awaiting_user_confirm'` and `candidateMatches` are present.  
6. Show `ScanConfirmDialog` pre‑filled with the top candidate; let user edit/confirm fields.  
7. On confirm, `POST /v1/scan/confirm/:scanJobId` → receive `cardId`.  
8. Redirect to `/cards/:cardId` and fetch detail.  

## UI Wireframes (text description)  

- **Header**: logo, navigation links (My Collection, Build Lineup, Leaderboard), user avatar with dropdown (Profile, Logout).  
- **Home**: hero section describing the game, CTA “Start Scanning”.  
- **Collection Grid**: card thumbnail, power score badge, rarity color, click → Card Detail.  
- **Card Detail**: large image, power breakdown chart (bar or radar), metadata edit button, “Add to Lineup” action.  
- **Lineup Builder**: 9 slots with position labels, draggable card tiles, validation messages if rules break, “Enqueue Match” button.  
- **Matchmaking Queue**: banner showing queue position, cancel button, auto‑refresh every 5 s.  
- **Match Result**: winner card highlighted, per‑position scores, reward summary, button “Back to Collection”.  

## Accessibility & Internationalisation  

- Use semantic HTML, ARIA labels on interactive components.  
- All text wrapped in a simple i18n map (e.g., `en.json`) for future localisation.  

## Deployment Notes  

- Build with **Vite** (fast HMR).  
- Production bundle can be served from any static host (Netlify, Vercel).  
- Ensure `.env` contains `REACT_APP_API_URL` pointing to the backend URL.  

## Expected Output from v0.dev  

Provide a **complete repo** with the following structure:

```
/frontend
 ├─ src/
 │   ├─ app.tsx
 │   ├─ main.tsx
 │   ├─ routes/
 │   │   ├─ index.tsx
 │   │   ├─ login.tsx
 │   │   ├─ signup.tsx
 │   │   ├─ collection.tsx
 │   │   ├─ card/[cardId].tsx
 │   │   ├─ lineup/[lineupId].tsx
 │   │   ├─ match/[matchId].tsx
 │   ├─ components/
 │   │   ├─ Header.tsx
 │   │   ├─ CardGrid.tsx
 │   │   ├─ CardDetail.tsx
 │   │   ├─ ScanUploadModal.tsx
 │   │   ├─ ScanConfirmDialog.tsx
 │   │   ├─ LineupBuilder.tsx
 │   │   ├─ QueueBanner.tsx
 │   │   └─ MatchResult.tsx
 │   ├─ api/
 │   │   ├─ client.ts   // axios instance + auth interceptor
 │   │   └─ endpoints.ts // typed functions for each backend call
 │   ├─ hooks/
 │   │   └─ useAuth.ts
 │   ├─ lib/
 │   │   └─ validation.ts  // Zod schemas mirroring backend DTOs
 │   └─ styles/ (tailwind or shadcn theming)
 ├─ public/
 ├─ vite.config.ts
 ├─ tsconfig.json
 └─ package.json (dependencies: react, react‑router, @tanstack/react‑query, axios, react‑hook‑form, zod, shadcn/ui, tailwindcss, etc.)
```

The code should **compile (`npm run build`)** and **run (`npm dev`)** without errors, and all API calls must match the request/response shapes from the backend source files. Include brief README with start‑up commands (`yarn install && yarn dev`) and environment variable description.

---

**Deliverable:** a single‑prompt string ready for v0.dev that encapsulates all of the above.

--- 
Saved to `FRONTEND_PROMPT.md`.