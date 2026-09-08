#!/usr/bin/env node
// Detects the failure this pack exists for: a routine that fires on schedule,
// reports SUCCEEDED, and produces nothing.
//
// Run status cannot see it — SUCCEEDED only means the agent's turn ended without
// throwing. Repo state can: a routine that ran did its job only if it left a
// digest line. This compares each configured routine's cadence against the
// ledger and fails when one has gone quiet past its window.
//
//   node ci/routine-drift-check.mjs [--config routines.config.json] [--json]
//
// Config (repo root, `routines.config.json`):
//   {
//     "routines": [
//       { "name": "research-pulse-daily",  "maxAgeHours": 30 },
//       { "name": "newsletter-friday",     "maxAgeHours": 192, "startsAfter": "2026-09-08" }
//     ]
//   }
//
// maxAgeHours should be the cadence plus a grace margin — 30 for a daily, ~192
// for a weekly. `startsAfter` suppresses a routine until the contract is live
// for it, so adopting the pack does not open with a wall of red.
//
// Exit 0 = every routine reported inside its window. Exit 1 = at least one is
// silent. Exit 2 = the check could not run (missing config, unreadable ledger),
// which is deliberately NOT the same as "nothing is wrong".

import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

// Resolve the repo being checked from the working directory first — CI runs this
// at the checkout root, and the script may live outside it (invoked straight from
// a cloned pack). Fall back to the script's own repo, then to its parent.
const ROOT = (() => {
  for (const cwd of [process.cwd(), HERE]) {
    try {
      return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim()
    } catch { /* try the next candidate */ }
  }
  return join(HERE, '..', '..')
})()

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const configArg = args[args.indexOf('--config') + 1]
const CONFIG = join(ROOT, args.includes('--config') && configArg ? configArg : 'routines.config.json')
const LEDGER = join(ROOT, process.env.ROUTINE_DIGEST_LEDGER || 'data/routine-digests.jsonl')

function bail(msg) {
  console.error(`routine-drift-check: ${msg}`)
  process.exit(2)
}

if (!existsSync(CONFIG)) {
  bail(`no config at ${CONFIG.replace(ROOT + '/', '')}. ` +
       `Create it listing each scheduled routine and its maxAgeHours, or drop this check.`)
}

let config
try {
  config = JSON.parse(readFileSync(CONFIG, 'utf8'))
} catch (err) {
  bail(`config is not valid JSON: ${err.message}`)
}

const routines = Array.isArray(config.routines) ? config.routines : null
if (!routines) bail('config has no "routines" array')

// An absent config means the check is unconfigured (exit 2, above). An empty
// array is a deliberate "none declared yet" — it can run, it just has nothing to
// check, so it passes. Loudly: an empty list left in place forever is a check
// that has quietly gone blind, which is the failure mode this pack is about.
if (!routines.length) {
  console.log(
    'No routines declared in routines.config.json.\n' +
    'Nothing to check — this check is inert until you list your scheduled routines.')
  process.exit(0)
}

// A missing ledger is normal on day one; treat it as empty rather than as an error.
const entries = existsSync(LEDGER)
  ? readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).flatMap(line => {
      try { return [JSON.parse(line)] } catch { return [] }
    })
  : []

const latest = new Map()
for (const e of entries) {
  if (!e?.routine || !e?.ts) continue
  const prev = latest.get(e.routine)
  if (!prev || e.ts > prev.ts) latest.set(e.routine, e)
}

const now = Date.now()
const results = routines.map(r => {
  const name = r.name
  const maxAgeHours = Number(r.maxAgeHours)
  if (!name || !Number.isFinite(maxAgeHours) || maxAgeHours <= 0) {
    return { name: name ?? '(unnamed)', state: 'misconfigured',
             detail: 'needs a name and a positive maxAgeHours' }
  }
  if (r.startsAfter && now < Date.parse(`${r.startsAfter}T00:00:00Z`)) {
    return { name, state: 'pending', detail: `not enforced until ${r.startsAfter}` }
  }

  const last = latest.get(name)
  if (!last) {
    return { name, state: 'silent', detail: 'no digest has ever been recorded' }
  }
  const ageHours = (now - Date.parse(last.ts)) / 3_600_000
  if (ageHours > maxAgeHours) {
    return { name, state: 'silent',
             detail: `last digest ${ageHours.toFixed(1)}h ago, window is ${maxAgeHours}h`,
             lastStatus: last.status }
  }
  return { name, state: 'ok',
           detail: `${ageHours.toFixed(1)}h ago (${last.status})`, lastStatus: last.status }
})

// A routine reporting red is doing its job — the contract wants failures visible,
// not absent. Only silence fails this check.
const silent = results.filter(r => r.state === 'silent')
const broken = results.filter(r => r.state === 'misconfigured')

if (asJson) {
  console.log(JSON.stringify({ ok: !silent.length && !broken.length, results }, null, 2))
} else {
  for (const r of results) {
    const mark = { ok: '✓', silent: '✗', pending: '·', misconfigured: '!' }[r.state]
    console.log(`${mark} ${r.name} — ${r.detail}`)
  }
}

if (broken.length) {
  console.error(`\n${broken.length} routine(s) misconfigured in routines.config.json.`)
  process.exit(2)
}
if (silent.length) {
  console.error(
    `\n${silent.length} routine(s) fired with nothing to show for it, or stopped firing.\n` +
    `Check the repo, not the run status: SUCCEEDED means the turn ended without throwing.\n` +
    `See the routine-contract skill for what a compliant routine must do.`)
  process.exit(1)
}
console.log(`\nAll ${results.length} routine(s) reported inside their window.`)
