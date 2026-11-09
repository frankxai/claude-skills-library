#!/usr/bin/env node
// Used by scripts/tests/eval-pack.test.mjs ("G1 end to end"). Copied to <tmp>/bin/claude and put first on PATH.
// Fake `claude` for an offline end-to-end test of run-pack-lift's ledger and resume. Never calls a model.
const fs = require('fs'); const path = require('path'); const os = require('os');
const a = process.argv.slice(2);
if (a[0] === '--version') { console.log('2.1.310 (Claude Code) [FAKE for ledger e2e]'); process.exit(0); }
if (a[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true, authMethod: 'claude.ai' })); process.exit(0); }
if (a[0] === 'plugin' && a[1] === 'eval') {
  const plugin = a[2];
  const opt = (k) => a[a.indexOf(k) + 1];
  const name = JSON.parse(fs.readFileSync(path.join(plugin, '.claude-plugin', 'plugin.json'), 'utf8')).name;
  const skill = name.replace(/^eval-/, '');
  if (process.env.FAKE_HANG_SKILL === skill) { console.log(`[fake] ${skill}: hanging until killed`); setInterval(() => {}, 1000); return; }
  const runs = +opt('--runs'); const cap = +opt('--max-cost-usd');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-eval-'));
  const cases = fs.readdirSync(path.join(plugin, 'evals'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const perRun = 0.07; let cost = 0;
  const result = { costUsd: 0, aggregates: { meanDelta: 0.25, overallScore: 0.8 }, cases: cases.map((c) => {
    const arms = {};
    for (const arm of ['with', 'without']) arms[arm] = Array.from({ length: runs }, (_, i) => {
      const dir = path.join(tmp, `${c}-${arm}-${i}`, 'run'); fs.mkdirSync(dir, { recursive: true });
      const tp = path.join(dir, 'trace.jsonl');
      const init = { type: 'system', subtype: 'init', model: 'claude-sonnet-5-5', plugins: arm === 'with' ? [{ name, source: `${name}@inline` }] : [], skills: arm === 'with' ? [`${name}:${skill}`] : [] };
      fs.writeFileSync(tp, JSON.stringify(init) + '\n' + JSON.stringify({ type: 'result', result: `[fake ${arm} answer]` }) + '\n');
      cost += perRun;
      return { tracePath: tp, costUsd: perRun, durationSeconds: 30, graders: [] };
    });
    return { name: c, dir: `evals/${c}`, arms, aggregates: { score: 0.8, delta: c === 'no-trigger' ? 0 : 0.25 } };
  }) };
  result.costUsd = Math.min(cost, cap);
  fs.writeFileSync(opt('--report'), '<html><body>fake report</body></html>');
  fs.writeFileSync(opt('--json'), JSON.stringify(result));
  console.log(`[fake] ${skill}: ${cases.length} cases x ${runs} runs x 2 arms, reported $${result.costUsd.toFixed(2)}`);
  process.exit(0);
}
console.error('fake claude: unsupported ' + a.join(' ')); process.exit(3);
