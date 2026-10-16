// End-to-end API test for adding cases: starts the real server against a temporary copy of the catalogue.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
let dir;
let dataFile;
let server;

const newCase = {
  area: 'CART',
  layer: 'UI',
  priority: 'P2',
  title: 'Cart shows a coupon field',
  objective: 'Shoppers can find where to enter a coupon.',
  risk: 'Promotions cannot be redeemed.',
  preconditions: ['App running at BASE_URL.'],
  testData: [],
  steps: ['Open /cart with one item.'],
  expectedResults: ['Step 1: a coupon field is visible.'],
  references: [],
};

const post = (body) => fetch(`${BASE}/api/tests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'test-manager-'));
  dataFile = join(dir, 'catalogue.json');
  await copyFile(fileURLToPath(new URL('../data/catalogue.json', import.meta.url)), dataFile);
  server = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], {
    env: { ...process.env, TEST_MANAGER_PORT: String(PORT), TEST_MANAGER_DATA: dataFile },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (chunk) => String(chunk).includes('running at') && resolve());
    server.on('exit', (code) => reject(new Error(`server exited with ${code}`)));
  });
});

after(async () => {
  server?.kill();
  if (dir) await rm(dir, { recursive: true, force: true });
});

test('POST /api/tests adds a planned case with the next free ID and persists it', async () => {
  const before = JSON.parse(await readFile(dataFile, 'utf8'));
  const res = await post(newCase);
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.equal(created.id, 'CART-UI-008');
  assert.equal(created.automationStatus, 'planned');
  assert.equal(created.latestResult, 'not run');

  const saved = JSON.parse(await readFile(dataFile, 'utf8'));
  assert.equal(saved.tests.length, before.tests.length + 1);
  assert.deepEqual(saved.tests.at(-1), created);

  const second = await (await post(newCase)).json();
  assert.equal(second.id, 'CART-UI-009');
});

test('POST /api/tests rejects a client-chosen id, unknown fields and invalid content without writing', async () => {
  const before = await readFile(dataFile, 'utf8');
  assert.equal((await post({ ...newCase, id: 'CART-UI-500' })).status, 400);
  assert.equal((await post({ ...newCase, automationStatus: 'automated' })).status, 400);
  const invalid = await post({ ...newCase, steps: [] });
  assert.equal(invalid.status, 422);
  assert.ok((await invalid.json()).details.some((d) => d.includes('steps must contain at least one item')));
  assert.equal((await post({ ...newCase, area: 'cart!' })).status, 422);
  assert.equal(await readFile(dataFile, 'utf8'), before);
});
