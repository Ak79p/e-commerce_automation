# ShopNest — E-commerce Test Automation

ShopNest is a browser-only React + TypeScript (Vite) demo store. Its accounts, cart and orders are mocked in
`localStorage`, and the only payment method is a simulated Cash on Delivery. This repository contains the app and
an end-to-end test suite (Playwright + TypeScript) in `tests/playwright`. It covers desktop Chrome and mobile
browsers, using Playwright device emulation of a Pixel 7 (Chromium) and an iPhone 14 (WebKit).

## Prerequisites

- **Option A (local):** Node.js 20.19+ or 22.12+, npm 10+, Git.
- **Option B (Docker):** Docker only.

The tests sign in with the app's seeded demo shopper ("Demo User" in `src/data/users.ts`). Its email and password
are supplied through `tests/playwright/.env` locally, and through repository secrets in CI. They are never hardcoded in
the test code.

## Option A — Local installation and execution

1. Clone the repository:
   ```bash
   git clone https://github.com/Ak79p/e-commerce_automation.git
   cd e-commerce_automation
   ```
2. Install the app's dependencies *(repository root)*:
   ```bash
   npm ci
   ```
3. Install the test dependencies and the browsers *(from `tests/playwright`)*:
   ```bash
   cd tests/playwright
   npm ci
   npx playwright install --with-deps chromium webkit
   ```
   On Windows and macOS, `npx playwright install chromium webkit` is enough.
4. Configure the environment *(in `tests/playwright`)*:
   ```bash
   cp .env.example .env
   ```
   Then set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env` to the seeded Demo User's values from
   `src/data/users.ts`. Every other setting has a working default.
5. Run the tests *(in `tests/playwright`)*. Playwright starts the app (`npm run dev` on port 5173) automatically,
   or reuses one that's already running.

   | Task | Command |
   | --- | --- |
   | Smoke tests (desktop + mobile) | `npm run test:smoke` |
   | Full regression (desktop + mobile) | `npm test` |
   | Mobile tests only | `npm run test:mobile` |
   | Desktop tests only | `npm run test:desktop` |
   | Headed (watch the browser) | `npm run test:headed` |
   | Debug one test step by step | `npm run test:debug -- --grep CHK-UI-013` |
   | Open the HTML report | `npm run report` |

   Reports, traces, screenshots and videos are written to `tests/playwright/artifacts/`.
   `npm run report:summary` prints the passed and failed counts per project (desktop / mobile).

## Option B — Docker

Run these from the repository root. The image includes Node, the app, the test dependencies and the browsers, but
no credentials. Create `tests/playwright/.env` first (Option A, step 4); `--env-file` passes it to the container.

1. Build the image:
   ```bash
   docker build -t shopnest-tests .
   ```
2. Run the smoke tests:
   ```bash
   docker run --rm --env-file tests/playwright/.env -v "$(pwd)/artifacts:/app/tests/playwright/artifacts" shopnest-tests
   ```
3. Run the full regression suite:
   ```bash
   docker run --rm --env-file tests/playwright/.env -v "$(pwd)/artifacts:/app/tests/playwright/artifacts" shopnest-tests npm test
   ```
   To run only the mobile tests, end the command with `npm run test:mobile` instead.
4. Open `artifacts/html-report/index.html` on the host. `artifacts/results.json` holds the JSON results, and
   `artifacts/test-results/` holds the traces, screenshots and videos of failed tests.

In PowerShell, use `${PWD}` instead of `$(pwd)`.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Missing environment variable TEST_USER_EMAIL` | Create `tests/playwright/.env` (step 4). In CI, add the `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` repository secrets. |
| `Executable doesn't exist … chromium` or `… webkit` | Run `npx playwright install chromium webkit` in `tests/playwright`. |
| `Port 5173 is already in use` / webServer timeout | Stop the other process on 5173, or set `BASE_URL` (and `PW_START_SERVER=false` if you start the app yourself). |
| Tests fail only when two runs overlap | Don't start two `playwright test` runs in the same folder at once; they share `artifacts/`. Set a different `PW_ARTIFACTS_DIR` for each run. |
| Docker volume path errors on Windows (Git Bash) | Prefix the command with `MSYS_NO_PATHCONV=1` and use `"$(pwd -W)/artifacts:/app/tests/playwright/artifacts"`. |
| `npm ci` fails | Use Node 20.19+ or 22.12+, and run it in the directory that holds the matching `package-lock.json`. |

CI needs the repository secrets `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`. `.github/workflows/smoke.yml` runs the smoke tests on pull requests and pushes to `main`.
`.github/workflows/regression.yml` runs the full suite in parallel shards and publishes one merged report. Test
framework details are in [`tests/playwright/README.md`](tests/playwright/README.md).
