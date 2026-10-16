// The only place the tests read environment variables. Values come from the process environment or from an
// optional .env next to playwright.config.ts (git-ignored; see .env.example). Credentials are never logged.
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

export function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

/** For credentials: throws a clear, actionable error instead of falling back to a hardcoded value. */
export function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Locally: copy tests/playwright/.env.example to .env and fill it in. ` +
        'In CI: add it as a repository secret.',
    );
  }
  return value;
}

function optionalNumber(name: string): number | undefined {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Environment variable ${name} must be a positive number, got "${raw}".`);
  return value;
}

const isCI = ['1', 'true', 'yes'].includes((process.env.CI ?? '').toLowerCase());

export const env = {
  baseUrl: optional('BASE_URL', 'http://localhost:5173'),

  /** Parallel workers. Unset: 2 on CI, otherwise Playwright's default (half the CPU cores). */
  workers: optionalNumber('PW_WORKERS') ?? (isCI ? 2 : undefined),
  isCI,
  /** Start `npm run dev` from the repository root unless a server is already listening on BASE_URL. */
  startServer: optional('PW_START_SERVER', 'true') !== 'false',
  /** Also run the desktop suite in Firefox and WebKit (`ui-firefox`, `ui-webkit` projects). */
  crossBrowser: optional('PW_CROSS_BROWSER', 'false') === 'true',
  /** Base seed for Faker. Unset: a seed is derived per test from its title, so data is stable between runs. */
  fakerSeed: optionalNumber('FAKER_SEED'),
  /** Print the per-test log to the console as well as attaching it to the report. */
  verboseLog: optional('PW_LOG', 'false') === 'true',

  /** Root of every generated file: HTML/JSON/blob reports, traces, screenshots, videos and the saved session. */
  artifactsDir: path.resolve(__dirname, '..', optional('PW_ARTIFACTS_DIR', 'artifacts')),
  /** Write a blob report (for merging sharded CI runs) instead of the HTML and JSON reports. */
  blobReport: optional('PW_BLOB_REPORT', 'false') === 'true',

  /**
   * The seeded Demo User account (USR-0001) the tests sign in with. Required, read lazily (only tests that sign in
   * need it) and never logged. Locally from .env, in CI from repository secrets.
   */
  testUser: {
    get email(): string {
      return required('TEST_USER_EMAIL');
    },
    get password(): string {
      return required('TEST_USER_PASSWORD');
    },
  },
  /** Optional fixed password for accounts the tests register; unset, Faker generates a valid one per test. */
  get newUserPassword(): string | undefined {
    return process.env.TEST_NEW_USER_PASSWORD || undefined;
  },
};
