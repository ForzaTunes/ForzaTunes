# ForzaTunes

Community-driven tune sharing for Forza Horizon 5 and Forza Motorsport. Browse, share, and star tunes created by the community.

> The production deployment at [forzatunes.com](https://forzatunes.com)
> is coming soon — this repository is the source of truth during the
> pre-launch period. See [Deployment](#deployment) for how it is hosted.

## Tech Stack

- **Framework:** [Astro](https://astro.build) with SSR
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge)
- **Auth:** Discord OAuth 2.0
- **UI:** [React](https://react.dev) islands + [Tailwind CSS](https://tailwindcss.com)
- **Language:** TypeScript (strict mode)

## Getting Started

### Prerequisites

- Node.js >= 22.12 (Astro 6 requirement; CI uses Node 24)
- npm >= 10
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- Cloudflare account (free tier works)
- Discord application (optional — only for testing real OAuth, see [Deployment](#deployment))

### Setup

```bash
# Clone the repo
git clone https://github.com/forzatunes/forzatunes.git
cd forzatunes

# Install dependencies
npm install

# Create a local D1 database and apply migrations
npm run db:migrate:local

# Seed the database with games and cars
npm run db:seed:local

# Start the dev server
npm run dev
```

> **Note:** `npm run dev` runs the Astro dev server without D1 bindings.
> Use `npm run preview` to test with the full Cloudflare Pages runtime
> (D1, environment variables, etc.).

### Environment Variables

Create a `.dev.vars` file in the project root for local development.

**Quick start (no Discord app needed):**

```env
DEV_AUTH_BYPASS=true
```

This injects a mock "DevUser" into every request so you can develop
authenticated features without setting up Discord OAuth. A yellow "DEV"
badge appears in the header when the bypass is active. Remove the variable
to test anonymous/logged-out flows.

**Full OAuth setup** (only needed if you're working on auth itself):

```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
SESSION_SECRET=a_random_32_char_string
```

| Variable | Description |
|----------|-------------|
| `DEV_AUTH_BYPASS` | Set to `true` to skip OAuth and use a mock user (dev only) |
| `DEMO_MODE` | Set to `true` to use in-memory demo managers + fixture tunes (no D1 needed) |
| `DISCORD_CLIENT_ID` | OAuth client ID from the Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | OAuth client secret |
| `SESSION_SECRET` | Random string used to sign session cookies (min 32 chars) |

### Demo mode

`DEMO_MODE=true` swaps the D1-backed managers for in-memory implementations
seeded with deterministic fixture data. It's the fastest way to preview the
full UI — recent tunes, browse, detail, profile, edit forms — without
provisioning or seeding a database.

```env
DEV_AUTH_BYPASS=true
DEMO_MODE=true
```

What works:

- All read paths (`/`, `/[game]`, `/[game]/tunes`, detail, profile, trending).
- All write paths (submit, edit, delete, star toggle, report) — but writes are
  **ephemeral**. They live in the current Worker isolate and disappear when it
  restarts (e.g. when you save a file in dev). There is no database.

When **not** to use demo mode:

- Production / staging — separate isolates each have their own fixture store,
  so changes in one are invisible to others.
- Anything that depends on real session state, real Discord IDs, or
  cross-request persistence.

## Project Structure

```
src/
├── components/
│   ├── layout/          # PageShell, Header, Footer
│   ├── islands/         # SearchBar, FilterPanel, SortControls
│   ├── submit/          # TuneForm
│   └── tune/            # StarButton
├── data/
│   ├── games.json       # Game definitions (FH5, FM)
│   └── cars/            # Per-game car lists (fh5.json, fm.json)
├── lib/
│   ├── auth/            # AuthProvider, DiscordAuth, SessionManager
│   ├── db/              # DatabaseClient, migrations, seed
│   ├── fixtures/        # Deterministic seed data for DEMO_MODE
│   ├── managers/        # GameManager, CarManager, TuneManager, StarManager, UserManager
│   │   ├── interfaces/  # ITuneManager, IGameManager, ... (DI seam)
│   │   └── demo/        # DemoStore + in-memory managers
│   ├── middleware/      # RateLimiter
│   ├── models/          # TypeScript interfaces
│   ├── validators/      # ShareCodeValidator, TuneValidator
│   └── ManagerFactory.ts # createManagers(env): D1 vs demo
├── pages/
│   ├── index.astro      # Landing page
│   ├── 404.astro        # Custom 404
│   ├── api/             # API endpoints (stars)
│   ├── auth/            # OAuth routes (login, callback, logout)
│   ├── profile/         # User profile (auth required)
│   └── [game]/          # Dynamic game routes (home, tunes, submit)
├── styles/
│   └── global.css       # Tailwind import
└── env.d.ts             # Cloudflare runtime types
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for the
full guide (local setup, conventions, PR checklist). Security issues
should be reported privately — see [SECURITY.md](./SECURITY.md).

The quick version:

### Adding Cars

Car lists live in `src/data/cars/{game-slug}.json`. To add missing cars:

1. Add entries to the appropriate JSON file following the existing format:
   ```json
   { "make": "Toyota", "model": "GR86", "year": 2022, "category": "Modern Sports Cars" }
   ```
2. Keep the array sorted by make, then model.
3. Open a PR with the title: `data: add {make} {model} to {game}`.

### Adding a New Game

1. Add a game entry to `src/data/games.json` with the slug, name, share code
   length, tune types, car classes, and PI range.
2. Create `src/data/cars/{slug}.json` with the car list.
3. Run `npm run db:seed:local` to insert the new game and cars.
4. Create route files under `src/pages/{slug}/` mirroring the existing
   `fh5` routes.
5. Add the game slug to the `GAME_ATTRIBUTIONS` map in `Footer.astro`.

### General Features

1. Fork the repo and create a feature branch.
2. Make your changes with tests if applicable.
3. Ensure `npm run build` succeeds with no TypeScript errors.
4. Open a PR describing what you changed and why.

## Deployment

### Cloudflare Pages Setup

1. Connect the GitHub repo to Cloudflare Pages.
2. Set build command: `npm run build`, output directory: `dist`.
3. Create and bind a D1 database (`DB` binding).
4. Set environment variables in the Cloudflare dashboard.
5. Apply migrations: `wrangler d1 migrations apply forzatunes-db --remote`
6. Seed the remote database: `npx tsx src/lib/db/seed.ts --remote`
7. Add custom domain `forzatunes.com`.

### Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications).
2. Create a new application named "ForzaTunes".
3. Under **OAuth2**, copy the Client ID and Client Secret.
4. Add redirect URI: `https://forzatunes.com/auth/callback`
5. For local dev, also add: `http://localhost:4321/auth/callback`

## Legal Notice

Forza Horizon 5 and Forza Motorsport © Microsoft Corporation. ForzaTunes
was created under Microsoft's
[Game Content Usage Rules](https://www.xbox.com/en-us/developers/rules)
using assets from Forza Horizon 5 and Forza Motorsport, and it is not
endorsed by or affiliated with Microsoft.

## License

[MIT](./LICENSE)
