// Catalogue schema: validation and normalisation shared by the server (authoritative)
// and mirrored in the browser for instant feedback.

export const ENUMS = {
  layer: ['API', 'UI', 'Performance'],
  priority: ['P0', 'P1', 'P2'],
  automationStatus: ['planned', 'in progress', 'automated'],
  automationTarget: ['Playwright', 'k6'],
  latestResult: ['not run', 'passed', 'failed', 'blocked'],
};

export const ID_PATTERN = /^[A-Z]+-(API|UI|PERF)-\d{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const STRING_FIELDS = ['title', 'objective', 'risk'];
const LIST_FIELDS = ['preconditions', 'testData', 'steps', 'expectedResults', 'references'];
const REQUIRED_NON_EMPTY_LISTS = ['steps', 'expectedResults'];

const LAYER_BY_ID_KIND = { API: 'API', UI: 'UI', PERF: 'Performance' };
/** Functional areas of ShopNest (the AREA segment of an ID) with their display name and Playwright tag. */
export const AREAS = {
  AUTH: { name: 'Sign-up and login', tag: '@auth' },
  SRCH: { name: 'Product search', tag: '@search' },
  PROD: { name: 'Product details', tag: '@product' },
  CART: { name: 'Shopping cart', tag: '@cart' },
  CHK: { name: 'Checkout and order placement', tag: '@checkout' },
  NAV: { name: 'Site navigation', tag: '@navigation' },
  MOB: { name: 'Mobile browser (device emulation)', tag: '@mobile' },
};
/** Spec file base names that differ from the lower-cased AREA (MOB cases live in mobile-ui.spec.ts). */
const FILE_BY_AREA = { MOB: 'mobile' };
const KIND_BY_LAYER = { API: 'API', UI: 'UI', Performance: 'PERF' };
export const AREA_PATTERN = /^[A-Z]{2,10}$/;

/**
 * Deterministic placement: the one file a case's automation lives in, and its tags, derived
 * from the ID alone (<AREA>-<KIND>-<NNN>). Related cases share a file:
 *   AUTH-UI-003  → tests/playwright/ui/auth-ui.spec.ts     tags @ui @auth
 *   MOB-UI-002   → tests/playwright/ui/mobile-ui.spec.ts   tags @ui @mobile
 *   CART-PERF-001 → tests/k6/scripts/CART-PERF-001.js      k6 tags { category: 'performance', case_id }
 */
export function placementFor(id) {
  const [area, kind] = id.split('-');
  if (kind === 'PERF') {
    return { scriptPath: `tests/k6/scripts/${id}.js`, k6Tags: { category: 'performance', case_id: id } };
  }
  const folder = kind.toLowerCase();
  return {
    scriptPath: `tests/playwright/${folder}/${FILE_BY_AREA[area] ?? area.toLowerCase()}-${folder}.spec.ts`,
    tags: [`@${folder}`, AREAS[area]?.tag ?? `@${area.toLowerCase()}`],
  };
}

/** Fields a PATCH may change. `id` is deliberately absent: IDs are permanent. */
export const EDITABLE_FIELDS = [
  ...STRING_FIELDS,
  ...LIST_FIELDS,
  ...Object.keys(ENUMS),
  'scriptPath',
  'lastExecuted',
  'notes',
];

/** Returns a list of human-readable problems for one test case (empty = valid). */
export function validateTest(test) {
  const errors = [];
  const where = test && typeof test.id === 'string' ? test.id : '(unknown id)';
  if (!test || typeof test !== 'object' || Array.isArray(test)) return [`${where}: test case must be an object`];

  if (typeof test.id !== 'string' || !ID_PATTERN.test(test.id)) {
    errors.push(`${where}: id must match ${ID_PATTERN} (e.g. CART-UI-003)`);
  }
  for (const f of STRING_FIELDS) {
    if (typeof test[f] !== 'string' || !test[f].trim()) errors.push(`${where}: ${f} must be a non-empty string`);
  }
  for (const f of LIST_FIELDS) {
    if (!Array.isArray(test[f]) || test[f].some((x) => typeof x !== 'string')) {
      errors.push(`${where}: ${f} must be an array of strings`);
    } else if (REQUIRED_NON_EMPTY_LISTS.includes(f) && test[f].length === 0) {
      errors.push(`${where}: ${f} must contain at least one item`);
    }
  }
  for (const [f, allowed] of Object.entries(ENUMS)) {
    if (!allowed.includes(test[f])) errors.push(`${where}: ${f} must be one of ${allowed.join(', ')}`);
  }
  if (typeof test.scriptPath !== 'string') errors.push(`${where}: scriptPath must be a string (may be empty)`);
  if (typeof test.notes !== 'string') errors.push(`${where}: notes must be a string (may be empty)`);
  if (test.lastExecuted !== null && !(typeof test.lastExecuted === 'string' && DATE_PATTERN.test(test.lastExecuted))) {
    errors.push(`${where}: lastExecuted must be null or YYYY-MM-DD`);
  }
  if (test.layer === 'Performance' && test.automationTarget !== 'k6') {
    errors.push(`${where}: Performance tests must target k6`);
  }
  if ((test.layer === 'API' || test.layer === 'UI') && test.automationTarget !== 'Playwright') {
    errors.push(`${where}: API and UI tests must target Playwright`);
  }
  if (test.automationStatus === 'automated' && !test.scriptPath) {
    errors.push(`${where}: an automated test needs a scriptPath`);
  }
  if (typeof test.id === 'string' && ID_PATTERN.test(test.id)) {
    const kind = test.id.split('-')[1];
    if (ENUMS.layer.includes(test.layer) && LAYER_BY_ID_KIND[kind] !== test.layer) {
      errors.push(`${where}: layer must be ${LAYER_BY_ID_KIND[kind]} for a -${kind}- ID`);
    }
    const expected = placementFor(test.id).scriptPath;
    if (typeof test.scriptPath === 'string' && test.scriptPath && test.scriptPath !== expected) {
      errors.push(`${where}: scriptPath must be ${expected} (derived from the ID)`);
    }
  }
  return errors;
}

/** Validates a whole catalogue document. */
export function validateCatalogue(doc) {
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.tests)) {
    return ['catalogue must be an object with a "tests" array'];
  }
  const errors = [];
  const seen = new Set();
  for (const t of doc.tests) {
    errors.push(...validateTest(t));
    if (t && typeof t.id === 'string') {
      if (seen.has(t.id)) errors.push(`${t.id}: duplicate id`);
      seen.add(t.id);
    }
  }
  return errors;
}

/**
 * The next free ID in an AREA-LAYER group: one more than the highest number ever used in that group,
 * so numbers are never reused while the group's cases exist. Throws on an invalid area or layer.
 */
export function nextId(tests, area, layer) {
  if (typeof area !== 'string' || !AREA_PATTERN.test(area)) throw new Error('area must be 2-10 upper-case letters (e.g. CART)');
  const kind = KIND_BY_LAYER[layer];
  if (!kind) throw new Error(`layer must be one of ${ENUMS.layer.join(', ')}`);
  const prefix = `${area}-${kind}-`;
  const used = tests.filter((t) => typeof t.id === 'string' && t.id.startsWith(prefix)).map((t) => Number(t.id.slice(prefix.length)));
  const next = (used.length ? Math.max(...used) : 0) + 1;
  if (next > 999) throw new Error(`No free ID left in ${prefix}NNN`);
  return `${prefix}${String(next).padStart(3, '0')}`;
}

/** Fields a new case may supply; everything else starts at its "not automated yet" default. */
export const CREATE_FIELDS = [...STRING_FIELDS, ...LIST_FIELDS, 'layer', 'priority'];

/**
 * Builds a complete new test case from user input and a server-assigned ID. Tracking fields always start
 * fresh (planned / not run) and the target follows the layer, so a new case can't claim results it never had.
 */
export function buildNewTest(id, input, now = new Date().toISOString()) {
  const t = { id };
  for (const f of STRING_FIELDS) t[f] = typeof input[f] === 'string' ? input[f].trim() : input[f];
  for (const f of LIST_FIELDS) {
    t[f] = Array.isArray(input[f]) ? input[f].map((x) => (typeof x === 'string' ? x.trim() : x)).filter((x) => x !== '') : input[f] ?? [];
  }
  t.layer = input.layer;
  t.priority = input.priority;
  t.automationTarget = input.layer === 'Performance' ? 'k6' : 'Playwright';
  t.automationStatus = 'planned';
  t.scriptPath = '';
  t.latestResult = 'not run';
  t.lastExecuted = null;
  t.notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  t.updatedAt = now;
  return t;
}

/** Keeps only known fields so imports cannot smuggle arbitrary data into the file. */
export function normaliseTest(t) {
  const out = { id: t.id };
  for (const f of EDITABLE_FIELDS) out[f] = t[f];
  out.updatedAt = typeof t.updatedAt === 'string' ? t.updatedAt : new Date().toISOString();
  return out;
}
