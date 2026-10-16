// Builders for the checkout shipping form. Valid data satisfies src/lib/validation.ts: Indian mobile
// (10 digits, starts 6-9), address >= 5 chars, city letters/space/.'- only, state from the app's list,
// PIN 6 digits not starting with 0. No payment data exists: the app only offers Cash on Delivery.
import type { Faker } from '@faker-js/faker';

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
}

/** A subset of src/data/states.ts (INDIAN_STATES); the select only accepts values from that list. */
export const STATES = ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Kerala', 'Telangana', 'West Bengal', 'Gujarat'] as const;

const CITIES = ['Bengaluru', 'Mumbai', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata', 'Kochi', 'New Delhi', 'Ahmedabad'];
const CITY_RULE = /^[A-Za-z][A-Za-z .'-]*$/;

export function buildShippingDetails(faker: Faker, overrides: Partial<ShippingDetails> = {}): ShippingDetails {
  const fakerCity = faker.location.city();
  const fullName = faker.person.fullName().replace(/[^A-Za-z .'-]/g, '').trim();
  return {
    fullName: fullName.length >= 2 ? fullName : 'Asha Rao',
    email: faker.internet.email({ provider: 'shopnest.test' }).toLowerCase(),
    phone: `${faker.helpers.arrayElement(['6', '7', '8', '9'])}${faker.string.numeric(9)}`,
    addressLine: `${faker.number.int({ min: 1, max: 999 })} ${faker.location.street()}`,
    city: CITY_RULE.test(fakerCity) ? fakerCity : faker.helpers.arrayElement(CITIES),
    state: faker.helpers.arrayElement(STATES),
    postalCode: `${faker.number.int({ min: 1, max: 9 })}${faker.string.numeric(5)}`,
    ...overrides,
  };
}

/** A fixed, valid address for tests whose expected results quote exact address values. */
export const FIXED_SHIPPING = {
  phone: '9876543210',
  addressLine: '12 MG Road, Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560038',
} as const;

