// One Faker instance per test, seeded from the test's title (or FAKER_SEED), so generated data is realistic,
// stable between runs of the same test, and reproducible when debugging: the seed is written to the test log.
import { Faker, en, en_IN } from '@faker-js/faker';
import { env } from '../config/env';

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededFaker(testTitle: string): { faker: Faker; seed: number } {
  const seed = env.fakerSeed ?? hash(testTitle);
  const faker = new Faker({ locale: [en_IN, en] });
  faker.seed(seed);
  return { faker, seed };
}
