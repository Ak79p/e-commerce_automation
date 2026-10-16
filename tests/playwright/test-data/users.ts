// Builders for sign-up and login data. Valid data satisfies src/lib/validation.ts (name >= 2 chars, email
// pattern, password 8-64 chars, matching confirmation); each invalid builder breaks one rule.
import type { Faker } from '@faker-js/faker';
import { env } from '../config/env';

export interface NewUser {
  name: string;
  firstName: string;
  email: string;
  password: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export const DEMO_USER = { id: 'USR-0001', name: 'Demo User', firstName: 'Demo' } as const;

let sequence = 0;

/** Unique per run, worker and call; the readable prefix and the test log make a failing account traceable. */
export function uniqueEmail(faker: Faker, workerIndex: number, tag = 'qa'): string {
  sequence += 1;
  const word = faker.internet.username().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'user';
  return `${tag}.${Date.now()}.w${workerIndex}.${sequence}.${word}@shopnest.test`;
}

export function buildNewUser(faker: Faker, workerIndex: number, overrides: Partial<NewUser> = {}): NewUser {
  const firstName = faker.person.firstName().replace(/[^A-Za-z]/g, '') || 'Asha';
  const lastName = faker.person.lastName().replace(/[^A-Za-z]/g, '') || 'Rao';
  const password = env.newUserPassword ?? `Qa@${faker.string.alphanumeric({ length: 11 })}9`;
  const user = { name: `${firstName} ${lastName}`, firstName, email: uniqueEmail(faker, workerIndex), password, ...overrides };
  return { ...user, firstName: user.name.trim().split(' ')[0] };
}

/** The seeded Demo User; credentials come from the environment (.env), never from code. */
export function demoCredentials(): Credentials {
  return { email: env.testUser.email, password: env.testUser.password };
}

export const invalidCredentials = {
  /** Right email, password in the wrong case (passwords are case-sensitive). */
  wrongCasePassword(): Credentials {
    const { email, password } = demoCredentials();
    const lowered = password.toLowerCase();
    if (lowered === password) throw new Error('TEST_USER_PASSWORD must contain upper-case letters for this check.');
    return { email, password: lowered };
  },
  /** A well-formed email that is not registered, with a real account's password. */
  unregisteredEmail(): Credentials {
    return { email: 'nobody.qa@shopnest.test', password: demoCredentials().password };
  },
  /** Fails client-side format validation, so no request is made. */
  malformedEmail: 'demo@shopnest',
};

export const invalidRegistration = {
  /** The seeded Demo User's email in upper case: emails are compared case-insensitively. */
  duplicateEmail(faker: Faker, workerIndex: number): NewUser {
    return buildNewUser(faker, workerIndex, { email: env.testUser.email.toUpperCase() });
  },
  malformedEmail: 'qa.user@shopnest',
  shortName: ' A ',
  shortPassword: 'Abcd@12',
  minPassword: 'Abcd@123',
  maxPassword: 'a'.repeat(64),
  tooLongPassword: 'a'.repeat(65),
  password: 'Abcd@1234',
  mismatchedConfirmation: 'Abcd@1235',
};

