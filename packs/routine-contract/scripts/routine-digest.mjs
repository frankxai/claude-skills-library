#!/usr/bin/env node
// The durable output primitive for every scheduled cloud routine.
//
// Why this exists: on 2026-09-06 all seven live routines were reporting SUCCEEDED
// while committing nothing. Their prompts ended with "Step N — Report:", which writes
// into CCR run-history — a page that is discarded with the container. The runs were
// green and empty for weeks (no model-arena receipt has ever existed; no newsletter
// issue since the 2026-08-05 repair). A routine must not be able to pass by narrating.
//
// So: work is only finished when this script has committed it. `emit` exits non-zero
// if the digest did not reach the remote, which turns a void loop RED instead of green.
//
//   node scripts/ops/routine-digest.mjs preflight --routine <name>
//   node scripts/ops/routine-digest.mjs emit --routine <name> --status green|amber|red \
//        --bullet "..." --bullet "..." --bullet "..." [--link URL] [--detail PATH] [--no-commit]
//   node scripts/ops/routine-digest.mjs selftest

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Ask git for the repo root rather than counting '..' from the script. The
// original assumed scripts/ops/, so installing it anywhere else silently wrote
// the digest outside the repo and the commit found nothing to stage.
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: HERE, encoding: 'utf8' }).trim()
  } catch {
    return join(HERE, '..', '..')
  }
})()

// Override for repos that keep ops docs elsewhere; the defaults suit most.
const DIGEST_DIR = process.env.ROUTINE_DIGEST_DIR
  ? join(ROOT, process.env.ROUTINE_DIGEST_DIR)
  : join(ROOT, 'docs', 'ops', 'routine-digests')
const LEDGER = process.env.ROUTINE_DIGEST_LEDGER
  ? join(ROOT, process.env.ROUTINE_DIGEST_LEDGER)
  : join(ROOT, 'data', 'routine-digests.jsonl')

const STATUSES = { green: '🟢', amber: '🟡', red: '🔴' }
const BULLET_COUNT = 3
const BULLET_MAX = 220

// A digest that says nothing is the same void loop wearing a hat.
const VACUOUS = /^(n\/?a|none|todo|tbd|nothing|no changes?|ok|done|success|completed|pending|placeholder|\W*)$/i

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8', ...opts })
}

function parseArgs(argv) {
  const out = { bullet: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    if (key === 'no-commit') { out.noCommit = true; continue }
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) { out[key] = true; continue }
    if (key === 'bullet') out.bullet.push(value)
    else out[key] = value
    i++
  }
  return out
}

class DigestError extends Error {}

// Throws rather than exits so validate() is testable in-process; the CLI entry
// point below turns a DigestError into exit 2.
function fail(msg) {
  throw new DigestError(msg)
}

function validate(params) {
  if (!params.routine) fail('--routine is required')
  if (!STATUSES[params.status]) fail(`--status must be one of ${Object.keys(STATUSES).join('|')}`)
  const bullets = params.bullet.map(b => String(b).trim())
  if (bullets.length !== BULLET_COUNT) {
    fail(`exactly ${BULLET_COUNT} --bullet values required, got ${bullets.length}. ` +
         `The three bullets ARE the deliverable — they are what Frank reads instead of opening the PR.`)
  }
  for (const b of bullets) {
    if (VACUOUS.test(b)) fail(`vacuous bullet rejected: "${b}". Say what actually happened, with a number or a path.`)
    if (b.length > BULLET_MAX) fail(`bullet exceeds ${BULLET_MAX} chars: "${b.slice(0, 60)}…"`)
  }
  return { ...params, bullets }
}

function preflight(params) {
  const problems = []
  try { git(['rev-parse', '--is-inside-work-tree']) } catch { problems.push('not inside a git work tree') }
  try { git(['remote', 'get-url', 'origin']) } catch { problems.push('no origin remote') }
  try {
    const name = git(['config', 'user.name']).trim()
    const email = git(['config', 'user.email']).trim()
    if (!name || !email) problems.push('git user.name/user.email unset — commits will be rejected')
  } catch { problems.push('git identity unreadable') }
  try { git(['ls-remote', '--exit-code', 'origin', 'HEAD']) } catch { problems.push('origin unreachable (network/auth)') }

  const branch = (() => { try { return git(['rev-parse', '--abbrev-ref', 'HEAD']).trim() } catch { return '?' } })()

  if (problems.length) {
    console.error(`PREFLIGHT RED for ${params.routine || '(unnamed)'} — this routine cannot persist output:`)
    for (const p of problems) console.error(`  · ${p}`)
    console.error('Stop now and report red. Do not do the work — it would be discarded with the container.')
    process.exit(2)
  }
  console.log(`PREFLIGHT OK · routine=${params.routine || '(unnamed)'} · branch=${branch} · sink=${DIGEST_DIR.replace(ROOT + '/', '')}`)
}

async function appendDigest(p) {
  const now = new Date()
  const stamp = now.toISOString()
  const month = stamp.slice(0, 7)
  const file = join(DIGEST_DIR, `${month}.md`)

  await mkdir(DIGEST_DIR, { recursive: true })
  await mkdir(dirname(LEDGER), { recursive: true })

  if (!existsSync(file)) {
    await writeFile(file,
      `# Routine digests — ${month}\n\n` +
      `Appended by \`scripts/ops/routine-digest.mjs\`. One entry per scheduled run.\n` +
      `Contract: \`docs/ops/ROUTINE-CONTRACT.md\`.\n`)
  }

  const entry =
    `\n## ${stamp} · ${p.routine} · ${STATUSES[p.status]} ${p.status}\n\n` +
    p.bullets.map(b => `- ${b}`).join('\n') + '\n' +
    (p.link ? `\nLink: ${p.link}\n` : '') +
    (p.detail ? `\nDetail: \`${p.detail}\`\n` : '')

  await appendFile(file, entry)
  await appendFile(LEDGER, JSON.stringify({
    ts: stamp, routine: p.routine, status: p.status,
    bullets: p.bullets, link: p.link ?? null, detail: p.detail ?? null,
  }) + '\n')

  return file
}

function persist(p, file) {
  const paths = [file.replace(ROOT + '/', ''), LEDGER.replace(ROOT + '/', '')]
  const extra = p.detail && existsSync(join(ROOT, p.detail)) ? [p.detail] : []

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      git(['add', '--', ...paths, ...extra])
      try {
        git(['commit', '--quiet', '-m',
          `chore(routine): ${p.routine} digest — ${p.status}\n\n${p.bullets.map(b => `- ${b}`).join('\n')}`])
      } catch {
        // Nothing staged means the append silently produced no change — treat as failure,
        // never as "already fine".
        if (!git(['status', '--porcelain']).trim()) throw new Error('nothing to commit')
      }
      git(['push', '--quiet', 'origin', 'HEAD'])
      return true
    } catch (err) {
      // Concurrent routines push to the same branch; rebase and retry rather than clobber.
      if (attempt === 3) {
        console.error(`push failed after ${attempt} attempts: ${err.message}`)
        return false
      }
      try { git(['pull', '--rebase', '--quiet', 'origin', 'HEAD']) } catch { /* retry regardless */ }
    }
  }
  return false
}

function report(p, persisted, file) {
  // This block is the user-facing surface. It goes into the run summary, the push
  // notification body, and the Slack DM — so Frank reads three bullets, not a PR diff.
  const lines = [
    '```ROUTINE-DIGEST',
    `${STATUSES[p.status]} ${p.routine} — ${p.status}`,
    ...p.bullets.map(b => `• ${b}`),
    p.link ? `link: ${p.link}` : null,
    persisted ? `committed: ${file.replace(ROOT + '/', '')}` : 'NOT COMMITTED — output would have been lost',
    '```',
  ].filter(Boolean)
  console.log(lines.join('\n'))
}

async function emit(raw) {
  const p = validate(raw)
  const file = await appendDigest(p)
  const persisted = p.noCommit ? false : persist(p, file)
  report(p, persisted, file)

  if (p.noCommit) {
    console.log('(--no-commit: wrote files, skipped git. Local dry run only.)')
    return
  }
  if (!persisted) {
    console.error(
      'ROUTINE-DIGEST FAIL: digest did not reach origin. This run produced nothing durable.\n' +
      'Exiting non-zero on purpose — a routine that cannot persist must go RED, not green.')
    process.exit(1)
  }
}

async function selftest() {
  const checks = []
  const t = (name, fn) => { try { fn(); checks.push(['ok', name]) } catch (e) { checks.push(['FAIL', `${name}: ${e.message}`]) } }
  const throws = fn => { try { fn() } catch { return true } return false }

  t('rejects wrong bullet count', () => {
    if (!throws(() => validate({ routine: 'x', status: 'green', bullet: ['a'] }))) throw new Error('accepted 1 bullet')
  })
  t('rejects vacuous bullets', () => {
    for (const bad of ['n/a', 'TODO', 'done', '  ', 'no changes']) {
      if (!throws(() => validate({ routine: 'x', status: 'green', bullet: [bad, 'real finding here', 'another real one'] }))) {
        throw new Error(`accepted "${bad}"`)
      }
    }
  })
  t('rejects bad status', () => {
    if (!throws(() => validate({ routine: 'x', status: 'ok', bullet: ['a1', 'b2', 'c3'] }))) throw new Error('accepted bad status')
  })
  t('rejects over-long bullet', () => {
    if (!throws(() => validate({ routine: 'x', status: 'green', bullet: ['x'.repeat(BULLET_MAX + 1), 'b2', 'c3'] }))) throw new Error('accepted long bullet')
  })
  t('accepts a real digest', () => {
    const v = validate({ routine: 'x', status: 'amber', bullet: ['Scanned 3 domains, 11 signals', 'Tagged 2 for Friday', 'Cost 47k tokens'] })
    if (v.bullets.length !== 3) throw new Error('bullets lost')
  })

  for (const [state, name] of checks) console.log(`${state === 'ok' ? '✓' : '✗'} ${name}`)
  const failed = checks.filter(c => c[0] === 'FAIL')
  if (failed.length) process.exit(1)
  console.log(`selftest: ${checks.length} passed`)
}

const [cmd, ...rest] = process.argv.slice(2)
const params = parseArgs(rest)

try {
  switch (cmd) {
    case 'preflight': preflight(params); break
    case 'emit': await emit(params); break
    case 'selftest': await selftest(); break
    default:
      console.error('Usage: routine-digest.mjs <preflight|emit|selftest> [--routine X --status green --bullet "..." x3]')
      process.exit(2)
  }
} catch (err) {
  if (err instanceof DigestError) {
    console.error(`ROUTINE-DIGEST FAIL: ${err.message}`)
    process.exit(2)
  }
  throw err
}
