// Schema rules for the ShopNest catalogue and for adding new cases. Run: cd test-manager && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildNewTest, nextId, placementFor, validateCatalogue, validateTest } from '../lib/catalogue.mjs';

const catalogue = JSON.parse(await readFile(new URL('../data/catalogue.json', import.meta.url), 'utf8'));

const input = {
  layer: 'UI',
  priority: 'P1',
  title: 'Coupon field rejects an unknown code',
  objective: 'Shoppers get a clear message for invalid coupons.',
  risk: 'Silent coupon failures cause abandoned carts.',
  preconditions: ['App running at BASE_URL.'],
  testData: ['Coupon "NOPE"'],
  steps: ['  Open /cart.  ', '', 'Apply coupon "NOPE".'],
  expectedResults: ['Step 2: an error is shown.'],
  references: [],
};

test('the committed catalogue is valid and every ID is unique', () => {
  assert.deepEqual(validateCatalogue(catalogue), []);
  assert.equal(new Set(catalogue.tests.map((t) => t.id)).size, catalogue.tests.length);
});

test('placement maps MOB cases to the mobile spec and other areas to <area>-ui.spec.ts', () => {
  assert.equal(placementFor('MOB-UI-001').scriptPath, 'tests/playwright/ui/mobile-ui.spec.ts');
  assert.deepEqual(placementFor('MOB-UI-001').tags, ['@ui', '@mobile']);
  assert.equal(placementFor('CHK-UI-013').scriptPath, 'tests/playwright/ui/chk-ui.spec.ts');
});

test('nextId takes the next number after the highest one in the AREA-LAYER group', () => {
  const tests = [{ id: 'CART-UI-001' }, { id: 'CART-UI-007' }, { id: 'CART-API-002' }];
  assert.equal(nextId(tests, 'CART', 'UI'), 'CART-UI-008');
  assert.equal(nextId(tests, 'CART', 'API'), 'CART-API-003');
  assert.equal(nextId(tests, 'WISH', 'Performance'), 'WISH-PERF-001');
  assert.throws(() => nextId(tests, 'cart', 'UI'), /upper-case/);
  assert.throws(() => nextId(tests, 'CART', 'Mobile'), /layer must be/);
});

test('buildNewTest creates a valid planned case with trimmed fields and fresh tracking', () => {
  const t = buildNewTest('CART-UI-008', input, '2026-10-16T00:00:00.000Z');
  assert.deepEqual(validateTest(t), []);
  assert.deepEqual(t.steps, ['Open /cart.', 'Apply coupon "NOPE".']);
  assert.equal(t.automationTarget, 'Playwright');
  assert.equal(t.automationStatus, 'planned');
  assert.equal(t.latestResult, 'not run');
  assert.equal(t.scriptPath, '');
  assert.equal(t.lastExecuted, null);
});

test('a new case without steps or expected results is rejected', () => {
  const t = buildNewTest('CART-UI-008', { ...input, steps: [' '], expectedResults: [] });
  const errors = validateTest(t);
  assert.ok(errors.some((e) => e.includes('steps must contain at least one item')));
  assert.ok(errors.some((e) => e.includes('expectedResults must contain at least one item')));
});
