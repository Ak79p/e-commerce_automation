// Plan staleness depends only on requirement fields. Run: cd test-manager && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REQUIREMENT_FIELDS, parsePlan, planFreshness, requirementFingerprint } from '../lib/plans.mjs';

const baseCase = {
  id: 'CHK-UI-001',
  title: 'Signed-in shopper places a Cash on Delivery order',
  layer: 'UI',
  priority: 'P0',
  preconditions: ['App running at BASE_URL.', 'Signed in as TEST_USER_EMAIL; cart holds PROD-017 x1.'],
  testData: ['Phone 9876543210', 'PIN 560038'],
  steps: ['Open /checkout.', 'Fill the shipping form and place the order.'],
  expectedResults: ['Step 1: checkout-total is 389.', 'Step 2: the URL is /order-confirmation/ORD-100001.'],
  automationStatus: 'planned',
  scriptPath: '',
  latestResult: 'not run',
  lastExecuted: null,
  notes: '',
  updatedAt: '2026-10-11T14:46:17Z',
};

const planFor = (fingerprint, status = 'APPROVED') =>
  `# Plan: CHK-UI-001\n\n| Field | Value |\n|---|---|\n| Plan status | ${status} |\n| Requirement fingerprint | \`${fingerprint}\` |\n`;

test('fingerprint is deterministic and covers exactly the requirement fields', () => {
  assert.deepEqual(REQUIREMENT_FIELDS, ['title', 'preconditions', 'testData', 'steps', 'expectedResults']);
  assert.equal(requirementFingerprint(baseCase), requirementFingerprint({ ...baseCase }));
  assert.match(requirementFingerprint(baseCase), /^sha256:[0-9a-f]{16}$/);
});

test('tracking-only changes keep the plan fresh', () => {
  const plan = parsePlan(planFor(requirementFingerprint(baseCase)));
  const tracked = {
    ...baseCase,
    automationStatus: 'automated',
    scriptPath: 'tests/playwright/ui/chk-ui.spec.ts',
    latestResult: 'passed',
    lastExecuted: '2026-10-12',
    notes: '[2026-10-12 10:31] PASSED via: …',
    updatedAt: '2026-10-12T05:00:00.000Z',
  };
  const result = planFreshness(plan, tracked);
  assert.equal(result.fresh, true, result.reason);
});

for (const field of REQUIREMENT_FIELDS) {
  test(`a change to ${field} makes the plan stale`, () => {
    const plan = parsePlan(planFor(requirementFingerprint(baseCase)));
    const value = baseCase[field];
    const changed = { ...baseCase, [field]: Array.isArray(value) ? [...value, 'one more line'] : `${value} (edited)` };
    const result = planFreshness(plan, changed);
    assert.equal(result.fresh, false);
    assert.match(result.reason, /Requirement fields changed/);
  });
}

test('reordering steps or expected results makes the plan stale', () => {
  const plan = parsePlan(planFor(requirementFingerprint(baseCase)));
  assert.equal(planFreshness(plan, { ...baseCase, steps: [...baseCase.steps].reverse() }).fresh, false);
  assert.equal(planFreshness(plan, { ...baseCase, expectedResults: [...baseCase.expectedResults].reverse() }).fresh, false);
});

test('a plan without a fingerprint is stale (never silently trusted)', () => {
  const legacy = '| Field | Value |\n|---|---|\n| Plan status | APPROVED |\n| Catalogue updatedAt | 2026-10-11T14:46:17Z |\n';
  const result = planFreshness(parsePlan(legacy), baseCase);
  assert.equal(result.fresh, false);
  assert.equal(result.recorded, null);
});

test('freshness never changes the plan status (approval gates stay with the user)', () => {
  for (const status of ['DRAFT', 'APPROVED', 'IMPLEMENTED']) {
    const parsed = parsePlan(planFor(requirementFingerprint(baseCase), status));
    assert.equal(parsed.status, status);
    planFreshness(parsed, baseCase);
    assert.equal(parsed.status, status);
  }
});
