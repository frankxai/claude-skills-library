#!/usr/bin/env node
// Validates a /critic score file. Model-free on purpose: the gate must not be
// something a model can talk its way past.
//
// `criteria` holds the independent provider's scores exactly as it returned them.
// An optional `secondOpinion` holds another pass (usually the maker's critic); the
// verdict uses the lower of the two totals, so a friendlier second pass can never
// lift a revise into a ship.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CRITERIA = ['sourceTruth', 'saysSomethingNew', 'voice', 'readerOutcome', 'craft', 'brandFit'];
export const SHIP_AT = 26;
export const REVISE_AT = 22;
const COMMIT = /^[0-9a-f]{40}$/i;

// Aliases map harness and model names to the company that serves them, so
// "claude" and "anthropic" are recognised as the same provider.
const PROVIDERS = {
  anthropic: ['anthropic', 'claude'],
  openai: ['openai', 'codex', 'gpt', 'chatgpt'],
  google: ['google', 'gemini', 'agy', 'antigravity'],
  xai: ['xai', 'grok'],
  mistral: ['mistral'],
  deepseek: ['deepseek'],
  meta: ['meta', 'llama'],
};

export function canonicalProvider(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().toLowerCase();
  if (!name) return null;
  for (const [provider, aliases] of Object.entries(PROVIDERS)) {
    if (aliases.includes(name)) return provider;
  }
  return null;
}

const valueOf = (entry) => (entry !== null && typeof entry === 'object' ? entry.score : entry);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function checkCriteria(criteria, label) {
  if (!isPlainObject(criteria)) return { errors: [`${label}: criteria object is missing`] };
  const errors = [];
  for (const name of CRITERIA) if (!(name in criteria)) errors.push(`${label}: criterion missing: ${name}`);
  for (const name of Object.keys(criteria)) if (!CRITERIA.includes(name)) errors.push(`${label}: unknown criterion: ${name}`);
  for (const name of CRITERIA) {
    if (!(name in criteria)) continue;
    const v = valueOf(criteria[name]);
    if (!Number.isInteger(v) || v < 0 || v > 5) errors.push(`${label}: ${name} must be an integer from 0 to 5`);
  }
  if (errors.length) return { errors };
  return { errors, total: CRITERIA.reduce((sum, name) => sum + valueOf(criteria[name]), 0) };
}

// targetDigest: the sha256 of the scored file when it exists locally, else undefined.
export function checkScore(score, { targetDigest } = {}) {
  if (!isPlainObject(score)) return { ok: false, errors: ['score must be a JSON object'] };
  const errors = [];

  const maker = canonicalProvider(score.makerProvider);
  const scorer = canonicalProvider(score.scorerProvider);
  if (!maker) errors.push('makerProvider must name a known provider (for example anthropic, openai, google, xai)');
  if (!scorer) errors.push('scorerProvider must name a known provider (for example anthropic, openai, google, xai)');

  const primary = checkCriteria(score.criteria, 'criteria');
  errors.push(...primary.errors);
  if (primary.total !== undefined && score.total !== undefined && score.total !== primary.total) {
    errors.push(`total ${score.total} does not equal the sum of criteria ${primary.total}`);
  }

  let second;
  if (score.secondOpinion !== undefined) {
    if (!isPlainObject(score.secondOpinion)) errors.push('secondOpinion must be an object');
    else {
      if (!canonicalProvider(score.secondOpinion.provider)) errors.push('secondOpinion.provider must name a known provider');
      second = checkCriteria(score.secondOpinion.criteria, 'secondOpinion');
      errors.push(...second.errors);
    }
  }

  if (targetDigest !== undefined) {
    if (typeof score.targetSha256 !== 'string') errors.push('targetSha256 is required when the target is a local file');
    else if (score.targetSha256.toLowerCase() !== targetDigest) errors.push('targetSha256 does not match the target: it changed after it was scored');
  }

  if (score.targetCommit !== undefined && !COMMIT.test(String(score.targetCommit))) {
    errors.push('targetCommit must be a full 40-character commit SHA');
  }

  if (errors.length) return { ok: false, errors };

  // A ship verdict must say exactly what was scored: a local file whose digest
  // matched, or a full commit SHA for a PR or deployed page.
  const bound = targetDigest !== undefined || COMMIT.test(String(score.targetCommit ?? ''));
  const independent = maker !== scorer;
  const total = second ? Math.min(primary.total, second.total) : primary.total;
  let verdict;
  if (!independent) verdict = 'missing-independent';
  else if (!bound) verdict = 'unbound-target';
  else if (total >= SHIP_AT) verdict = 'ship';
  else if (total >= REVISE_AT) verdict = 'revise';
  else verdict = 'restart';
  return { ok: true, total, independentTotal: primary.total, secondTotal: second ? second.total : null, independent, verdict };
}

export function exitCodeFor(result) {
  if (!result.ok) return 1;
  return result.verdict === 'ship' ? 0 : 2;
}

function digestOfTarget(score, scoreFile) {
  if (!isPlainObject(score) || typeof score.target !== 'string' || /^[a-z]+:\/\//i.test(score.target)) return undefined;
  const path = resolve(dirname(scoreFile), score.target);
  if (!existsSync(path) || !statSync(path).isFile()) return undefined;
  return createHash('sha256').update(readFileSync(path)).digest('hex');
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
  const result = checkScore(parsed, { targetDigest: digestOfTarget(parsed, file) });
  console.log(JSON.stringify(result, null, 2));
  return exitCodeFor(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv);
}
