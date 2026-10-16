# ShopNest Playwright tests

End-to-end UI tests for ShopNest (Playwright Test + TypeScript). Installation and run commands are in the
[root README](../README.md). This page describes how the suite is organised.

## Structure

```
tests/playwright/
├── playwright.config.ts   # projects, webServer, parallelism, retries, reporters, traces/screenshots/video
├── config/env.ts          # the only reader of environment variables (defaults in .env.example)
├── setup/auth.setup.ts    # "setup" project: signs in the demo user once and saves the storage state
├── fixtures/index.ts      # test/expect with page objects, workflows, seeded test data and a logger
├── pages/                 # page objects: one class per screen, plus header and toast components
├── workflows/             # business steps: AuthWorkflow, ShoppingWorkflow, CartWorkflow, CheckoutWorkflow
├── test-data/             # Faker-backed builders (users, shipping) and seeded product/pricing constants
├── support/               # storage-state presets, localStorage readers, redacting logger
├── scripts/               # summarize-results.mjs: per-project (desktop/mobile) pass/fail table
└── ui/                    # specs: auth, srch (search), prod, cart, chk (checkout), nav, mobile
```

- **Page objects** hold the locators (mostly `data-testid`, plus roles for headings) and small UI actions.
- **Workflows** combine page objects into business steps and wait until the app has settled, using web-first
  `expect`. Specs never sleep.
- **Specs** import `test`/`expect` from `fixtures/` and use one `test.step` per scenario step. Every test title
  starts with a case ID (for example `CHK-UI-001`), so `npx playwright test --grep CHK-UI-001` runs that one test.
  Tags select subsets: `@smoke`, `@auth`, `@cart`, `@checkout`, `@e2e` and so on.

## Projects (browsers and devices)

| Project | Browser / device | Runs |
| --- | --- | --- |
| `setup` | Desktop Chrome | sign-in once per run (a dependency of the others) |
| `ui` | Desktop Chrome | every test **not** tagged `@mobile` |
| `mobile-chrome` | Pixel 7 emulation (Chromium, 412×839, touch) | every test tagged `@mobile` |
| `mobile-safari` | iPhone 14 emulation (WebKit, 390×664, touch) | every test tagged `@mobile` |

Mobile tests live in `ui/mobile-ui.spec.ts` (`MOB-UI-001…008`). Each one runs once per mobile device, on
purpose; no test runs twice on the same device. `npm run test:smoke` selects `@smoke` in all three projects.
`npm test` runs the full suite in all three, and `npm run test:mobile` runs only the two mobile projects.
`ui-firefox` and `ui-webkit` (desktop) are added only with `PW_CROSS_BROWSER=true`.

## Coverage

| Area | Tests |
| --- | --- |
| Sign-up: valid, duplicate email, missing fields, field rules | AUTH-UI-001…004 |
| Login: valid, invalid credentials, empty or malformed fields | AUTH-UI-005…007 |
| Search: partial/case-insensitive match, no results | SRCH-UI-001, SRCH-UI-003 |
| Product selection and adding a quantity from the details page | PROD-UI-001, PROD-UI-004 |
| Cart: add, +/−, typed quantities, delivery-fee boundary, remove, persistence | CART-UI-001…005, CART-UI-007 |
| Checkout: proceed (signed out → login), valid order, empty cart, required fields, field rules, draft persistence | CHK-UI-001…006 |
| Checkout navigation: Back after ordering, Back/Forward during checkout, no login redirect loop | CHK-UI-009, CHK-UI-011, CHK-UI-012 |
| **Full happy path**: sign up → sign out → log in → search → select → add 2 → cart totals → checkout → confirmation | **CHK-UI-013** |
| Header and in-page navigation | NAV-UI-001 |
| Mobile: storefront and navigation, search, listing and details, add to cart and totals, change quantity and remove, checkout validation, simulated checkout, Back/Forward and persistence | MOB-UI-001…008 (`@mobile`; 001, 002, 004 and 007 also `@smoke`) |

## Test data

- `@faker-js/faker` (`en_IN` locale). Each test gets its own instance, seeded from the test title or from
  `FAKER_SEED`, and the seed is written to the test log so failures are reproducible.
- `data.newUser()` builds a valid registration with a unique email (`qa.<epoch-ms>.w<worker>.<n>.<word>@shopnest.test`).
  `data.shipping()` builds valid Indian shipping details (mobile number starting 6–9, 6-digit PIN code that
  doesn't start with 0, a state from the app's list).
- `test-data/users.ts` has invalid inputs: duplicate email, malformed email, length boundaries, and wrong or
  unregistered credentials. Tests whose expected results quote exact values use those literal values.
- No payment data exists. The app only offers simulated Cash on Delivery.

## Authentication and isolation

ShopNest keeps its session in `localStorage`, which Playwright's `storageState` captures. The `setup` project
signs in through the real login form and saves `artifacts/.auth/demo-user.json`, which is git-ignored. Every
desktop project depends on `setup`, so filtered runs and CI shards create their own session.

Tests start **signed out**. Suites that need a signed-in user opt in with `test.use(signedIn)`. Each test gets
a new browser context, and all app state lives in that context's `localStorage`, so tests never share carts,
drafts or orders. That's why they run fully parallel and sharded in any order.

## Reports and artifacts

All output goes under `PW_ARTIFACTS_DIR` (default `artifacts/`): `html-report/`, `results.json` and
`test-results/`. Failed tests keep their screenshots, videos and traces in `test-results/`, and each test attaches
a `test-log.txt` in which passwords and tokens are redacted. With `PW_BLOB_REPORT=true` (used by the CI shards),
a blob report is written to `blob-report/` instead, for `npx playwright merge-reports`.

## Known limitations

- **Mobile coverage is browser emulation, not real devices.** Playwright's device profiles set the viewport,
  user agent, touch and device scale factor. `mobile-safari` runs Playwright's WebKit build, which is close to
  Safari's engine but is not iOS Safari on an iPhone. There are no native app, real-device or iOS-simulator tests
  (ShopNest is a responsive web app). The mobile checks are behavioural (touch input, no horizontal scrolling,
  controls within the viewport, the greeting hidden on narrow screens), not pixel comparisons.
- Desktop runs use Chromium. Desktop Firefox and WebKit are opt-in with `PW_CROSS_BROWSER=true`.
- The suite targets the Vite dev server. For the preview build, use
  `BASE_URL=http://localhost:4173 PW_START_SERVER=false` with `npm run preview` running.
