# Tune imports

Normalized CSVs in this folder feed `npm run ingest:tunes:local` / `npm run ingest:tunes:remote`. Each file represents one source (a community sheet, a thread, etc.).

Imports create real `tunes` rows with `source_url` set for attribution. Creators without an account get a stub user row keyed on their Forza gamertag. Nothing here fabricates stars.

## File layout

```
src/data/imports/tunes/
  README.md             <- this file
  _unresolved.log       <- generated; rows skipped by the last run
  saeenu-fh5.csv        <- one file per source
  itsnadrik-fh5.csv
  gbr-ozzy-fh5.csv
```

Files starting with `_` are ignored by the ingester. Name files `{source-slug}-{game-slug}.csv` so it's obvious at a glance which source produced which rows.

## CSV schema

Header row must match exactly (case-sensitive column names):

```
game_slug,share_code,make,model,year,car_class,pi_rating,tune_type,drivetrain,track,creator_gamertag,title,description,source_url
```

| Column | Type | Notes |
|---|---|---|
| `game_slug` | enum | `fh5` \| `fm` \| `fh6` |
| `share_code` | string | Digits only, no spaces. Length must match the game's `shareCodeLength`. |
| `make` | string | Must match `src/data/cars/{game}.json` `.make` (case-insensitive). |
| `model` | string | Must match `src/data/cars/{game}.json` `.model` (case-insensitive). |
| `year` | integer | Must match `src/data/cars/{game}.json` `.year` exactly. |
| `car_class` | enum | One of the game's `classRanges[].class` (e.g. `A`, `S1`, `X`). |
| `pi_rating` | integer | 100–999. |
| `tune_type` | enum | One of the game's `tuneTypes[].value`. |
| `drivetrain` | enum | `AWD` \| `RWD` \| `FWD`, or blank. |
| `track` | string | Event/track name. Blank is fine. |
| `creator_gamertag` | string | Forza gamertag, preserved as-written for display. Used case-insensitively for dedup. |
| `title` | string | Short tune name. |
| `description` | string | Optional. Plain text. No markdown, no HTML. |
| `source_url` | url | Required. Deep link to the row in the sheet / the source post. Shown on the tune detail page. |

Quoting: standard CSV. Wrap fields containing commas or quotes in `"`, escape inner quotes as `""`.

## Car matching

Matching is strict: `(game_slug, lower(make), lower(model), year)` must exist in `src/data/cars/{game}.json`. Anything that doesn't match is **skipped** and written to `_unresolved.log` with the source row number so you can fix it upstream.

Common cleanups before ingesting:

- Strip trims from model names (`"M4 Competition" -> "M4"` only if `cars.json` has `"M4"`; otherwise leave).
- Spell out marque abbreviations (`"AMG GT" -> "Mercedes-AMG GT"` if that's what `cars.json` uses).
- Standardize year for common cases where a sheet picked the wrong model year (verify on forza.fandom.com).

If the car legitimately exists in-game but isn't in `cars.json`, add it to the JSON file and re-run `npm run db:seed:local` first.

## Creator handling

- One stub `users` row per unique gamertag (case-insensitive). `forza_gamertag` gets the UNIQUE partial index from migration 0012, so re-runs are idempotent.
- Stubs have no `auth_accounts` row. Any later "claim this profile" flow should merge by `LOWER(forza_gamertag)`.
- `username` is set to the original-case gamertag for display; `public_slug` is deterministic (hash of lowercased gamertag) so re-ingesting the same sheet doesn't create new slugs.

## Attribution and opt-out

Every imported tune has `source_url` populated. The tune detail page renders an attribution line linking back to the original source plus a link to `/opt-out`, which documents the removal process and a contact email.

## Workflow

```
1. Grab the source sheet / thread.
2. Convert one tab / one post set to the normalized CSV above (Google Sheets export or manual).
3. Save it as src/data/imports/tunes/{source}-{game}.csv.
4. npm run ingest:tunes:local
5. Review _unresolved.log, fix the CSV (or cars.json), re-run locally until clean.
6. npm run ingest:tunes:remote
```

Each invocation is idempotent:

- Stubs: `INSERT OR IGNORE` on the unique gamertag.
- Tunes: `INSERT OR IGNORE` on the existing `UNIQUE (game_id, share_code)` constraint from migration 0001.

So re-running after fixing a few rows won't duplicate anything.

### Ingesting a specific file

Pass the filename as a positional arg to only process one CSV:

```
npx tsx src/lib/db/run-ingest-tunes.ts --local saeenu-fh5.csv
```
