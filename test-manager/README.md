# Test manager: ShopNest test catalogue

A small, dependency-free web app for browsing, adding and tracking the ShopNest test cases. It needs no account,
database or external service. A small Node server persists everything to a JSON file in this folder.

```
test-manager/
├── server.mjs              Node built-ins only; serves the UI and the JSON API
├── lib/catalogue.mjs       schema, validation, ID allocation and placement (used by the server, the CLI and the browser)
├── lib/store.mjs           atomic file persistence (shared by server and CLI)
├── lib/plans.mjs           requirement fingerprint + plan staleness
├── public/                 index.html, app.js, styles.css (vanilla JS, no build step)
├── data/catalogue.json     ← the catalogue (source of truth, committed to git)
├── scripts/case.mjs        CLI: show / placement / list / update one case, plan freshness
├── scripts/export-md.mjs   exports the catalogue to Markdown
├── scripts/validate.mjs    validates catalogue.json
└── test/                   node:test suites (schema, ID allocation, add-case API, plan freshness)
```

## Run

Requires Node.js 18+. No `npm install` is needed.

```bash
cd test-manager
npm start                  # → http://127.0.0.1:5180
npm run validate           # schema check of data/catalogue.json
npm test                   # unit + API tests (uses a temporary copy of the catalogue)
npm run export:md          # writes ../test-catalog.md
```

To change the port, set `TEST_MANAGER_PORT=5181` (PowerShell: `$env:TEST_MANAGER_PORT=5181; npm start`).

## Features

* **Searchable table.** Search covers ID, title, objective, risk, steps, expected results, references, notes and script path, and every word must match.
* **Filters** for layer, priority, automation status and latest result. They're kept in the URL, so you can bookmark a filtered view. Click a column header to sort.
* **Full procedure view.** Click a row, or open `/#CART-UI-003`, to see the objective, risk, preconditions, test data, numbered steps, numbered expected results and references.
* **Add test case** (toolbar). Choose the area (for example `CART`, `CHK` or `MOB`, or a new 2–10-letter area), the layer and the priority, then fill in the procedure, one list item per line.
  * The form previews the ID the case will get. The server assigns the final ID: the next number after the highest in that AREA-LAYER group.
  * The new case is validated and appended to `data/catalogue.json`. It starts as `planned` / `not run`, and its automation target follows the layer.
* **Execution & tracking** form: automation status, latest result, last executed date, script path and notes. Choosing a result fills in today's date if none is set.
* **Edit content.** Change the title, layer, priority, target and all procedure text. **The ID can never be changed**; the server rejects any attempt.
* **Export JSON** downloads `test-catalogue-YYYY-MM-DD.json`. **Import JSON** validates the file, shows how many IDs will be added or removed, asks for confirmation, and then replaces the catalogue.
* **Summary counters:** totals per layer, plus how many are automated, passed, failed and not run.

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/catalogue` | the whole catalogue |
| `PUT` | `/api/catalogue` | replace the catalogue (import); validated |
| `POST` | `/api/tests` | add a case. Body: `area`, `layer`, `priority`, `title`, `objective`, `risk`, the five lists and optional `notes`. Do not send an `id`. Responds `201` with the saved case, or `400`/`422` with details |
| `PATCH` | `/api/tests/<ID>` | update fields of one case (never its ID) |

## Data model

Each entry in `data/catalogue.json` is an item of `tests[]`:

| Field | Type / values |
|---|---|
| `id` | `^[A-Z]+-(API\|UI\|PERF)-\d{3}$`, e.g. `CART-UI-003`. **Permanent.** |
| `title`, `objective`, `risk` | non-empty strings |
| `layer` | `API` · `UI` · `Performance` |
| `priority` | `P0` · `P1` · `P2` |
| `preconditions`, `testData`, `references` | string arrays |
| `steps`, `expectedResults` | non-empty string arrays (numbered in the UI) |
| `automationStatus` | `planned` · `in progress` · `automated` |
| `automationTarget` | `Playwright` (API/UI) · `k6` (Performance) |
| `scriptPath` | repo-relative path, empty until automated |
| `latestResult` | `not run` · `passed` · `failed` · `blocked` |
| `lastExecuted` | `YYYY-MM-DD` or `null` |
| `notes` | string |
| `updatedAt` | ISO timestamp, set by the server |

Validation rules beyond the types:
* IDs are unique.
* API and UI cases target Playwright; Performance cases target k6.
* `automated` requires a `scriptPath`.

**ID convention:** `<AREA>-<LAYER>-<NNN>`. The areas are:

| AREA | Covers |
|---|---|
| `AUTH` | sign-up and login |
| `SRCH` | product search |
| `PROD` | product details |
| `CART` | shopping cart |
| `CHK` | checkout and order placement |
| `NAV` | site navigation |
| `MOB` | mobile browser tests (Pixel 7 / Chromium and iPhone 14 / WebKit emulation) |

A new case takes the next number after the highest in its AREA-LAYER group.

## Statuses

| Field | Value | Meaning |
|---|---|---|
| `automationStatus` | `planned` | Specified, no script yet |
| | `in progress` | A script exists but isn't finished, or couldn't be validated (blocked / not run) |
| | `automated` | The script exists at `scriptPath` and implements every expected result |
| `latestResult` | `not run` | Never executed |
| | `passed` / `failed` | Outcome of the last real execution (`lastExecuted` = its date) |
| | `blocked` | Couldn't execute (missing credentials, data or app) |

Results describe the **last execution**, not the quality of the script. A correct test that exposes an app defect is `automated` + `failed`.

## Automation paths

* `scriptPath` is repo-relative and must be the path derived from the ID (`node scripts/case.mjs placement <ID>`):
  * `tests/playwright/ui/<area>-ui.spec.ts` (for example `tests/playwright/ui/cart-ui.spec.ts`);
  * `tests/playwright/ui/mobile-ui.spec.ts` for `MOB` cases.

  The validator rejects any other path, and also a `layer` that doesn't match the ID's kind segment.
* Desktop cases run in the Playwright `ui` project. `MOB` cases run in `mobile-chrome` and `mobile-safari`. `placement` prints the exact command.
* `lastExecuted` holds the date (YYYY-MM-DD). The command and the result summary go into `notes` as timestamped lines, for example `[2026-10-16 11:05 UTC+05:30] passed via: npx playwright test ui/cart-ui.spec.ts --project=ui --grep CART-UI-001 | 2 passed`.

## CLI

```bash
node test-manager/scripts/case.mjs show CART-UI-001                  # full case as JSON (exact ID match)
node test-manager/scripts/case.mjs placement MOB-UI-003              # spec file, tags, projects and run command
node test-manager/scripts/case.mjs list --layer UI --status planned  # filtered list
node test-manager/scripts/case.mjs fingerprint CART-UI-001           # requirement fingerprint (title, preconditions, test data, steps, expected results)
node test-manager/scripts/case.mjs update CART-UI-001 --automation-status automated --script-path tests/playwright/ui/cart-ui.spec.ts --result passed --executed today --note "passed via: … | 1 passed"
```
* `update` changes **tracking fields only**: `automationStatus`, `scriptPath`, `latestResult`, `lastExecuted` and `notes`.
  * `--note` appends a timestamped line and keeps the existing notes; `--notes` replaces them.
  * Requirements are edited in the web UI.
* Every update is validated and written atomically through the same store as the web server, so the CLI is safe to use while the server runs. Reload the browser tab to see CLI changes.
* Exit codes:

  | Code | Meaning |
  |---|---|
  | `0` | ok |
  | `1` | invalid usage or update (catalogue unchanged) |
  | `2` | ID not found |
  | `3` | ID duplicated |
  | `4` | plan stale |

## Persistence and limitations

* **The file is the database.** Every save, including **Add test case**, rewrites `data/catalogue.json` atomically: it writes a temp file and then renames it. The previous version is kept in `data/catalogue.backup.json`, which is git-ignored. Changes survive refreshes and server restarts, and they show up in `git diff`.
* **Single user, single machine.** There are no accounts and no locking between people. The server serialises writes, so two browser tabs adding cases at once still get distinct IDs. Whole-catalogue imports overwrite everything.
* **Last write wins per test.** Click **Reload**, or switch back to the tab (which reloads automatically), to pick up edits made in another tab or directly to the file.
* **The server must be running.** Opening `public/index.html` directly from disk won't work, and nothing is stored in browser storage.
* **Only the last result is tracked.** For history, use `git log` of the JSON file or exported snapshots.
* **Local only.** The server binds to `127.0.0.1` and isn't meant to be exposed on a network.
