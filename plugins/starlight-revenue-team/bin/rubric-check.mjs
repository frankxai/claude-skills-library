#!/usr/bin/env node
// Validates a /critic score file. Model-free on purpose: the gate must not be
// something a model can talk its way past.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CRITERIA = ['sourceTruth', 'saysSomethingNew', 'voice', 'readerOutcome', 'craft', 'brandFit'];
export const SHIP_AT = 26;
export const REVISE_AT = 22;

const valueOf = (entry) => (entry !== null && typeof entry === 'object' ? entry.score : entry);
const sameProvider = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

export function checkScore(score) {
  if (score === null || typeof score !== 'object' || Array.isArray(score)) {
    return { ok: false, errors: ['score must be a JSON object'] };
  }
  const errors = [];
  const criteria = score.criteria;
  if (criteria === null || typeof criteria !== 'object' || Array.isArray(criteria)) {
    return { ok: false, errors: ['criteria object is missing'] };
  }
  for (const name of CRITERIA) {
    if (!(name in criteria)) errors.push(`criterion missing: ${name}`);
  }
  for (const name of Object.keys(criteria)) {
    if (!CRITERIA.includes(name)) errors.push(`unknown criterion: ${name}`);
  }
  for (const name of CRITERIA) {
    if (!(name in criteria)) continue;
    const v = valueOf(criteria[name]);
    if (!Number.isInteger(v) || v < 0 || v > 5) errors.push(`${name} must be an integer from 0 to 5`);
  }
  if (!score.makerProvider || !score.scorerProvider) errors.push('makerProvider and scorerProvider are both required');
  if (errors.length) return { ok: false, errors };

  const total = CRITERIA.reduce((sum, name) => sum + valueOf(criteria[name]), 0);
  if (score.total !== undefined && score.total !== total) {
    return { ok: false, errors: [`total ${score.total} does not equal the sum of criteria ${total}`] };
  }
  const independent = !sameProvider(score.makerProvider, score.scorerProvider);
  let verdict;
  if (!independent) verdict = 'missing-independent';
  else if (total >= SHIP_AT) verdict = 'ship';
  else if (total >= REVISE_AT) verdict = 'revise';
  else verdict = 'restart';
  return { ok: true, total, independent, verdict };
}

export function exitCodeFor(result) {
  if (!result.ok) return 1;
  return result.verdict === 'ship' ? 0 : 2;
}

function main(argv) {
  const file = argv[2];
  if (!file) {
    console.error('usage: rubric-check.mjs <score.json>');
    return 1;
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`cannot read ${file}: ${err.message}`);
    return 1;
  }
  const result = checkScore(parsed);
  console.log(JSON.stringify(result, null, 2));
  return exitCodeFor(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv);
}
