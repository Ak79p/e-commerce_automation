// Prints a Markdown table of test outcomes per Playwright project (desktop / mobile) from a JSON report.
// Usage: node scripts/summarize-results.mjs <results.json> [title]
import { readFileSync } from 'node:fs';

const [file, title = 'Test results'] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node scripts/summarize-results.mjs <results.json> [title]');
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  console.log(`### ${title}\n\nNo JSON report at \`${file}\` (${error.code ?? error.message}).`);
  process.exit(0);
}

const KIND = { setup: 'setup', ui: 'desktop', 'ui-firefox': 'desktop', 'ui-webkit': 'desktop', 'mobile-chrome': 'mobile', 'mobile-safari': 'mobile' };
const rows = new Map();
const visit = (suite) => {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const row = rows.get(t.projectName) ?? { passed: 0, failed: 0, flaky: 0, skipped: 0 };
      if (t.status === 'expected') row.passed += 1;
      else if (t.status === 'unexpected') row.failed += 1;
      else if (t.status === 'flaky') row.flaky += 1;
      else row.skipped += 1;
      rows.set(t.projectName, row);
    }
  }
  for (const child of suite.suites ?? []) visit(child);
};
for (const suite of report.suites ?? []) visit(suite);

const lines = [`### ${title}`, '', '| Project | Type | Passed | Failed | Flaky | Skipped |', '| --- | --- | ---: | ---: | ---: | ---: |'];
const total = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
for (const [project, r] of [...rows].sort(([a], [b]) => a.localeCompare(b))) {
  lines.push(`| ${project} | ${KIND[project] ?? 'other'} | ${r.passed} | ${r.failed} | ${r.flaky} | ${r.skipped} |`);
  for (const k of Object.keys(total)) total[k] += r[k];
}
lines.push(`| **Total** | | **${total.passed}** | **${total.failed}** | **${total.flaky}** | **${total.skipped}** |`);
console.log(lines.join('\n'));
