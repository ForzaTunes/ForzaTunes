# Contributing to ForzaTunes

Thanks for your interest in contributing. ForzaTunes is a community project
and PRs of all sizes are welcome — from fixing a typo to adding a new game.

## Ground rules

- Be respectful. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
- One concern per PR. Small, focused changes get merged fastest.
- Keep the legal posture intact — ForzaTunes operates under Microsoft's
  [Game Content Usage Rules](https://www.xbox.com/en-us/developers/rules).
  Do not add manufacturer logos or other restricted assets.

## Local setup

See [README.md](./README.md) for full instructions. The short version:

```bash
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

For UI iteration without touching the database, set both flags in a local
`.dev.vars`:

```env
DEV_AUTH_BYPASS=true
DEMO_MODE=true
```

`DEMO_MODE` swaps the D1-backed managers for in-memory fixtures so you can
click through every page (submit/edit/star/report) without provisioning D1.
Writes are ephemeral.

## Architectural conventions

Before making non-trivial changes, please skim:

- [ARCHITECTURE.md](./ARCHITECTURE.md) — the high-level design.
- [AGENTS.md](./AGENTS.md) — coding conventions (manager classes, file-size
  limits, naming) that apply to humans and AI agents alike.

TL;DR:

- Business logic lives in **Manager** classes under `src/lib/managers/`,
  behind interfaces in `src/lib/managers/interfaces/`. Every new write path
  needs both a real (D1) implementation and a demo (in-memory) one.
- **One class per file**, files under **500 lines** (split at ~400).
- **camelCase** in TypeScript, **snake_case** in D1 SQL, bridged by mappers.
- No Node-only APIs (`crypto`, `fs`, `path`) in Worker code — use Web
  platform equivalents.

## Adding cars

Car lists live in [src/data/cars/](./src/data/cars/). Car images are
self-hosted on Cloudflare R2 and delivered through Cloudflare Image
Transformations; contributors **do not need R2 credentials** to add a car.

To add a missing entry:

1. Find the right file for the game (e.g. `fh5.json`).
2. Insert an entry following the existing shape. Leave `imageKey` as `null` —
   a maintainer populates it after running the migration script. Provide
   `imageUrl` as the canonical Wikia (or equivalent) link to the car photo:
   ```json
   {
     "make": "Toyota",
     "model": "GR86",
     "year": 2022,
     "category": "Modern Sports Cars",
     "imageUrl": "https://static.wikia.nocookie.net/forzamotorsport/images/...",
     "imageKey": null
   }
   ```
3. Keep the array sorted by `make`, then `model`.
4. Open a PR titled `data: add {make} {model} to {game}`.

### Maintainer: running the image migration

Before merging a PR that adds new cars (or periodically to refresh missing
images), a maintainer with R2 credentials runs:

```bash
npm run images:migrate
```

This script:

- Reads every `src/data/cars/*.json` file.
- Skips any car that already has an `imageKey`.
- For each remaining car, downloads the image from `imageUrl` (retrying
  transient failures) and uploads it to R2 under
  `cars/{gameSlug}/{uuid}.{ext}`.
- Writes the resulting `imageKey` back into the JSON.

Set up `.env` first (never commit it) using the maintainer-only variables
documented in [.env.example](./.env.example):

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=forzatunes-images
R2_PUBLIC_BASE_URL=https://images.forzatunes.com
```

If a Wikia fetch fails (e.g. 404), drop a manually-sourced image into
`scripts/images/fallbacks/{fallbackId}.{png|jpg|webp}` using the
`fallbackId` the script logs, then re-run `npm run images:migrate`. The
script is idempotent — already-migrated cars are skipped on subsequent runs.

After a successful migration, commit the updated `src/data/cars/*.json`
files and run `npm run db:seed:remote` to push the new `imageKey` values
into the production D1 database.

## Adding a new game

See the "New game" recipe in [AGENTS.md](./AGENTS.md). In short: add an
entry to [src/data/games.json](./src/data/games.json), add the car list,
add the slug to `GAME_ATTRIBUTIONS` in
[src/components/layout/Footer.astro](./src/components/layout/Footer.astro),
then re-run the local seed.

## Pull request checklist

Before opening a PR:

- [ ] `npm run build` succeeds locally with no TypeScript errors.
- [ ] Any new file respects the 500-line cap.
- [ ] No secrets, tokens, or real account IDs committed.
- [ ] PR description explains the *why*, not just the *what*.

## Reporting bugs / requesting features

Use the GitHub issue templates. Include reproduction steps (URL, browser,
account state) for bugs, and a user-facing motivation for features.

## Security

Security issues must **not** be reported via public issues or PRs. Follow
the private process in [SECURITY.md](./SECURITY.md).
