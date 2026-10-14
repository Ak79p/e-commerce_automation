/**
 * DEMO-ONLY mock authentication. Accounts live in localStorage with plain-text passwords.
 * Never reuse this approach for real users.
 */
import { SEED_USERS } from '../data/users';
import { hasStringFields, isArrayOf, storage, StorageKeys } from '../lib/storage';
import {
  hasErrors,
  normalizeEmail,
  validateLogin,
  validateRegistration,
  type LoginInput,
  type RegistrationInput,
} from '../lib/validation';
import type { ApiResult, Session, StoredUserRecord, User } from '../types';
import { compactErrors, fail, ok, simulateRequest } from './api';

const USER_FIELDS = ['id', 'name', 'email', 'password', 'createdAt'];
const isUserRecord = (v: unknown): v is StoredUserRecord => hasStringFields(v, USER_FIELDS);
const isSession = (v: unknown): v is Session => hasStringFields(v, ['userId', 'token', 'createdAt']);

function registeredUsers(): StoredUserRecord[] {
  return storage.read(StorageKeys.users, [], isArrayOf(isUserRecord));
}

function allUsers(): StoredUserRecord[] {
  return [...SEED_USERS, ...registeredUsers()];
}

function findByEmail(email: string): StoredUserRecord | undefined {
  const normalized = normalizeEmail(email);
  return allUsers().find((u) => normalizeEmail(u.email) === normalized);
}

function toPublicUser({ password: _password, ...user }: StoredUserRecord): User {
  return user;
}

function startSession(userId: string): void {
  const session: Session = { userId, token: `demo-token-${userId}`, createdAt: new Date().toISOString() };
  storage.write(StorageKeys.session, session);
}

function nextUserId(): string {
  const used = new Set(allUsers().map((u) => u.id));
  let n = 1001;
  while (used.has(`USR-${n}`)) n += 1;
  return `USR-${n}`;
}

export const authService = {
  /** Synchronously restores the signed-in user from the persisted session (used on app start). */
  getCurrentUser(): User | null {
    const session = storage.read<Session | null>(StorageKeys.session, null, (v): v is Session | null => v === null || isSession(v));
    if (!session) return null;
    const record = allUsers().find((u) => u.id === session.userId);
    if (!record) {
      storage.remove(StorageKeys.session); // session points at a user that no longer exists
      return null;
    }
    return toPublicUser(record);
  },

  /** POST /auth/login */
  login(input: LoginInput): Promise<ApiResult<User>> {
    return simulateRequest(() => {
      const errors = validateLogin(input);
      if (hasErrors(errors)) return fail('VALIDATION_ERROR', 'Please correct the highlighted fields.', compactErrors(errors));
      const record = findByEmail(input.email);
      if (!record || record.password !== input.password) {
        return fail('INVALID_CREDENTIALS', 'Invalid email or password.');
      }
      startSession(record.id);
      return ok(toPublicUser(record));
    });
  },

  /** POST /auth/register — creates the account and signs the user in. */
  register(input: RegistrationInput): Promise<ApiResult<User>> {
    return simulateRequest(() => {
      const errors = validateRegistration(input);
      if (hasErrors(errors)) return fail('VALIDATION_ERROR', 'Please correct the highlighted fields.', compactErrors(errors));
      if (findByEmail(input.email)) {
        return fail('EMAIL_TAKEN', 'An account with this email already exists.', {
          email: 'An account with this email already exists.',
        });
      }
      const record: StoredUserRecord = {
        id: nextUserId(),
        name: input.name.trim(),
        email: normalizeEmail(input.email),
        password: input.password,
        createdAt: new Date().toISOString(),
      };
      storage.write(StorageKeys.users, [...registeredUsers(), record]);
      startSession(record.id);
      return ok(toPublicUser(record));
    });
  },

  /** POST /auth/logout — ends the session and discards the user's checkout draft. The cart is kept. */
  logout(): Promise<ApiResult<null>> {
    return simulateRequest(() => {
      const current = authService.getCurrentUser();
      if (current) storage.remove(StorageKeys.checkoutDraft(current.id));
      storage.remove(StorageKeys.session);
      return ok(null);
    });
  },

  subscribe(listener: () => void): () => void {
    return storage.subscribe(StorageKeys.session, listener);
  },
};
