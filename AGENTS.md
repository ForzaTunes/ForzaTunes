# AI Agent Guidelines — ForzaTunes

Instructions for coding agents working on this repository. ForzaTunes is an open-source site for sharing **Forza** game tunes, built with **Astro 6** (SSR), **Cloudflare Pages**, **D1** (SQLite), **React** islands, **Tailwind CSS 4**, and **Discord OAuth**, with **TypeScript strict** mode.

---

## 1. Project Context

- **Stack**: Astro 6 SSR on Cloudflare Workers/Pages; bindings include D1.
- **UI**: Astro components plus React islands; Tailwind CSS 4.
- **Data**: D1 for tunes, users, stars, etc.; JSON under `src/data/` for games and car lists (community-editable).
- **Auth**: Session-based; Discord is the primary OAuth provider (`src/lib/auth/`).
- **Types**: Strict TypeScript; Cloudflare types from `@cloudflare/workers-types`.

---

## 2. Coding Conventions

### Object-oriented structure

- **Business logic** lives in **Manager** classes under `src/lib/managers/`.
- Each manager receives a **`DatabaseClient`** (or equivalent data access) via **constructor injection** — no hidden globals for DB access.

### Single responsibility

- **One class per file**; **one concern per class**.
- Avoid “god” classes: split orchestration, persistence, and validation across managers, mappers, and validators.

### Size limits

- **Files**: hard max **500 lines**; split proactively around **~400 lines**.
- **Classes**: aim under **~200 lines**; extract helpers or sub-managers if growth continues.
- **Functions**: max **30–40 lines**; extract private methods or small pure functions.

### Design

- **Composition over inheritance**, but think in terms of **types, classes, and clear contracts** — not loose procedural scripts.

---

## 3. File Organization

| Area | Path | Role |
|------|------|------|
| Domain types | `src/lib/models/` | TypeScript **interfaces/types only**; **barrel** `index.ts` |
| Business logic | `src/lib/managers/` | e.g. `GameManager`, `CarManager`, `TuneManager`, `StarManager`, `UserManager`, mappers like `tuneMappers.ts` |
| Validation | `src/lib/validators/` | Input validation classes |
| Auth | `src/lib/auth/` | Interfaces, session/crypto, providers (e.g. Discord) |
| Database | `src/lib/db/` | `DatabaseClient`, migrations, `seed.ts` |
| Middleware | `src/lib/middleware/` | e.g. `RateLimiter` |
| Components | `src/components/` | Astro at root; React in `islands/`, `submit/`, `tune/` as applicable |
| Routes | `src/pages/` | Astro routes — **thin**: delegate to components + managers |
| Static data | `src/data/` | `games.json`, `cars/*.json` |

---

## 4. Naming Conventions

- **Domain / TypeScript models**: **camelCase** — `gameId`, `shareCode`, `creatorGamertag`.
- **SQL / D1 row columns**: **snake_case** — `game_id`, `share_code`, `creator_gamertag`.
- **Mappers** bridge rows ↔ models — e.g. `mapRowToTune`, `mapRowToTuneWithDetails` in `src/lib/managers/tuneMappers.ts`.
- **Component files**: **PascalCase** — `TuneCard.astro`, `StarButton.tsx`.
- **Manager files**: **PascalCase** filename matching the class — `TuneManager.ts` exports `TuneManager`.

---

## 5. Cloudflare Workers Gotchas

### Environment bindings

- Access Cloudflare env with: `import { env } from "cloudflare:workers"`.
- Do **not** rely on patterns from other frameworks (e.g. `Astro.locals.runtime`) for Workers bindings unless the project explicitly standardizes on that — **prefer `cloudflare:workers`**.

### D1 / SQLite

- D1 is **SQLite**, not PostgreSQL.
- **No `RETURNING`** — use patterns like `last_insert_rowid()` where you need the new row id.

### Crypto

- **No Node.js `crypto` module** in the Worker — use the **Web Crypto API** (`crypto.subtle`, etc.).
- Session encryption in this project uses **PBKDF2 + AES-GCM** via Web Crypto.

### Ephemeral isolates

- Worker isolates are **short-lived**. **In-memory** structures (e.g. rate-limit maps) **reset between requests** in production — design accordingly (D1, KV, or accepted best-effort limits).

### Types

- Use **`@cloudflare/workers-types`** for `Env`, D1, and related typings.

---

## 6. How to Extend

### New game

1. Add an entry to `src/data/games.json`.
2. Add `src/data/cars/{slug}.json` for that game’s car list.
3. Add the slug to **`GAME_ATTRIBUTIONS`** in `src/components/layout/Footer.astro` (legal attribution).
4. Re-run local seed: `npm run db:seed:local` (after migrations as needed).

### New OAuth provider

1. Add a provider class that implements **`AuthProvider`** from `src/lib/auth/AuthProvider.ts` — `getAuthUrl`, `exchangeCode`, `getUserProfile`.
2. Wire the provider into the auth flow / pages alongside Discord (follow existing patterns in `src/lib/auth/` and auth routes under `src/pages/`).

### New tune sort option

1. Extend **`TuneSortField`** in `src/lib/models/Tune.ts`.
2. Add the SQL fragment to **`SORT_MAP`** in `src/lib/managers/TuneManager.ts`.
3. Add UI in `src/components/islands/SortControls.tsx`.

### New search filter

1. Extend **`TuneSearchFilters`** in `src/lib/models/Tune.ts`.
2. Add the query condition in **`TuneManager.search()`** (or the dedicated search path used by the app).
3. Add controls in `src/components/islands/FilterPanel.tsx`.

---

## 7. Build & Dev Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Astro dev server (**no** full D1 bindings like production) |
| `npm run preview` | **Wrangler** Pages dev over `dist` — closer to production, **with D1** locally |
| `npm run build` | Production build (`astro build`) |
| `npm run db:migrate:local` | Apply D1 migrations to the **local** D1 database |
| `npm run db:seed:local` | Seed games + cars into **local** D1 (`src/lib/db/seed.ts`) |

Use **preview + local D1** when testing anything that touches the real DB layer.

---

## 8. Legal & Content Rules

- **Microsoft Game Content Usage Rules** apply. The project must stay compliant; see **`README.md`** for detail.
- **Attribution** belongs in the **footer** (including per-game strings in `GAME_ATTRIBUTIONS`).
- **No manufacturer logos** or other restricted assets — follow README guidance.

---

## Agent hygiene

- Prefer **small, reviewable diffs** aligned with the sections above.
- **Ask** when requirements are ambiguous (new features, schema changes, or legal-sensitive content).
- Do **not** add unrelated projects, drivers, or stack-specific content to this document — keep guidance **ForzaTunes-only**.
