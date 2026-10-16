// Where the setup project saves the signed-in storage state, and the storage-state presets the specs use.
// ShopNest keeps its session in localStorage (`shopnest:v1:session`), which Playwright's storageState captures
// per origin, so a saved state restores a real signed-in user in a new browser context.
import path from 'node:path';
import { env } from '../config/env';

/** Lives under the run's (git-ignored) artifacts directory. Holds a demo session token, never credentials. */
export const AUTH_STATE_FILE = path.join(env.artifactsDir, '.auth', 'demo-user.json');

/** `test.use(signedIn)`: every test in the scope starts as the seeded Demo User in a fresh context. */
export const signedIn = { storageState: AUTH_STATE_FILE } as const;

/** `test.use(signedOut)`: an explicitly empty context (the seeded, signed-out state). */
export const signedOut = { storageState: { cookies: [], origins: [] } } as const;
