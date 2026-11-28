#!/usr/bin/env node
/**
 * Regression tests for the any-agent harness surface.
 *
 *   node --test scripts/tests/harness-surface.test.mjs
 *
 * Every test builds an isolated fixture under the OS temp directory, including a fake HOME.
 * Nothing writes into the real repository, a real home directory, or a global config. The
 * fixture is removed after each test. The first test was written RED before path-state reporting
 * existed; the rest lock down behavior that was already built in the earlier slices.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'harness-surface-'))
  cpSync(join(REPO, 'runtimes'), join(dir, 'runtimes'), { recursive: true })
  cpSync(join(REPO, 'scripts'), join(dir, 'scripts'), { recursive: true })
  mkdirSync(join(dir, 'free-skills'), { recursive: true })
  mkdirSync(join(dir, 'docs', 'products'), { recursive: true })
  mkdirSync(join(dir, 'fake-home'), { recursive: true })
  return dir
}

function run(dir, script, args = [], env = {}) {
  return spawnSync(process.execPath, [join(dir, 'scripts', script), ...args], {
    encoding: 'utf8',
    cwd: dir,
    env: { ...process.env, ...env },
  })
}

function fakeHomeEnv(dir) {
  const home = join(dir, 'fake-home')
  return { HOME: home, USERPROFILE: home }
}

function stub(dir, id) {
  return join(dir, 'runtimes', `${id}.md`)
}

function manifest(dir) {
  return join(dir, 'runtimes', 'harnesses.json')
}

function snapshot(dir) {
  const out = []
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name)
      if (entry.isDirectory()) walk(p)
      else out.push(p)
    }
  }
  walk(dir)
  return out.sort()
}

function withFixture(fn) {
  const dir = fixture()
  try {
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('verify reports verified, documented and open path states', () => {
  withFixture((dir) => {
    const r = run(dir, 'install-any-agent.mjs', ['--all', '--verify'], fakeHomeEnv(dir))
    assert.equal(r.status, 0, `unexpected exit ${r.status}: ${r.stderr}`)
    assert.match(r.stdout, /verified:\s*\d+/)
    assert.match(r.stdout, /documented:\s*\d+/)
    assert.match(r.stdout, /open:\s*\d+/)
    assert.match(r.stdout, /sourced surfaces:\s*12\/14/)
  })
})

test('an unknown harness exits 2', () => {
  withFixture((dir) => {
    const r = run(dir, 'install-any-agent.mjs', ['--harness', 'not-a-harness', '--verify'], fakeHomeEnv(dir))
    assert.equal(r.status, 2)
    assert.match(r.stderr, /unknown harness/)
  })
})

test('a missing generated marker exits 3', () => {
  withFixture((dir) => {
    const p = stub(dir, 'hermes')
    const text = readFileSync(p, 'utf8')
    writeFileSync(p, text.slice(text.indexOf('\n') + 1))
    const r = run(dir, 'install-any-agent.mjs', ['--all', '--verify'], fakeHomeEnv(dir))
    assert.equal(r.status, 3)
    assert.match(r.stdout, /missing marker/)
  })
})

test('a fault is reported in JSON mode and exits non-zero', () => {
  withFixture((dir) => {
    const p = stub(dir, 'hermes')
    const text = readFileSync(p, 'utf8')
    writeFileSync(p, text.slice(text.indexOf('\n') + 1))
    const r = run(dir, 'install-any-agent.mjs', ['--all', '--json'], fakeHomeEnv(dir))
    assert.equal(r.status, 3)
    const plan = JSON.parse(r.stdout)
    assert.equal(plan.exitCode, 3)
    assert.ok(plan.verification.faults.some((f) => /missing marker/.test(f)))
  })
})

test('a verified row without probe evidence is refused with exit 5', () => {
  withFixture((dir) => {
    const p = manifest(dir)
    const m = JSON.parse(readFileSync(p, 'utf8'))
    const row = m.harnesses.find((h) => h.pathState === 'verified')
    delete row.probe
    writeFileSync(p, `${JSON.stringify(m, null, 2)}\n`)
    const r = run(dir, 'install-any-agent.mjs', ['--all', '--verify'], fakeHomeEnv(dir))
    assert.equal(r.status, 5)
    assert.match(r.stdout, /no probe evidence/)
  })
})

test('an operator-specific path in a stub exits 4', () => {
  withFixture((dir) => {
    const p = stub(dir, 'hermes')
    writeFileSync(p, `${readFileSync(p, 'utf8')}\nC:/Users/leak\n`)
    const r = run(dir, 'install-any-agent.mjs', ['--all', '--verify'], fakeHomeEnv(dir))
    assert.equal(r.status, 4)
    assert.match(r.stdout, /absolute path/)
  })
})

test('an operator-specific path in a docs file exits 4', () => {
  withFixture((dir) => {
    writeFileSync(join(dir, 'docs', 'products', 'leak.md'), 'A leak: C:\\Users\\leak\n')
    const r = run(dir, 'install-any-agent.mjs', ['--all', '--verify'], fakeHomeEnv(dir))
    assert.equal(r.status, 4)
    assert.match(r.stdout, /absolute path/)
  })
})

test('generator --check is byte-idempotent and a second --write writes 0 files', () => {
  withFixture((dir) => {
    const w1 = run(dir, 'gen-harness-adapters.mjs', ['--write'], fakeHomeEnv(dir))
    assert.equal(w1.status, 0, w1.stderr)
    for (const n of [1, 2]) {
      const c = run(dir, 'gen-harness-adapters.mjs', ['--check'], fakeHomeEnv(dir))
      assert.equal(c.status, 0, `check ${n} failed: ${c.stderr}`)
    }
    const w2 = run(dir, 'gen-harness-adapters.mjs', ['--write'], fakeHomeEnv(dir))
    assert.equal(w2.status, 0, w2.stderr)
    assert.match(w2.stdout, /wrote 0 file/)
  })
})

test('the CLI dry run writes nothing into the fixture or a fake HOME', () => {
  withFixture((dir) => {
    const home = join(dir, 'fake-home')
    const before = snapshot(dir)
    const beforeHome = snapshot(home)
    const r = run(dir, 'install-any-agent.mjs', ['--all', '--json'], fakeHomeEnv(dir))
    assert.equal(r.status, 0, r.stderr)
    assert.deepEqual(snapshot(dir), before)
    assert.deepEqual(snapshot(home), beforeHome)
    const plan = JSON.parse(r.stdout)
    assert.equal(plan.dryRun, true)
    assert.equal(plan.writesNothing, true)
  })
})
