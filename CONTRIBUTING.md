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

Car lists live in [src/data/cars/](./src/data/cars/). To add missing entries:

1. Find the right file for the game (e.g. `fh5.json`).
2. Insert an entry following the existing shape:
   ```json
   { "make": "Toyota", "model": "GR86", "year": 2022, "category": "Modern Sports Cars" }
   ```
3. Keep the array sorted by `make`, then `model`.
4. Open a PR titled `data: add {make} {model} to {game}`.

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
