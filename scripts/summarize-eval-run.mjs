import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const agg = JSON.parse(fs.readFileSync(path.join(dir, 'aggregate-result.json'), 'utf8'));
for (const c of agg.cases) { c.arms.with ??= []; c.arms.without ??= []; }
const THRESHOLD = 0.8;
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => (xs.length ? sum(xs) / xs.length : null);
const fmt = (x) => (x === null ? 'n/a' : x.toFixed(2));
const cost = (r) => (r.costUsd || 0) + (r.judgeCostUsd || 0);

const skills = {};
for (const c of agg.cases) {
  const [skill, kind] = c.name.split('--');
  const s = (skills[skill] ??= { cases: [], cost: 0 });
  s.cases.push({ kind, c });
  for (const r of [...c.arms.with, ...c.arms.without]) s.cost += cost(r);
}

const rows = [];
for (const [skill, s] of Object.entries(skills)) {
  const outcome = s.cases.filter((x) => x.kind.startsWith('outcome'));
  const neg = s.cases.find((x) => x.kind === 'no-trigger');
  const usable = (r) => !r.skippedPaidGraders;
  const skipped = outcome.flatMap((x) => [...x.c.arms.with, ...x.c.arms.without]).filter((r) => !usable(r)).length;
  const withRuns = outcome.flatMap((x) => x.c.arms.with).filter(usable);
  const woRuns = outcome.flatMap((x) => x.c.arms.without).filter(usable);
  const fired = outcome.flatMap((x) =>
    x.c.arms.with.map((r) => r.graders.find((g) => g.name === 'skill-fired')?.passed === true),
  );
  const falsePos = neg ? neg.c.arms.with.map((r) => r.graders[0].passed === false) : [];
  const errors = [...withRuns, ...woRuns].filter((r) => r.error).length;
  const complete =
    s.cases.length === 3 && s.cases.every((x) => x.c.arms.with.length === 2 && x.c.arms.without.length === 2);
  const w = mean(withRuns.map((r) => r.score));
  const b = mean(woRuns.map((r) => r.score));
  const delta = w !== null && b !== null ? w - b : null;
  const fpRate = falsePos.length ? mean(falsePos.map(Number)) : null;
  let verdict;
  if (!complete) verdict = 'NOT RUN';
  else if (w < THRESHOLD || delta <= 0 || (fpRate ?? 0) > 0.2) verdict = 'FAIL';
  else verdict = 'PASS';
  rows.push({ skill, verdict, b, w, delta, nWith: withRuns.length, nWo: woRuns.length, fired: mean(fired.map(Number)), fpRate, errors, skipped, cost: s.cost });
}

const lines = [];
lines.push('| Skill | Verdict | Baseline | With skill | Delta | n per arm | Fired | False positive | Errors | Skipped by ceiling | Cost (USD) |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  lines.push(
    `| ${r.skill} | ${r.verdict} | ${fmt(r.b)} | ${fmt(r.w)} | ${r.delta === null ? 'n/a' : (r.delta >= 0 ? '+' : '') + r.delta.toFixed(2)} | ${r.nWith}/${r.nWo} | ${fmt(r.fired)} | ${fmt(r.fpRate)} | ${r.errors} | ${r.skipped} | ${r.cost.toFixed(2)} |`,
  );
}
const total = sum(agg.cases.flatMap((c) => [...c.arms.with, ...c.arms.without]).map(cost));
lines.push('');
lines.push(`Total cost summed from runs: ${total.toFixed(2)} USD. Partial: ${agg.partial} (${agg.partialReason ?? 'none'}).`);
console.log(lines.join('\n'));


