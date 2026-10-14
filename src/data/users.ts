import type { StoredUserRecord } from '../types';

/**
 * DEMO-ONLY seeded accounts. These credentials are intentionally public and documented in README.md.
 * They are always available and cannot be deleted; reset restores the user list to exactly these.
 */
export const SEED_USERS: readonly StoredUserRecord[] = Object.freeze([
  {
    id: 'USR-0001',
    name: 'Demo User',
    email: 'demo@shopnest.test',
    password: 'Demo@1234',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-0002',
    name: 'Priya Sharma',
    email: 'priya@shopnest.test',
    password: 'Priya@1234',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]);
