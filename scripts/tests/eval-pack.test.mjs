// Structural tests for the skills-with-evals pack. No network, no model, no claude binary.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSkill, parseFrontmatter } from '../trigger-lint.mjs';
import { BUDGET, boundarySection, dollarArgs, qualitySkill, scanBody } from '../skill-quality.mjs';
import { cardData, coverage, currentHashes, firstClause, flagshipData, flagshipMeasures, plantedDefects, renderCard, renderFlagshipMd, staleness, withFlagship } from '../eval-card.mjs';
import { pickCommand, shellArgs } from '../install-test.mjs';
import { baselineScore, comparability, firedRate, reviewLift } from '../eval-skill.mjs';
import { acquireLock, appendLedger, checkOutputs, decide, expectedOutputs, haltsPack, isolationProblems, ledgerState, parseArgs as packArgs, readLedger, reconcile, runPack } from '../run-pack-lift.mjs';
import { mkdtempSync, rmSync, writeFileSync as writeF, mkdirSync as mkdirS } from 'node:fs';
import { hostname, tmpdir } from 'node:os';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACK = JSON.parse(readFileSync(join(REPO, 'products/skills-with-evals/pack.json'), 'utf8'));
const MARKET = JSON.parse(readFileSync(join(REPO, '.claude-plugin/marketplace.json'), 'utf8'));
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

test('every pack skill has a recall, a precision and a no-trigger case, and one grader per answer-key entry', () => {
  assert.equal(PACK.skills.length, 10);
  for (const s of PACK.skills) {
    const suite = join(REPO, 'evals', s);
    const key = readFileSync(join(suite, 'seeded-defects', 'KEY.md'), 'utf8').split('\n').filter((l) => /^\d+\.\s/.test(l) || /^\|\s*\d+\s*\|/.test(l));
    const graders = readdirSync(join(suite, 'seeded-defects', 'graders')).filter((f) => /^d\d+-/.test(f));
    assert.ok(key.length >= 7, `${s}: at least 7 planted defects (has ${key.length})`);
    assert.equal(graders.length, key.length, `${s}: one grader per planted defect`);
    const cleanDir = ['clean', 'clean-form', 'clean-chapter', 'clean-section'].map((c) => join(suite, c)).find(existsSync);
    assert.ok(cleanDir, `${s}: has a clean (precision) case`);
    assert.ok(readdirSync(join(cleanDir, 'graders')).some((f) => f === 'no-unsupported-claims.md'), `${s}: precision grader`);
    const nt = readFileSync(join(suite, 'no-trigger', 'case.yaml'), 'utf8');
    assert.match(nt, /should-not-trigger/);
    assert.match(nt, /max: 0/);
    assert.match(nt, /arm: both/);
  }
});

test('no case.yaml uses an escape YAML double-quoted strings reject (a case that cannot load is a silent hole)', () => {
  const bad = [];
  for (const f of walk(join(REPO, 'evals')).filter((p) => p.endsWith('case.yaml'))) {
    for (const [i, line] of readFileSync(f, 'utf8').split('\n').entries()) {
      for (const m of line.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
        const esc = m[1].match(/\\(.)/g) || [];
        for (const e of esc) if (!/\\[0abtnvfre "\/\\N_LPxuU\t]/.test(e)) bad.push(`${f.slice(REPO.length + 1)}:${i + 1} ${e}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test('the pack marketplace entry lists exactly the pack skills, by paths that exist, under a name Claude Code allows', () => {
  const entry = MARKET.plugins.find((p) => p.name === 'skills-with-evals');
  assert.ok(entry);
  assert.doesNotMatch(entry.name, /^(claude-|anthropic-|anthropics-|cc-plugin-)|^(claude|anthropic|anthropics|claude-code|claude-mods)$/);
  const names = entry.skills.map((p) => p.split('/').pop());
  assert.deepEqual([...names].sort(), [...PACK.skills].sort());
  for (const p of entry.skills) assert.ok(existsSync(join(REPO, p, 'SKILL.md')), p);
});

test('catalog/skills.json is regenerated whenever marketplace.json or a SKILL.md changes (build-catalog --check)', async () => {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, [join(REPO, 'scripts', 'build-catalog.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const cat = JSON.parse(readFileSync(join(REPO, 'catalog', 'skills.json'), 'utf8'));
  const paths = new Set(cat.plugins.flatMap((p) => (p.skills || []).map((s) => s.path)));
  assert.equal(cat.totals.skills, paths.size, 'a skill listed by two plugins is counted once');
  for (const s of PACK.skills) {
    const entry = cat.plugins.flatMap((p) => p.skills || []).find((x) => x.name === s);
    assert.equal(entry?.hasEvals, true, `${s}: hasEvals sees evals/${s}/`);
  }
});

test('no plugin in the marketplace uses a name Claude Code reserves (claude plugin validate rule)', () => {
  const reserved = /^(claude-|anthropic-|anthropics-|cc-plugin-)|^(claude|anthropic|anthropics|claude-code|claude-mods)$|official.*(claude|anthropic)|(claude|anthropic).*official/;
  for (const p of MARKET.plugins) assert.doesNotMatch(p.name, reserved, `plugin name "${p.name}" is reserved`);
  assert.equal(MARKET.plugins[0].name, 'frankx-skills');
});

test('trigger-lint finds the cue position, parses folded descriptions, and fails a broken name', () => {
  const fm = parseFrontmatter('---\nname: x\ndescription: >-\n  Reviews diffs.\n  Use when a PR is opened.\n---\nbody\n');
  assert.equal(fm.fm.description, 'Reviews diffs. Use when a PR is opened.');
  const seeded = lintSkill(join(REPO, 'evals/skill-builder/seeded-defects/resources/deploy-helper'));
  assert.ok(seeded.errors.some((e) => /not lowercase-hyphen/.test(e)));
  assert.ok(seeded.errors.some((e) => /1024/.test(e)));
  const clean = lintSkill(join(REPO, 'evals/skill-builder/clean/resources/db-migration-check'));
  assert.deepEqual(clean.errors, []);
  assert.ok(clean.cueAt !== null && clean.cueAt <= 100, `clean fixture cue within Codex window (at ${clean.cueAt})`);
});

test('cards are generated from files and never claim lift without a result file', () => {
  for (const s of PACK.skills) {
    const card = renderCard(s);
    assert.equal(readFileSync(join(REPO, 'evals', s, 'CARD.md'), 'utf8'), card, `${s}: CARD.md is stale; run node scripts/eval-card.mjs`);
    const hasResult = existsSync(join(REPO, 'evals', s, 'results')) && readdirSync(join(REPO, 'evals', s, 'results')).some((f) => f.endsWith('.json'));
    if (!hasResult) assert.match(card, /Not measured yet\. No lift is claimed\./);
  }
});

test('run-pack-lift parses caps, rejects skills outside the pack, and halts only on auth or rate-limit stops', () => {
  const o = packArgs(['--skills', 'github-code-review,nextjs-expert', '--per-skill-usd', '1', '--runs', '1']);
  assert.deepEqual(o.skillList, ['github-code-review', 'nextjs-expert']);
  assert.equal(o.model, 'sonnet');
  assert.equal(packArgs([])['total-usd'], '50');
  assert.throws(() => packArgs(['--skills', 'not-a-pack-skill']), /not in the pack/);
  assert.throws(() => packArgs(['--per-skill-usd', '0']), /positive/);
  assert.throws(() => packArgs(['--bogus', '1']), /unknown option/);
  assert.equal(haltsPack('auth_failed'), true);
  assert.equal(haltsPack('rate_limited'), true);
  assert.equal(haltsPack('cost_ceiling'), false);
  assert.equal(haltsPack(undefined), false);
});

test('isolationProblems passes a clean pair of runs and flags foreign plugins, leaked pack skills and a skill in the baseline arm', () => {
  const dir = mkdtempSync(join(tmpdir(), 'iso-'));
  const init = (plugins, skills) => JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-sonnet-5-5', plugins, skills }) + '\n';
  const builtin = { name: 'cc-plugin-agents-md', source: 'cc-plugin-agents-md@builtin' };
  const staged = { name: 'eval-nextjs-expert', source: 'eval-nextjs-expert@inline' };
  const files = {
    w: init([staged, builtin], ['code-review', 'eval-nextjs-expert:nextjs-expert']),
    wo: init([builtin], ['code-review']),
    bad: init([builtin, { name: 'frankx-skills', source: 'frankx-skills@claude-skills-library' }], ['frankx-skills:github-code-review']),
    leak: init([staged], ['eval-nextjs-expert:nextjs-expert']),
  };
  for (const [k, v] of Object.entries(files)) writeF(join(dir, `${k}.jsonl`), v);
  const r = (w, wo) => ({ cases: [{ name: 'c', arms: { with: [{ tracePath: `${w}.jsonl` }], without: [{ tracePath: `${wo}.jsonl` }] } }] });
  const ok = isolationProblems(r('w', 'wo'), 'nextjs-expert', dir);
  assert.deepEqual(ok.problems, []);
  assert.deepEqual(ok.models, ['claude-sonnet-5-5']);
  assert.match(isolationProblems(r('w', 'bad'), 'nextjs-expert', dir).problems.join(' '), /unexpected plugin\(s\) frankx-skills/);
  assert.match(isolationProblems(r('w', 'leak'), 'nextjs-expert', dir).problems.join(' '), /no-skill arm loaded the skill/);
  assert.match(isolationProblems(r('w', 'missing'), 'nextjs-expert', dir).problems.join(' '), /no trace/);
});

test('cardData gives the page the same facts as the card, with lift null until a result exists', () => {
  for (const s of PACK.skills) {
    const d = cardData(s);
    assert.ok(d.job && d.test && d.planted >= 7 && d.clean && d.quietTask, `${s}: complete card data`);
    const hasResult = existsSync(join(REPO, 'evals', s, 'results')) && readdirSync(join(REPO, 'evals', s, 'results')).some((f) => f.endsWith('.json'));
    if (!hasResult) assert.equal(d.lift, null);
  }
});

test('skill-builder teaches the name rule its own graders enforce (G3 P0-2)', () => {
  const skill = readFileSync(join(REPO, 'free-skills/skill-builder/SKILL.md'), 'utf8');
  const lines = skill.split('\n');
  const SPEC = /^[a-z0-9][a-z0-9-]{0,63}$/;
  // Every name: example must follow the spec unless it is explicitly marked as a wrong example.
  lines.forEach((l, i) => {
    const m = /^\s*name:\s*(.+?)\s*(#.*)?$/.exec(l);
    if (!m) return;
    const value = m[1].replace(/^["']|["']$/g, '');
    const markedWrong = /❌|WRONG/.test(l) || lines.slice(Math.max(0, i - 2), i).some((p) => /❌|WRONG/.test(p));
    if (!markedWrong) assert.match(value, SPEC, `SKILL.md line ${i + 1} teaches name "${value}"`);
  });
  assert.doesNotMatch(skill, /Title Case/, 'no Title Case advice for name');
  // The write-skill grader's regex accepts what the skill teaches and rejects what it forbids.
  const yaml = readFileSync(join(REPO, 'evals/skill-builder/write-skill/case.yaml'), 'utf8');
  const raw = /- name: frontmatter-name\n\s+type: regex\n\s+pattern: ("(?:[^"\\]|\\.)*")/.exec(yaml)[1];
  const re = new RegExp(JSON.parse(raw));
  const fm = (name) => `---\nname: ${name}\ndescription: "Checks migrations. Use when reviewing a migration."\n---\n`;
  for (const good of ['my-first-skill', 'db-migration-check', '"db-migration-check"', "'api-builder'"]) assert.match(fm(good), re, good);
  for (const bad of ['"My First Skill"', 'Deploy_Helper', 'API:Builder', '"API Documentation Generator"']) assert.doesNotMatch(fm(bad), re, bad);
  // trigger-lint (the static check) agrees with the grader.
  const dir = mkdtempSync(join(tmpdir(), 'sb-'));
  for (const [folder, name, ok] of [['my-first-skill', 'my-first-skill', true], ['my-first-skill', '"My First Skill"', false]]) {
    mkdirS(join(dir, folder), { recursive: true });
    writeF(join(dir, folder, 'SKILL.md'), fm(name) + 'body\n');
    assert.equal(lintSkill(join(dir, folder)).errors.some((e) => /name/.test(e)), !ok, `${name}`);
  }
  // The recall key still plants the defect the skill now teaches against.
  assert.match(readFileSync(join(REPO, 'evals/skill-builder/seeded-defects/graders/d1-name-format.md'), 'utf8'), /lowercase-and-hyphens/);
});

// Express matches routes in registration order: a static path registered after a param path of the same method
// that matches it (GET /orders/search after GET /orders/:id) is dead code.
export function shadowedRoutes(source) {
  const routes = [];
  for (const line of source.split('\n')) {
    if (/^(---|\+\+\+|-)/.test(line)) continue; // diffs: keep the new file only
    const m = /\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/.exec(line);
    if (m) routes.push({ method: m[1], path: m[2] });
  }
  const out = [];
  routes.forEach((r, i) => routes.slice(0, i).forEach((p) => {
    if (p.method !== r.method || !p.path.includes(':') || r.path === p.path) return;
    const re = new RegExp('^' + p.path.replace(/:[^/]+/g, '[^/]+') + '$');
    if (re.test(r.path)) out.push(`${r.method.toUpperCase()} ${r.path} is shadowed by ${p.path}`);
  }));
  return out;
}

test('no review fixture registers an Express route that an earlier param route shadows (G3 P1-1)', () => {
  const fixtures = walk(join(REPO, 'evals')).filter((f) => /\/(seeded-defects|clean[^/]*)\/resources\//.test(f) && /\.(diff|ts|js|mjs)$/.test(f));
  const found = fixtures.flatMap((f) => shadowedRoutes(readFileSync(f, 'utf8')).map((s) => `${f.slice(REPO.length + 1)}: ${s}`));
  assert.deepEqual(found, []);
  assert.deepEqual(shadowedRoutes(" r.get('/api/orders/:id', h)\n+r.get('/api/orders/search', h)\n"), ['GET /api/orders/search is shadowed by /api/orders/:id']);
});

test('the clean code-review twin reports a refund Stripe already issued instead of claiming nothing was charged', () => {
  const diff = readFileSync(join(REPO, 'evals/github-code-review/clean/resources/pr-412.diff'), 'utf8');
  assert.match(diff, /refundId = refund\.id/);
  assert.match(diff, /json\(refundId\s*\n\+\s*\? \{ error: 'the refund was issued/);
});

test('langgraph-patterns teaches interrupt() inside a node and Command(resume=...), which its grader requires (G3 P1-2)', () => {
  const s = readFileSync(join(REPO, 'free-skills/langgraph-patterns/SKILL.md'), 'utf8');
  assert.doesNotMatch(s, /add_node\([^)]*interrupt\(\)\)/, 'interrupt() passed to add_node at build time');
  assert.match(s, /def \w+\(state[^)]*\)[^\n]*:\n(?:[^\n]*\n){0,4}?\s+\w+ = interrupt\(/, 'interrupt() called inside a node function');
  assert.match(s, /invoke\(Command\(resume=/);
  assert.match(s, /compile\(checkpointer=/);
  assert.match(readFileSync(join(REPO, 'evals/langgraph-patterns/seeded-defects/graders/d1-interrupt-no-checkpointer.md'), 'utf8'), /Command\(resume=/);
});

test('github-code-review teaches the review itself; the swarm tooling is an optional reference (G3 P1-2)', () => {
  const dir = join(REPO, 'free-skills/github-code-review');
  const s = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  const body = s.slice(s.indexOf('\n---\n', 4) + 5);
  for (const topic of [/authoriz/i, /bound parameters/i, /awaited/i, /off-by-one|pagination/i, /registration order/i,
    /transaction/i, /idempoten/i, /swallowed/i, /secrets?/i, /nothing blocks/i]) assert.match(body, topic, `review method covers ${topic}`);
  assert.doesNotMatch(body.split('## Optional: multi-agent review')[0], /ruv-swarm|claude-flow|npx /, 'core method needs no swarm tooling');
  assert.ok(existsSync(join(dir, 'references/swarm-review.md')), 'swarm material kept as a reference');
  assert.doesNotMatch(body, /pr-412|orders\/search|stripe/i, 'no fixture-specific details in the skill');
});

test('the langgraph clean twin respects the agent proposal under 1,000 EUR and pauses above it or on escalation (G3 P1-3)', async () => {
  const { spawnSync } = await import('node:child_process');
  // Run the real finance_review from the fixture with a stubbed interrupt(); no LangGraph needed.
  const py = `
import ast, json, sys
src = open(sys.argv[1]).read()
fn = next(n for n in ast.parse(src).body if isinstance(n, ast.FunctionDef) and n.name == "finance_review")
calls = []
def interrupt(payload):
    calls.append(payload)
    return "approve"
ns = {"interrupt": interrupt, "State": dict}
exec(compile(ast.Module(body=[fn], type_ignores=[]), "fixture", "exec"), ns)
out = []
for amount, proposal in [(500, "approve"), (500, "reject"), (500, "escalate"), (1500, "approve"), (1500, "reject")]:
    before = len(calls)
    r = ns["finance_review"]({"amount_eur": amount, "proposal": proposal, "reason": "r"})
    out.append([amount, proposal, r["approved"], len(calls) > before])
print(json.dumps(out))
`;
  const r = spawnSync('python3', ['-c', py, join(REPO, 'evals/langgraph-patterns/clean/resources/expense_agent.py')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  // [amount, proposal, approved, paused]
  assert.deepEqual(JSON.parse(r.stdout), [
    [500, 'approve', true, false], [500, 'reject', false, false], [500, 'escalate', true, true],
    [1500, 'approve', true, true], [1500, 'reject', true, true],
  ]);
  const src = readFileSync(join(REPO, 'evals/langgraph-patterns/clean/resources/expense_agent.py'), 'utf8');
  assert.match(src, /def propose\(state: State\):\n\s+if getattr\(state\["messages"\]\[-1\], "tool_calls", None\):/, 'escalates on pending tool calls without a model call');
});

test('the mcp clean twin updates only the fields given and does not claim success for a missing ticket (G3 P1-3)', () => {
  const src = readFileSync(join(REPO, 'evals/mcp-architecture/clean/resources/server.ts'), 'utf8');
  const handler = src.slice(src.indexOf("registerTool('update_ticket'"), src.indexOf("registerTool('delete_ticket'"));
  assert.doesNotMatch(handler, /sql\(\{ status, assignee, priority \}/, 'optional fields passed to sql() unconditionally');
  assert.match(handler, /filter\(\(\[, v\]\) => v !== undefined\)/);
  assert.match(handler, /nothing to update/);
  assert.match(handler, /RETURNING id[\s\S]*rows\.length === 0/);
});

test('every pack skill passes trigger-lint with zero errors, so CI covers the lint without a workflow change (G3 P1-4)', () => {
  const failing = PACK.skills.map((s) => [s, lintSkill(join(REPO, 'free-skills', s)).errors]).filter(([, e]) => e.length);
  assert.deepEqual(failing, []);
});

test('the proposed CI patch runs the lift lane on every pack skill, read from pack.json (G3 P1-4)', () => {
  const patch = readFileSync(join(REPO, 'products/skills-with-evals/ci/skill-eval.yml.patch'), 'utf8');
  assert.match(patch, /^-\s+LIFT_SKILLS: ui-ux-design-expert book-publishing excellence-book-writing$/m);
  assert.match(patch, /^\+\s+LIFT_PACK: products\/skills-with-evals\/pack\.json$/m);
  assert.match(patch, /^\+\s+LIFT_SKILLS=\$\(node -p "require\('\.\/\$LIFT_PACK'\)\.skills\.join\(' '\)"\)$/m);
  assert.match(patch, /^\+.*scripts\/tests\/eval-pack\.test\.mjs$/m);
  assert.match(patch, /^\+\s+run: node scripts\/build-catalog\.mjs --check$/m);
});

test('comparability refuses empty, quiet-only and mean-less results; lift leaves out the stay-quiet case (G3 P1-5)', () => {
  const arms = { with: [{}, {}, {}], without: [{}, {}, {}] };
  const full = {
    aggregates: { overallScore: 0.8, meanDelta: 0.2 },
    cases: [
      { name: 'seeded-defects', aggregates: { score: 0.7, delta: 0.4 }, arms },
      { name: 'clean', aggregates: { score: 0.9, delta: 0.2 }, arms },
      { name: 'no-trigger', aggregates: { score: 1, delta: 0 }, arms },
    ],
  };
  assert.deepEqual(comparability(full), []);
  assert.ok(Math.abs(reviewLift(full) - 0.3) < 1e-9, 'lift is the mean of 0.4 and 0.2, not diluted to 0.2 by the quiet case');
  assert.match(comparability({ cases: [] }).join(' '), /no cases/);
  assert.match(comparability({ aggregates: { meanDelta: 0 }, cases: [full.cases[2]] }).join(' '), /only the stay-quiet case/);
  assert.match(comparability({ ...full, aggregates: {} }).join(' '), /no mean difference/);
  assert.equal(reviewLift({ cases: [full.cases[2]] }), null);
});

test('a card refuses a result from an older skill or suite, or one missing a case (G3 P1-5)', () => {
  const now = currentHashes('nextjs-expert');
  assert.deepEqual(now.cases.sort(), ['clean', 'no-trigger', 'seeded-defects']);
  const runOf = (cases) => ({ result: { cases: cases.map((c) => ({ name: c, dir: `/tmp/x/evals/${c}` })) } });
  assert.deepEqual(staleness({ meta: { skillHash: now.skillHash, suiteHash: now.suiteHash }, ...runOf(now.cases) }, now), []);
  assert.match(staleness({ meta: { skillHash: 'old', suiteHash: now.suiteHash }, ...runOf(now.cases) }, now).join(' '), /skill changed/);
  assert.match(staleness({ meta: { skillHash: now.skillHash, suiteHash: 'old' }, ...runOf(now.cases) }, now).join(' '), /suite changed/);
  assert.deepEqual(coverage(runOf(now.cases), now), []);
  assert.match(coverage(runOf(['clean']), now).join(' '), /no runs for no-trigger, seeded-defects|no runs for seeded-defects, no-trigger/);
});

test('evals/README.md status table matches the suites on disk and the cross-model lane (G3 P1-6)', () => {
  const md = readFileSync(join(REPO, 'evals/README.md'), 'utf8');
  const caseDirs = (s) => readdirSync(join(REPO, 'evals', s), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'results'
      && (existsSync(join(REPO, 'evals', s, d.name, 'case.yaml')) || existsSync(join(REPO, 'evals', s, d.name, 'prompt.md'))))
    .map((d) => d.name).sort();
  const suites = readdirSync(join(REPO, 'evals'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'skill-eval').map((d) => d.name);
  const lane = new Set(JSON.parse(readFileSync(join(REPO, 'evals/skill-eval/cases.json'), 'utf8')).cases.map((c) => c.skill.replace(/\/$/, '').split('/').at(-1)));
  const table = md.slice(md.indexOf('## Status'));
  const rows = table.split('\n').filter((l) => /^\| [a-z]/.test(l) && !/^\| Skill/.test(l)).map((l) => l.split('|').map((x) => x.trim()));
  const seen = new Set();
  for (const [, names, cases, , xm] of rows) {
    for (const s of names.split(',').map((x) => x.trim())) {
      seen.add(s);
      assert.deepEqual(cases.split(',').map((x) => x.trim()).sort(), caseDirs(s), `${s}: lift cases column`);
      assert.equal(xm, lane.has(s) ? 'yes' : 'no', `${s}: cross-model column`);
    }
  }
  assert.deepEqual(suites.filter((s) => !seen.has(s)), [], 'every suite on disk has a row');
  const none = /covers \w+ skills with no lift suite yet: ([^.]+)\./.exec(md)[1].split(',').map((x) => x.trim());
  assert.deepEqual(none.filter((s) => existsSync(join(REPO, 'evals', s))), [], 'a skill with a suite is listed as having none');
  assert.deepEqual(none.filter((s) => !lane.has(s)), [], 'listed skills are in the cross-model lane');
});

test('the G2 receipt keeps the original install-test output and a clean re-run (G3 P1-6)', () => {
  const dir = join(REPO, 'products/skills-with-evals/receipts/g2');
  const rerun = JSON.parse(readFileSync(join(dir, 'install-test-rerun-af15ec6.json'), 'utf8'));
  assert.equal(rerun.pass, true);
  assert.doesNotMatch(rerun.versions.codex, /WARNING|\n/);
  assert.match(JSON.parse(readFileSync(join(dir, 'install-test.json'), 'utf8')).versions.codex, /WARNING/, 'original evidence stays unedited');
  const readme = readFileSync(join(dir, 'README.md'), 'utf8');
  assert.doesNotMatch(readme, /That is exactly the extra probe that passed \|/);
  assert.match(readme, /kept unedited/);
});

test('.lycheeignore entries added for this PR exclude exact URLs, not whole domains (Frank, cycle 3)', () => {
  const lines = readFileSync(join(REPO, '.lycheeignore'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
  for (const host of ['doi\\.org', 'wiley', 'pubmed']) {
    const entries = lines.filter((l) => l.includes(host));
    for (const e of entries) assert.match(e, /\$$/, `${e} must be anchored to one exact URL`);
  }
  const doc = readFileSync(join(REPO, 'docs/craft/claude-skills-eval-pack-2026-10-21.md'), 'utf8');
  for (const url of ['https://doi.org/10.1002/ejsp.674', 'https://pubmed.ncbi.nlm.nih.gov/19144931/']) {
    assert.ok(doc.includes(url), `${url} is still cited`);
    assert.ok(lines.some((l) => new RegExp(l).test(url)), `${url} is excluded`);
    assert.ok(!lines.some((l) => new RegExp(l).test(url.replace(/[^/]+\/?$/, 'another-page'))), `a sibling of ${url} is still checked`);
  }
});

test('trigger and baseline come from the tool output: fired share on review cases, no-skill mean (buyer cards)', () => {
  const g = (fired) => ({ graders: [{ name: 'judge', passed: true, withOnly: false, scored: true }, { name: 'skill-fired', passed: fired, withOnly: true, scored: false }] });
  const result = { cases: [
    { name: 'seeded-defects', aggregates: { score: 0.75, delta: 0.25 }, arms: { with: [g(true), g(true), g(false)], without: [{}, {}, {}] } },
    { name: 'clean', aggregates: { score: 0.9, delta: 0.1 }, arms: { with: [g(true), g(true), g(true)], without: [{}, {}, {}] } },
    { name: 'no-trigger', aggregates: { score: 1, delta: 0 }, arms: { with: [g(false)], without: [{}] } },
  ] };
  assert.deepEqual(firedRate(result), { fired: 5, of: 6 }, 'the quiet case does not count toward firing');
  assert.ok(Math.abs(baselineScore(result) - 0.65) < 1e-9, 'mean of 0.50 and 0.80');
  assert.equal(firedRate({ cases: [] }), null);
  assert.equal(baselineScore({ cases: [] }), null);
  for (const s of PACK.skills) { const d = cardData(s); if (!d.lift) assert.equal(d.lift, null); }
});

test('G1 prep: --pilot, expected outputs, and --check-outputs on a synthetic complete run and on broken ones', () => {
  const p = packArgs(['--pilot']);
  assert.deepEqual([p.skillList, p.runs, p['per-skill-usd']], [['github-code-review'], '1', '1']);
  assert.match(packArgs([]).by, /\S/, 'run-by defaults to the local user');
  assert.equal(expectedOutputs('nextjs-expert', 3, 3).traces, 18);
  assert.equal(expectedOutputs('skill-builder', 4, 3).traces, 24);
  const make = ({ dropTrace = false, foreign = false } = {}) => {
    const root = mkdtempSync(join(tmpdir(), 'g1-out-'));
    const base = join(root, 'evals', 'nextjs-expert');
    const stamp = '2026-10-24T08-00-00Z';
    mkdirS(join(base, 'results', stamp, 'traces'), { recursive: true });
    const init = (arm) => JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-sonnet-5-5',
      plugins: [...(arm === 'with' ? [{ name: 'eval-nextjs-expert', source: 'eval-nextjs-expert@inline' }] : []),
        ...(foreign ? [{ name: 'frankx-skills', source: 'frankx-skills@claude-skills-library' }] : [])],
      skills: arm === 'with' ? ['eval-nextjs-expert:nextjs-expert'] : [] }) + '\n';
    const cases = ['seeded-defects', 'clean', 'no-trigger'].map((name) => {
      const arms = {};
      for (const arm of ['with', 'without']) arms[arm] = [1, 2, 3].map((n) => {
        const rel = `results/${stamp}/traces/${name}__${arm}__${n}.jsonl`;
        if (!(dropTrace && name === 'clean' && arm === 'without' && n === 3)) writeF(join(base, rel), init(arm));
        return { tracePath: rel, graders: [] };
      });
      return { name, dir: `/tmp/x/evals/${name}`, aggregates: { score: 0.8, delta: name === 'no-trigger' ? 0 : 0.2 }, arms };
    });
    writeF(join(base, 'results', `${stamp}.json`), JSON.stringify({ meta: { stamp }, result: { aggregates: { meanDelta: 0.13, overallScore: 0.8 }, cases } }));
    writeF(join(base, 'results', `${stamp}.report.html`), '<html></html>');
    writeF(join(base, 'SCORECARD.md'), '# scorecard\n');
    return root;
  };
  const good = checkOutputs('nextjs-expert', make());
  assert.equal(good.ok, true, good.notes.join('; '));
  assert.deepEqual([good.runs, good.traces], [18, 18]);
  assert.match(checkOutputs('nextjs-expert', make({ dropTrace: true })).notes.join(' '), /17 traces for 18 runs/);
  assert.match(checkOutputs('nextjs-expert', make({ foreign: true })).notes.join(' '), /unexpected plugin/);
  assert.match(checkOutputs('nextjs-expert', mkdtempSync(join(tmpdir(), 'g1-none-'))).notes.join(' '), /not run yet/);
});

test('install-test launches commands safely on Windows: prefer .exe, shell only for .cmd/.bat shims, quote args', () => {
  assert.deepEqual(pickCommand(['/home/u/.local/bin/claude'], 'linux'), { cmd: '/home/u/.local/bin/claude', shell: false });
  assert.deepEqual(pickCommand(['C:\\npm\\claude', 'C:\\npm\\claude.cmd', 'C:\\Users\\u\\.local\\bin\\claude.exe'], 'win32'),
    { cmd: 'C:\\Users\\u\\.local\\bin\\claude.exe', shell: false });
  assert.deepEqual(pickCommand(['C:\\npm\\claude', 'C:\\npm\\claude.cmd'], 'win32'), { cmd: 'C:\\npm\\claude.cmd', shell: true });
  assert.equal(pickCommand(['', '  '], 'win32'), null);
  assert.deepEqual(shellArgs(['plugin', 'add', 'skills-with-evals@claude-skills-library', 'owner/repo#a/b', 'C:\\My Repos\\x']),
    ['plugin', 'add', 'skills-with-evals@claude-skills-library', '"owner/repo#a/b"', '"C:\\My Repos\\x"']);
});

test('the install matrix covers ubuntu and windows, validate, local and pinned-remote installs, without secrets', () => {
  const y = readFileSync(join(REPO, 'products/skills-with-evals/ci/install-matrix.yml'), 'utf8');
  assert.match(y, /os: \[ubuntu-latest, windows-latest\]/);
  assert.match(y, /claude: \['2\.1\.310', 'latest'\]/);
  assert.match(y, /run: claude plugin validate \./);
  assert.match(y, /node scripts\/install-test\.mjs --json/);
  assert.match(y, /--claude-source "\$\{REPO\}#\$\{BRANCH\}"/);
  assert.match(y, /--codex-source "\$\{REPO\}@\$\{BRANCH\}"/);
  assert.match(y, /head\.repo\.full_name == github\.repository/, 'remote step skipped for fork PRs');
  assert.match(y, /CODEX_VERSION: '0\.164\.0'/);
  assert.doesNotMatch(y, /secrets\./, 'no secret needed');
  assert.match(y, /permissions:\n  contents: read/);
});

test('the checks validate.yml runs on PRs to main also pass here (catalog, site, counts, links, skill spec)', async () => {
  const { spawnSync } = await import('node:child_process');
  for (const args of [['scripts/generate_catalog.py', '--check'], ['scripts/generate_site.py', '--check'], ['scripts/check_counts.py'],
    ['scripts/check_links.py'], ['scripts/validate_skills.py']]) {
    const r = spawnSync('python3', args, { cwd: REPO, encoding: 'utf8' });
    assert.equal(r.status, 0, `${args.join(' ')}: ${(r.stdout + r.stderr).trim().split('\n').slice(-2).join(' ')}`);
  }
});

test('flagship: the worked comparison comes from the suite files and stays a labelled placeholder until measured', () => {
  const f = flagshipData('github-code-review');
  assert.equal(f.planted.length, 8);
  const graders = readdirSync(join(REPO, 'evals/github-code-review/seeded-defects/graders')).filter((g) => /^d\d+-/.test(g)).sort();
  assert.deepEqual(f.planted.map((d) => `d${d.n}-${d.id}.md`).sort(), graders, 'one planted bug per grader');
  assert.match(f.task, /review pull request #412/i);
  assert.equal(f.measured, null);
  assert.equal(f.limits.length, 3);
  const md = renderFlagshipMd(f);
  assert.match(md, /\*\*Placeholder\.\*\* Nothing below is measured yet/);
  assert.equal((md.match(/\*placeholder\*/g) || []).length >= 10, true);
  const readme = readFileSync(join(REPO, 'products/skills-with-evals/README.md'), 'utf8');
  assert.equal(withFlagship(readme, md), readme, 'README flagship section is current (run node scripts/eval-card.mjs)');
  assert.equal(firstClause("the `catch (e) { x, y }` block, which hides it"), 'the `catch (e) { x, y }` block');
});

test('flagship measures per arm: bugs found, false alarms on the clean copy, cost and time, per planted bug', () => {
  const defects = [{ n: 1, id: 'a' }, { n: 2, id: 'b' }];
  const run = (found, extra = {}) => ({ graders: found.map((n) => ({ name: `d${n}-x`, passed: true })), costUsd: 0.1, durationSeconds: 30, ...extra });
  const result = { cases: [
    { name: 'seeded-defects', arms: { with: [run([1, 2]), run([1, 2]), run([1])], without: [run([1]), run([]), run([])] } },
    { name: 'clean', arms: { with: [{ graders: [{ name: 'no-unsupported-claims', passed: true }] }, { graders: [{ name: 'no-unsupported-claims', passed: false }] }],
      without: [{ graders: [{ name: 'no-unsupported-claims', passed: true }] }, { graders: [{ name: 'no-unsupported-claims', passed: true }] }] } },
  ] };
  const m = flagshipMeasures(result, defects, tmpdir());
  assert.ok(Math.abs(m.with.meanFound - 5 / 3) < 1e-9);
  assert.ok(Math.abs(m.without.meanFound - 1 / 3) < 1e-9);
  assert.equal(m.with.falseAlarmRate, 0.5);
  assert.equal(m.without.falseAlarmRate, 0);
  assert.deepEqual(m.with.perDefect.map((d) => +d.found.toFixed(3)), [1, 0.667]);
  assert.ok(Math.abs(m.with.costPerRunUsd - 0.1) < 1e-9);
  assert.equal(m.with.secondsPerRun, 30);
  assert.deepEqual(plantedDefects('nextjs-expert').length, 9);
});

// ---- skill quality lint (quality program 3) ----
function fixtureSkill(name, { description = 'Reviews widgets. Use when a widget review is asked for.', body = '' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'sq-'));
  const dir = join(root, name);
  mkdirS(dir);
  writeF(join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n${body}`);
  return dir;
}
const GOOD_BOUNDARIES = '\n## When not to use\n\n- Writing new widgets from scratch: use widget-builder.\n- Anything that is not a widget.\n';

test('skill quality: a clean skill passes every hard rule', () => {
  const r = qualitySkill(fixtureSkill('widget-review', { body: '# Widget review\n\nCheck the widget.\n' + GOOD_BOUNDARIES }));
  assert.deepEqual(r.errors, []);
  assert.equal(r.boundaries.heading, 'When not to use');
});

test('skill quality: missing or empty boundaries section fails', () => {
  assert.match(qualitySkill(fixtureSkill('a-skill', { body: '# A\n\nText.\n' })).errors.join('\n'), /^boundaries: no /m);
  assert.match(qualitySkill(fixtureSkill('b-skill', { body: '# B\n\n## Boundaries\n\nTBD.\n\n## Next\n\nlots of text here that is not boundaries at all\n' })).errors.join('\n'), /almost nothing under it/);
  for (const h of ['What this skill does not do', 'Out of scope', 'Boundaries', 'When to use something else'])
    assert.ok(boundarySection(scanBody(`## ${h}\n\n- one thing it does not do, with a reason\n- another\n`).prose), h);
  assert.equal(boundarySection(scanBody('```md\n## When not to use\n- x\n- y\n```\n').prose), null, 'a heading inside a code block does not count');
});

test('skill quality: $<digit> matches Claude Code substitution exactly, in prose fails, in code warns, escaped passes', () => {
  const hits = (s) => dollarArgs(scanBody(s).prose).map((h) => h.token);
  assert.deepEqual(hits('It costs $5 a month.'), ['$5']);
  assert.deepEqual(hits('SQL uses `WHERE id = $1` here.'), ['$1'], 'inline code is still prose, and still substituted');
  assert.deepEqual(hits('A $250B market, $1x, $2_a, \\$1 escaped, $ARGUMENTS.'), [], 'followed by a word char, escaped, or named: not substituted');
  const r = qualitySkill(fixtureSkill('d-skill', { body: 'Price: $5 per seat.\n\n```sql\nSELECT * FROM t WHERE id = $1\n```\n' + GOOD_BOUNDARIES }));
  assert.equal(r.errors.filter((e) => e.startsWith('dollar-arg')).length, 1);
  assert.match(r.warnings.join('\n'), /\$1 in a code block .* 2\+ arguments/);
  assert.equal(scanBody('````md\n```\n$1\n```\n````\n$2 here\n').prose.map((p) => p.line).filter(Boolean).join('|'), '$2 here', 'nested fences close on the matching marker');
});

test('skill quality: body size budget in lines and tokens, and the frontmatter and trigger rules', () => {
  const long = qualitySkill(fixtureSkill('e-skill', { body: 'x\n'.repeat(BUDGET.lines + 5) + GOOD_BOUNDARIES }));
  assert.match(long.errors.join('\n'), /size: body is \d+ lines/);
  const heavy = qualitySkill(fixtureSkill('f-skill', { body: `${'word '.repeat(4200)}\n${GOOD_BOUNDARIES}` }));
  assert.match(heavy.errors.join('\n'), /size: body is about \d+ tokens/);
  assert.match(qualitySkill(fixtureSkill('g-skill', { description: 'Reviews widgets carefully.', body: GOOD_BOUNDARIES })).errors.join('\n'), /^trigger: /m);
  assert.match(qualitySkill(fixtureSkill('h-skill', { description: '', body: GOOD_BOUNDARIES })).errors.join('\n'), /^frontmatter: description is empty/m);
  assert.match(qualitySkill(fixtureSkill('Bad_Name', { body: GOOD_BOUNDARIES })).errors.join('\n'), /^frontmatter: name/m);
});

test('pack gate: every skill in the pack passes the skill quality lint', () => {
  const pack = JSON.parse(readFileSync(join(REPO, 'products/skills-with-evals/pack.json'), 'utf8'));
  for (const s of pack.skills) {
    const r = qualitySkill(join(REPO, 'free-skills', s));
    assert.deepEqual(r.errors, [], `${s}: ${r.errors.join('; ')}`);
    const refs = join(REPO, 'free-skills', s, 'references');
    for (const f of existsSync(refs) ? readdirSync(refs, { withFileTypes: true }) : []) {
      if (f.isFile()) assert.ok(readFileSync(join(REPO, 'free-skills', s, 'SKILL.md'), 'utf8').includes(`references/${f.name}`), `${s}: references/${f.name} is not linked from SKILL.md`);
    }
  }
});

// ---- G1 resumable, idempotent, ledgered (quality program 4) ----
// A fake world: results per skill, a runner that can "crash", a clock. No model, no staging.
function fakeWorld({ crashOn = null, costs = {}, partial = {} } = {}) {
  const results = {}; const runs = []; let tick = 0;
  const H = (s) => ({ skillHash: `sk-${s}`, suiteHash: `su-${s}`, cases: ['seeded-defects', 'clean', 'no-trigger'] });
  const mk = (s, stamp, n, cost, part) => ({ file: `${stamp}.json`, meta: { stamp, skillHash: H(s).skillHash, suiteHash: H(s).suiteHash, traces: n * 6 },
    result: { costUsd: cost, partial: !!part, partialReason: part || undefined, aggregates: { meanDelta: 0.2 },
      cases: ['seeded-defects', 'clean', 'no-trigger'].map((name) => ({ name, aggregates: { delta: 0.2, score: 0.8 },
        arms: { with: Array.from({ length: n }, () => ({})), without: Array.from({ length: n }, () => ({})) } })) } });
  const deps = {
    now: () => `2026-10-24T14-00-${String(tick++).padStart(2, '0')}Z`,
    hashes: H,
    latest: (s) => results[s]?.at(-1) || null,
    resultSince: (s, since) => { const r = results[s]?.at(-1); return r && r.meta.stamp >= since ? r : null; },
    isolation: () => [], models: () => ['claude-sonnet-5-5'],
    runSkill: (s, cap, o) => {
      runs.push({ s, cap: +cap });
      if (crashOn && crashOn.skill === s && !crashOn.done) { crashOn.done = true; throw new Error('SIGKILL (simulated)'); }
      const stamp = deps.now();
      (results[s] ||= []).push(mk(s, stamp, +o.runs, Math.min(costs[s] ?? 1, +cap), partial[s]));
      return 0;
    },
    regenerateCards: () => {}, log: () => {},
  };
  return { deps, results, runs, mk, H };
}
const g1opts = (extra = []) => {
  const dir = mkdtempSync(join(tmpdir(), 'g1-'));
  return { ...packArgs(['--skills', 'github-code-review,nextjs-expert,mcp-architecture', '--ledger', join(dir, 'ledger.jsonl'), ...extra]), receiptsDir: dir };
};

test('G1 ledger: a crash mid-skill is reconciled at its full cap, finished skills are skipped, the campaign cap holds', () => {
  const o = g1opts(['--per-skill-usd', '5', '--total-usd', '10']);
  const w = fakeWorld({ crashOn: { skill: 'nextjs-expert' }, costs: { 'github-code-review': 4 } });
  const deps = { ...w.deps, receiptsDir: o.receiptsDir };
  assert.throws(() => runPack(o, deps), /SIGKILL/);
  let st = ledgerState(readLedger(o.ledger).records);
  assert.equal(st.spent, 4); assert.equal(st.open.length, 1); assert.equal(st.reserved, 5, 'the open start counts at its cap');

  const second = runPack(o, deps);
  assert.equal(second.reconciled.length, 1);
  assert.equal(second.reconciled[0].status, 'interrupted');
  assert.equal(second.reconciled[0].costUsd, 5);
  assert.deepEqual(w.runs.map((r) => [r.s, r.cap]), [['github-code-review', 5], ['nextjs-expert', 5], ['nextjs-expert', 1]],
    'github-code-review is not run again; nextjs gets only what is left of the $10 campaign');
  assert.match(second.stopped, /campaign cap \$10\.00 reached/, 'mcp-architecture is not started: nothing left');
  st = ledgerState(readLedger(o.ledger).records);
  assert.ok(st.spent <= 10 + 1e-9, `campaign spent ${st.spent}`);
  assert.equal(st.open.length, 0);
  assert.match(readFileSync(second.receipt, 'utf8'), /interrupted \(reconciled\) \| \$5\.00 \| \$5\.00 \| no, counted at cap/);
});

test('G1 ledger: an interrupted run whose result file exists is reconciled at its reported cost, not the cap', () => {
  const o = g1opts();
  const w = fakeWorld();
  appendLedger(o.ledger, { type: 'start', id: '2026-10-24T13-00-00Z:github-code-review', skill: 'github-code-review', at: '2026-10-24T13-00-00Z', capUsd: 5, skillHash: 'sk-github-code-review', suiteHash: 'su-github-code-review' });
  w.results['github-code-review'] = [w.mk('github-code-review', '2026-10-24T13-00-02Z', 3, 2.25)];
  const fin = reconcile(ledgerState(readLedger(o.ledger).records).open, w.deps.resultSince, 'now');
  assert.equal(fin[0].costUsd, 2.25); assert.equal(fin[0].costKnown, true); assert.equal(fin[0].status, 'complete');
});

test('G1 ledger: re-running a finished campaign runs nothing and spends nothing (idempotent)', () => {
  const o = g1opts();
  const w = fakeWorld();
  const deps = { ...w.deps, receiptsDir: o.receiptsDir };
  const first = runPack(o, deps);
  assert.equal(first.exitCode, 0); assert.equal(w.runs.length, 3);
  const spent = ledgerState(readLedger(o.ledger).records).spent;
  const again = runPack(o, deps);
  assert.equal(w.runs.length, 3, 'no new runs');
  assert.equal(again.spentNow, 0);
  assert.equal(ledgerState(readLedger(o.ledger).records).spent, spent);
  assert.ok(again.rows.every((r) => /^already measured/.test(r.skipped)));
  assert.equal(again.exitCode, 0);
  // --force re-runs; a changed skill (new hash) or fewer runs than asked also re-run
  const res = w.results['nextjs-expert'].at(-1);
  assert.equal(decide('nextjs-expert', { ...o, force: true }, { ...w.deps, finished: [] }).action, 'run');
  assert.equal(decide('nextjs-expert', o, { ...w.deps, hashes: (s) => ({ ...w.H(s), skillHash: 'changed' }), finished: [] }).action, 'run');
  assert.match(decide('nextjs-expert', { ...o, runs: '5' }, { ...w.deps, finished: [] }).reason, /3 run\(s\) per arm, 5 requested/);
  assert.ok(res);
});

test('G1 ledger: a skill that stopped on its cost cap is not retried at the same cap', () => {
  const o = g1opts(['--skills', 'github-code-review', '--per-skill-usd', '2']);
  const w = fakeWorld({ partial: { 'github-code-review': 'max cost reached' } });
  const deps = { ...w.deps, receiptsDir: o.receiptsDir };
  runPack(o, deps);
  assert.equal(w.runs.length, 1);
  runPack(o, deps);
  assert.equal(w.runs.length, 1, 'not retried at the same $2 cap');
  runPack({ ...o, 'per-skill-usd': '4' }, deps);
  assert.equal(w.runs.length, 2, 'a higher cap retries it');
});

test('G1 ledger: torn last line is ignored and the next record starts on a fresh line; the lock blocks a second run', () => {
  const o = g1opts();
  writeF(o.ledger, '{"type":"finish","id":"a","skill":"x","costUsd":1}\n{"type":"start","id":"b","sk');
  appendLedger(o.ledger, { type: 'finish', id: 'c', skill: 'y', costUsd: 2 });
  const { records, torn } = readLedger(o.ledger);
  assert.equal(torn, 1); assert.equal(records.length, 2); assert.equal(ledgerState(records).spent, 3);
  const held = acquireLock(o.ledger);
  assert.throws(() => acquireLock(o.ledger), /another G1 run \(pid \d+/);
  rmSync(held.lock);
  writeF(`${o.ledger}.lock`, JSON.stringify({ pid: 2 ** 22 + 12345, host: hostname(), at: 'earlier' }));
  const again = acquireLock(o.ledger);
  assert.match(again.cleared, /cleared a lock left by pid/);
  rmSync(again.lock);
  writeF(`${o.ledger}.lock`, JSON.stringify({ pid: 1, host: 'some-other-machine', at: 'earlier' }));
  assert.throws(() => acquireLock(o.ledger), /--break-lock/);
  assert.ok(acquireLock(o.ledger, { breakLock: true }).cleared);
});

test('G1 end to end with a fake claude (no model): SIGKILL mid-skill, resume with the same command, then an idempotent re-run', { skip: process.platform === 'win32' && 'POSIX process groups' }, async () => {
  const { spawn, spawnSync } = await import('node:child_process');
  const { cpSync, chmodSync } = await import('node:fs');
  const root = mkdtempSync(join(tmpdir(), 'g1e2e-'));
  const repo = join(root, 'repo');
  try {
    cpSync(REPO, repo, { recursive: true, filter: (src) => !/[\\/](\.git|node_modules)([\\/]|$)/.test(src) && !/[\\/]evals[\\/][^\\/]+[\\/]results([\\/]|$)/.test(src) && !/g1-(ledger|run-)/.test(src) });
    const bin = join(root, 'bin');
    mkdirS(bin);
    cpSync(join(REPO, 'scripts/tests/fixtures/fake-claude.cjs'), join(bin, 'claude'));
    chmodSync(join(bin, 'claude'), 0o755);
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
    delete env.ANTHROPIC_API_KEY;
    const ledger = join(repo, 'products/skills-with-evals/receipts/g1-ledger.jsonl');
    const args = [join(repo, 'scripts/run-pack-lift.mjs'), '--skills', 'github-code-review,nextjs-expert', '--per-skill-usd', '5', '--total-usd', '50', '--by', 'ci'];

    const child = spawn(process.execPath, args, { env: { ...env, FAKE_HANG_SKILL: 'nextjs-expert' }, detached: true, stdio: 'ignore' });
    const exited = new Promise((r) => child.on('exit', r));
    const deadline = Date.now() + 90_000;
    while (!(existsSync(ledger) && /"type":"start"[^\n]*"skill":"nextjs-expert"/.test(readFileSync(ledger, 'utf8')))) {
      assert.ok(Date.now() < deadline, 'nextjs-expert never started');
      await new Promise((r) => setTimeout(r, 200));
    }
    process.kill(-child.pid, 'SIGKILL');
    await exited;
    let st = ledgerState(readLedger(ledger).records);
    assert.equal(st.open.length, 1, 'the killed skill has a start and no finish');
    assert.ok(existsSync(`${ledger}.lock`), 'the killed run left its lock');

    const r2 = spawnSync(process.execPath, args, { env, encoding: 'utf8' });
    assert.equal(r2.status, 0, r2.stdout.slice(-1500) + r2.stderr);
    assert.match(r2.stdout, /ledger: cleared a lock left by pid \d+/);
    assert.match(r2.stdout, /reconciled interrupted run \S+:nextjs-expert: no result, counted at its \$5\.00 cap/);
    assert.match(r2.stdout, /=== github-code-review · skipped: already measured/);
    assert.match(r2.stdout, /=== nextjs-expert · not run yet · cap \$5\.00/);

    const r3 = spawnSync(process.execPath, args, { env, encoding: 'utf8' });
    assert.equal(r3.status, 0, r3.stdout.slice(-1500));
    assert.match(r3.stdout, /Reported cost this invocation: \$0\.00/);
    st = ledgerState(readLedger(ledger).records);
    assert.equal(st.open.length, 0);
    assert.deepEqual(st.finished.map((f) => `${f.skill}:${f.status}`), ['github-code-review:complete', 'nextjs-expert:interrupted', 'nextjs-expert:complete']);
    assert.ok(!existsSync(`${ledger}.lock`), 'lock released');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
