#!/usr/bin/env node
// Cross-model skill evaluation: does each skill make each model produce the right thing?
//
// For every case in cases.json and every maker model, the skill's SKILL.md becomes the
// system prompt and the case task the user turn. The answer must match every `must`
// pattern, then a model from a different family grades the rubric. One scorecard per run
// is written in the starlight-evals contract (lanes, metrics with provenance, caveats,
// weakness, ranAt/nextRunDue).
//
//   AI_GATEWAY_API_KEY=... MAX_USD=2 node evals/skill-eval/run.mjs
//
// Lanes whose credentials are missing are reported as `unavailable`, never as passing.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

// US-pinned hosts for open-weight models, read from the gateway's
// /v1/models/{id}/endpoints on 2026-09-26 (see agentic-ops dispatch_policy.yaml).
export const MAKERS = [
  { id: 'anthropic/claude-opus-5.5', family: 'anthropic', lane: 'claude-code-oauth' },
  { id: 'openai/gpt-6-luna', family: 'openai', lane: 'gateway' },
  { id: 'google/gemini-3.8-flash', family: 'google', lane: 'gateway' },
  { id: 'zai/glm-5.3', family: 'zhipu', lane: 'gateway', only: ['baseten', 'fireworks', 'deepinfra', 'modal', 'crusoe', 'digitalocean'] },
  { id: 'deepseek/deepseek-v4.1-flash', family: 'deepseek', lane: 'gateway', only: ['baseten', 'fireworks', 'deepinfra', 'modal', 'parasail'] },
  { id: 'moonshotai/kimi-k3', family: 'moonshot', lane: 'gateway' },
];
export const GRADERS = [
  { id: 'openai/gpt-6-luna', family: 'openai' },
  { id: 'anthropic/claude-haiku-4.5', family: 'anthropic' },
];
const RUBRIC_PASS = 0.6;

export function pickGrader(makerFamily) {
  return GRADERS.find((g) => g.family !== makerFamily);
}

export function failedPatterns(text, patterns) {
  return patterns.filter((p) => !new RegExp(p, 'i').test(text));
}

export function parseGrade(raw, items) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const scores = JSON.parse(match[0]).scores;
    if (!Array.isArray(scores) || scores.length !== items) return null;
    return scores.map((s) => (s === 1 || s === true ? 1 : 0));
  } catch {
    return null;
  }
}

export function costUsd(pricing, usage) {
  const input = Number(pricing?.input);
  const output = Number(pricing?.output);
  const inputTokens = usage?.inputTokens;
  const outputTokens = usage?.outputTokens;
  if (pricing?.input == null || pricing?.output == null || !Number.isFinite(input) || input < 0 || !Number.isFinite(output) || output < 0 ||
      !Number.isFinite(inputTokens) || inputTokens < 0 || !Number.isFinite(outputTokens) || outputTokens < 0 ||
      inputTokens + outputTokens === 0) return null;
  return inputTokens * input + outputTokens * output;
}

export function callCeilingUsd(pricing, system, prompt, maxOutputTokens = 2000) {
  // UTF-8 bytes overestimate ordinary token counts; extra headroom covers message framing.
  // This is a conservative reservation, not a provider-enforced hard spend limit.
  const inputTokens = Buffer.byteLength(system, 'utf8') + Buffer.byteLength(prompt, 'utf8') + 1024;
  return costUsd(pricing, { inputTokens, outputTokens: maxOutputTokens });
}

export function verdict(passRate) {
  if (passRate >= 0.8) return 'PROCEED';
  if (passRate >= 0.5) return 'REVISE';
  return 'STOP';
}

export function laneSummary(results, expected = results.length) {
  const graded = results.filter((r) => r.status === 'graded');
  if (results.every((r) => r.status === 'unavailable')) return { verdict: 'UNAVAILABLE', passRate: null, meanRubric: null };
  if (graded.length === 0) return { verdict: 'INCOMPLETE', passRate: 0, meanRubric: null };
  const passRate = graded.filter((r) => r.pass).length / expected;
  const meanRubric = graded.reduce((t, r) => t + r.rubricScore, 0) / graded.length;
  return { verdict: graded.length === expected ? verdict(passRate) : 'INCOMPLETE',
           passRate: +passRate.toFixed(3), meanRubric: +meanRubric.toFixed(3) };
}

export class Budget {
  constructor(maxUsd) {
    if (!Number.isFinite(maxUsd) || maxUsd <= 0 || maxUsd > 2) throw new Error('MAX_USD must be above 0 and at most 2 for this pilot');
    this.max = maxUsd; this.spent = 0; this.reserved = 0; this.unknown = false; this.breached = false;
  }
  reserve(usd) {
    if (!Number.isFinite(usd) || usd < 0) throw new Error('Cannot reserve an unknown call cost');
    if (this.exhausted || this.spent + this.reserved + usd > this.max) return false;
    this.reserved += usd;
    return true;
  }
  settle(reservation, actual) {
    this.reserved -= reservation;
    this.spent += actual;
    if (actual > reservation || this.spent > this.max) this.breached = true;
  }
  markUnknown(reservation) { this.reserved -= reservation; this.unknown = true; }
  get exhausted() { return this.unknown || this.breached || this.spent >= this.max; }
}

function skillBody(skillPath) {
  return readFileSync(join(ROOT, skillPath, 'SKILL.md'), 'utf8');
}

async function gatewayCall(generateText, model, system, prompt, only) {
  const { text, totalUsage, usage } = await generateText({
    model,
    system,
    prompt,
    maxOutputTokens: 2000,
    maxRetries: 0,
    ...(only ? { providerOptions: { gateway: { only } } } : {}),
  });
  return { text, usage: totalUsage ?? usage };
}

export async function budgetedGatewayCall(budget, pricing, model, system, prompt, invoke) {
  const ceiling = callCeilingUsd(pricing, system, prompt);
  if (ceiling === null) return { status: 'unpriced' };
  if (!budget.reserve(ceiling)) return { status: 'skipped-budget' };
  let response;
  try { response = await invoke(); }
  catch (error) { budget.markUnknown(ceiling); throw error; }
  const actual = costUsd(pricing, response.usage);
  if (actual === null) {
    budget.markUnknown(ceiling);
    return { status: 'metering-unavailable' };
  }
  budget.settle(ceiling, actual);
  return { status: budget.breached ? 'budget-breach' : 'ok', ...response, costUsd: actual };
}

function claudeCall(system, prompt) {
  // Unmodified Claude Code on the owner's own login (CLAUDE_CODE_OAUTH_TOKEN from
  // `claude setup-token`): allowed for your own repositories. Marginal cost is a share of
  // the subscription window; total_cost_usd is the API-equivalent, recorded as notional.
  const out = execFileSync('claude', ['-p', prompt, '--append-system-prompt', system, '--output-format', 'json', '--model', 'opus'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 10 * 60 * 1000 });
  const data = JSON.parse(out);
  return { text: data.result ?? '', usage: null, notionalUsd: data.total_cost_usd ?? null };
}

function gradePrompt(testCase, answer) {
  return [
    'Grade the ANSWER against each criterion. Score 1 only if the answer clearly meets it, else 0.',
    'Reply with JSON only: {"scores": [..one 0 or 1 per criterion, in order..]}',
    '', 'TASK:', testCase.task, '', 'CRITERIA:',
    ...testCase.rubric.map((c, i) => `${i + 1}. ${c}`), '', 'ANSWER:', answer,
  ].join('\n');
}

async function main() {
  const cases = JSON.parse(readFileSync(join(HERE, 'cases.json'), 'utf8')).cases;
  const budget = new Budget(Number(process.env.MAX_USD ?? 2));
  const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY);
  const hasClaude = Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN);
  const pricing = hasGateway
    ? Object.fromEntries((await (await fetch('https://ai-gateway.vercel.sh/v1/models')).json()).data.map((m) => [m.id, m.pricing]))
    : {};
  const { generateText } = hasGateway ? await import('ai') : {};

  const lanes = [];
  for (const maker of MAKERS) {
    const available = maker.lane === 'gateway' ? hasGateway : hasClaude && hasGateway;
    const results = [];
    let spent = 0;
    for (const testCase of cases) {
      if (!available) { results.push({ skill: testCase.skill, status: 'unavailable' }); continue; }
      if (budget.unknown || budget.breached) { results.push({ skill: testCase.skill, status: 'skipped-metering' }); continue; }
      if (budget.exhausted) { results.push({ skill: testCase.skill, status: 'skipped-budget' }); continue; }
      try {
        const system = skillBody(testCase.skill);
        const made = maker.lane === 'gateway'
          ? await budgetedGatewayCall(budget, pricing[maker.id], maker.id, system, testCase.task,
                                      () => gatewayCall(generateText, maker.id, system, testCase.task, maker.only))
          : { status: 'ok', costUsd: 0, ...claudeCall(system, testCase.task) };
        if (made.costUsd != null) spent += made.costUsd;
        if (made.status !== 'ok') { results.push({ skill: testCase.skill, status: made.status }); continue; }
        const missing = failedPatterns(made.text, testCase.must);
        const grader = pickGrader(maker.family);
        const prompt = gradePrompt(testCase, made.text);
        const graded = await budgetedGatewayCall(budget, pricing[grader.id], grader.id,
                                                'You are a strict, fair grader.', prompt,
                                                () => gatewayCall(generateText, grader.id, 'You are a strict, fair grader.', prompt));
        if (graded.costUsd != null) spent += graded.costUsd;
        if (graded.status !== 'ok') { results.push({ skill: testCase.skill, status: graded.status }); continue; }
        const scores = parseGrade(graded.text, testCase.rubric.length);
        if (!scores) { results.push({ skill: testCase.skill, status: 'grade-unparseable', grader: grader.id }); continue; }
        const rubricScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        results.push({
          skill: testCase.skill, status: 'graded', grader: grader.id, missingPatterns: missing,
          rubricScores: scores, rubricScore: +rubricScore.toFixed(3),
          pass: missing.length === 0 && rubricScore >= RUBRIC_PASS,
          costUsd: +(made.costUsd + graded.costUsd).toFixed(5),
          ...(made.notionalUsd != null ? { notionalSubscriptionUsd: made.notionalUsd } : {}),
        });
      } catch (error) {
        results.push({ skill: testCase.skill, status: 'error', error: String(error.message ?? error).slice(0, 200) });
      }
    }
    const summary = laneSummary(results, cases.length);
    lanes.push({
      lane: maker.id,
      verdict: summary.verdict,
      metrics: [
        { name: 'pass_rate', value: summary.passRate, sourceLane: 'evals/skill-eval/run.mjs' },
        { name: 'mean_rubric', value: summary.meanRubric, sourceLane: 'evals/skill-eval/run.mjs' },
        { name: 'metered_cost_usd', value: +spent.toFixed(4), sourceLane: 'gateway /v1/models list prices x reported usage' },
      ],
      caveats: [
        `n=${results.filter((r) => r.status === 'graded').length} graded of ${cases.length} cases`,
        'one task per skill; rubric graded by a single model from another family',
        ...(budget.unknown ? ['at least one metered call has unknown usage; total spend is unknown'] : []),
        ...(budget.breached ? ['a call exceeded its local reservation; no further calls were made'] : []),
        ...(maker.only ? [`hosts pinned to ${maker.only.join(', ')}`] : []),
      ],
      weakness: 'Tests the skill as a system prompt, not whether a harness triggers it on its own.',
      results,
    });
  }

  const ranAt = new Date();
  const scorecard = {
    runId: `skill-eval-${ranAt.toISOString().slice(0, 10)}`,
    ranAt: ranAt.toISOString().slice(0, 10),
    nextRunDue: new Date(ranAt.getTime() + 30 * 86400000).toISOString().slice(0, 10),
    cadence: 'monthly + on skill change',
    antiGoodhart: 'These numbers describe how skills transfer across models; do not tune skills to the rubric.',
    budgetUsd: budget.max,
    spentUsd: budget.unknown ? null : +budget.spent.toFixed(4),
    knownSpentUsd: +budget.spent.toFixed(4),
    spendKnown: !budget.unknown,
    budgetBreached: budget.breached,
    lanes,
  };
  const outDir = join(HERE, 'scorecards');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${scorecard.runId}.json`);
  writeFileSync(outPath, JSON.stringify(scorecard, null, 2));
  console.log(`scorecard -> ${outPath}; spent ${scorecard.spendKnown ? `$${scorecard.spentUsd}` : 'unknown'} of $${budget.max} local allocation`);
  for (const lane of lanes) console.log(`${lane.verdict.padEnd(11)} ${lane.lane}  pass=${lane.metrics[0].value}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
