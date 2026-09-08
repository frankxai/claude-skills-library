#!/usr/bin/env node
// Tests for the routine-contract pack.
//
//   node packs/routine-contract/tests/test_routine_contract.mjs
//
// Zero dependencies, no test runner — this has to run anywhere the scripts do.
//
// The load-bearing one is test_emit_fails_when_it_cannot_persist. The entire
// pack rests on a single property: a routine that cannot save its output exits
// non-zero. If emit ever returns 0 on a failed push, every routine goes back to
// reporting green while producing nothing — the exact failure this pack was
// built to end, restored silently and with a passing test suite. That test is
// why it cannot come back.

import { execFileSync, execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACK = dirname(HERE)
const DIGEST = join(PACK, 'scripts', 'routine-digest.mjs')
const DRIFT = join(PACK, 'ci', 'routine-drift-check.mjs')

let passed = 0
const failures = []

function test(name, fn) {
  try { fn(); passed++; console.log(`✓ ${name}`) }
  catch (err) { failures.push([name, err.message]); console.log(`✗ ${name}\n    ${err.message}`) }
}
function assert(cond, msg) { if (!cond) throw new Error(msg) }

// Runs a script and returns {code, stdout, stderr} instead of throwing on non-zero.
function run(script, args, opts = {}) {
  try {
    const stdout = execFileSync('node', [script, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts,
    })
    return { code: 0, stdout, stderr: '' }
  } catch (err) {
    return { code: err.status ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' }
  }
}

// A throwaway git repo with an origin it can actually push to (a bare remote).
function makeRepo({ reachableRemote = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'routine-contract-'))
  const work = join(dir, 'work')
  mkdirSync(work)
  const git = cmd => execSync(`git ${cmd}`, { cwd: work, stdio: 'pipe' })
  git('init -q -b main')
  git('config user.name Test')
  git('config user.email test@example.com')
  writeFileSync(join(work, 'seed.txt'), 'seed\n')
  git('add seed.txt')
  git('commit -q -m seed')
  if (reachableRemote) {
    const bare = join(dir, 'remote.git')
    execSync(`git init -q --bare ${bare}`, { stdio: 'pipe' })
    git(`remote add origin ${bare}`)
    git('push -q -u origin main')
  } else {
    git(`remote add origin ${join(dir, 'does-not-exist.git')}`)
  }
  // The script resolves the repo root via git, so it works from any install path.
  const scriptDir = join(work, 'scripts', 'ops')
  mkdirSync(scriptDir, { recursive: true })
  execSync(`cp ${DIGEST} ${join(scriptDir, 'routine-digest.mjs')}`, { stdio: 'pipe' })
  return { dir, work, script: join(scriptDir, 'routine-digest.mjs') }
}

const BULLETS = [
  '--bullet', 'Scanned 3 domains and found 11 signals',
  '--bullet', 'Tagged 2 for Friday, path content/staging/',
  '--bullet', 'Cost 47k tokens, under the 100k target',
]

// ---------------------------------------------------------------- validation
test('selftest passes', () => {
  const r = run(DIGEST, ['selftest'])
  assert(r.code === 0, `selftest exited ${r.code}`)
})

test('rejects a digest that is not exactly three bullets', () => {
  const r = run(DIGEST, ['emit', '--routine', 'x', '--status', 'green', '--bullet', 'only one', '--no-commit'])
  assert(r.code !== 0, 'accepted a one-bullet digest')
})

test('rejects vacuous bullets', () => {
  for (const bad of ['done', 'n/a', 'no changes', '   ']) {
    const r = run(DIGEST, ['emit', '--routine', 'x', '--status', 'green',
      '--bullet', bad, '--bullet', 'a real finding with a number 12', '--bullet', 'another real one',
      '--no-commit'])
    assert(r.code !== 0, `accepted vacuous bullet "${bad}"`)
  }
})

// ------------------------------------------------------------ the whole point
test('LOAD-BEARING: emit fails when it cannot persist', () => {
  const { dir, work, script } = makeRepo({ reachableRemote: false })
  try {
    const r = run(script, ['emit', '--routine', 'unreachable', '--status', 'green', ...BULLETS], { cwd: work })
    assert(r.code !== 0,
      'emit returned 0 despite being unable to push. This is the regression that ' +
      'turns every routine back into a green void loop.')
    assert(/NOT COMMITTED|did not reach origin/.test(r.stdout + r.stderr),
      'failure was not explained in the output')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('emit commits and pushes when the sink is reachable', () => {
  const { dir, work, script } = makeRepo()
  try {
    const r = run(script, ['emit', '--routine', 'reachable', '--status', 'amber', ...BULLETS], { cwd: work })
    assert(r.code === 0, `emit exited ${r.code}: ${r.stderr}`)
    assert(existsSync(join(work, 'data', 'routine-digests.jsonl')), 'ledger was not written')
    const local = execSync('git rev-parse HEAD', { cwd: work, encoding: 'utf8' }).trim()
    const remote = execSync('git rev-parse origin/main', { cwd: work, encoding: 'utf8' }).trim()
    assert(local === remote, 'commit did not reach origin')
    const line = JSON.parse(readFileSync(join(work, 'data', 'routine-digests.jsonl'), 'utf8').trim())
    assert(line.routine === 'reachable' && line.bullets.length === 3, 'ledger line is malformed')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('preflight fails before doing work when origin is unreachable', () => {
  const { dir, work, script } = makeRepo({ reachableRemote: false })
  try {
    const r = run(script, ['preflight', '--routine', 'unreachable'], { cwd: work })
    assert(r.code !== 0, 'preflight passed against an unreachable origin')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// -------------------------------------------------------------- drift check
function driftRepo(configObj, ledgerLines) {
  const { dir, work } = makeRepo()
  writeFileSync(join(work, 'routines.config.json'), JSON.stringify(configObj))
  if (ledgerLines) {
    mkdirSync(join(work, 'data'), { recursive: true })
    writeFileSync(join(work, 'data', 'routine-digests.jsonl'),
      ledgerLines.map(l => JSON.stringify(l)).join('\n') + '\n')
  }
  return { dir, work }
}
const hoursAgo = h => new Date(Date.now() - h * 3_600_000).toISOString()

test('drift check flags a routine that has gone silent', () => {
  const { dir, work } = driftRepo(
    { routines: [{ name: 'daily-thing', maxAgeHours: 30 }] },
    [{ ts: hoursAgo(50), routine: 'daily-thing', status: 'green', bullets: ['a', 'b', 'c'] }])
  try {
    const r = run(DRIFT, [], { cwd: work })
    assert(r.code === 1, `expected exit 1 for a silent routine, got ${r.code}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('drift check passes a routine reporting inside its window', () => {
  const { dir, work } = driftRepo(
    { routines: [{ name: 'daily-thing', maxAgeHours: 30 }] },
    [{ ts: hoursAgo(2), routine: 'daily-thing', status: 'green', bullets: ['a', 'b', 'c'] }])
  try {
    const r = run(DRIFT, [], { cwd: work })
    assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.stderr}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('drift check treats a red routine as reporting, not silent', () => {
  const { dir, work } = driftRepo(
    { routines: [{ name: 'daily-thing', maxAgeHours: 30 }] },
    [{ ts: hoursAgo(1), routine: 'daily-thing', status: 'red', bullets: ['a', 'b', 'c'] }])
  try {
    const r = run(DRIFT, [], { cwd: work })
    assert(r.code === 0, 'a routine honestly reporting red must not be treated as drift')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('drift check passes on a deliberately empty routine list', () => {
  // A fresh install seeds routines: []. That must not fail CI on day one — but an
  // absent config still must (see the next test): unconfigured is not the same as
  // "nothing declared".
  const { dir, work } = driftRepo({ routines: [] }, null)
  try {
    const r = run(DRIFT, [], { cwd: work })
    assert(r.code === 0, `a seeded empty config must pass, got ${r.code}: ${r.stderr}`)
    assert(/nothing to check|inert/i.test(r.stdout), 'an inert check must say so')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('drift check exits 2 (not 0) when it cannot run', () => {
  const { dir, work } = makeRepo()
  try {
    const r = run(DRIFT, [], { cwd: work })
    assert(r.code === 2, `a check that cannot run must not report success; got ${r.code}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('drift check honours startsAfter', () => {
  const future = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  const { dir, work } = driftRepo(
    { routines: [{ name: 'not-yet', maxAgeHours: 24, startsAfter: future }] }, [])
  try {
    const r = run(DRIFT, [], { cwd: work })
    assert(r.code === 0, 'a routine not yet enforced must not fail the check')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
