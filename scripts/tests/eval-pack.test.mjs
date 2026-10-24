// Structural tests for the skills-with-evals pack. No network, no model, no claude binary.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSkill, parseFrontmatter } from '../trigger-lint.mjs';
import { cardData, coverage, currentHashes, renderCard, staleness } from '../eval-card.mjs';
import { comparability, reviewLift } from '../eval-skill.mjs';
import { haltsPack, isolationProblems, parseArgs as packArgs } from '../run-pack-lift.mjs';
import { mkdtempSync, writeFileSync as writeF, mkdirSync as mkdirS } from 'node:fs';
import { tmpdir } from 'node:os';

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
