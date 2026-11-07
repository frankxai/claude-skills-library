#!/usr/bin/env node
/**
 * Proven fix for the P1 found by e2e/demand-capture.e2e.test.mjs.
 *
 *   node e2e/fix-signal-merge.mjs              # print the exact diff, write nothing
 *   node e2e/fix-signal-merge.mjs --verify     # prove the fix against a local KV
 *   node e2e/fix-signal-merge.mjs --apply      # refused: needs a control-plane lane
 *
 * Defect: saveSignal does `hset` keyed by email, so a step-2 submission replaces
 * the whole row and drops the answers from step 1. TRUTH.md 5c.4 says the three
 * questions are asked *after* the visitor has already joined, so a partial second
 * submission must merge, not overwrite.
 *
 * `packages/demand-capture/` lives in the estate control plane. verify-lane.mjs
 * blocks writes there from this product worktree, so --apply is deliberately
 * refused. Apply from a control-plane lane, then re-run the e2e suite.
 */
import http from 'node:http'
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ESTATE = resolve(HERE, '..', '..', '..')
const SRC = join(ESTATE, 'packages', 'demand-capture', 'src', 'store.ts')
const argv = process.argv.slice(2)
const VERIFY = argv.includes('--verify')
const APPLY = argv.includes('--apply')

const ORIGINAL = `export async function saveSignal(signal: DemandSignal): Promise<void> {
  await kv(['hset', key(signal.productId, 'signals'), signal.email, JSON.stringify(signal)])
}`

const FIXED = `export async function saveSignal(signal: DemandSignal): Promise<void> {
  const k = key(signal.productId, 'signals')
  const raw = await kv(['hget', k, signal.email])
  const prior = raw ? JSON.parse(String(raw)) : {}
  // Step 2 is skippable. Keep every answer step 1 already gave us and overlay
  // only the fields this submission actually supplied.
  const next: Record<string, unknown> = { ...prior }
  for (const [field, value] of Object.entries(signal)) {
    if (value !== undefined) next[field] = value
  }
  await kv(['hset', k, signal.email, JSON.stringify(next)])
}`

const source = readFileSync(SRC, 'utf8')
if (!source.includes(ORIGINAL)) {
  console.error('fix-signal-merge: saveSignal no longer matches the expected source; review before applying')
  process.exit(2)
}
const patched = source.replace(ORIGINAL, FIXED)

console.log('# fix-signal-merge', VERIFY ? 'VERIFY' : APPLY ? 'APPLY' : 'DRY RUN')
console.log('\n--- removed ---\n' + ORIGINAL)
console.log('\n--- added ---\n' + FIXED)

if (APPLY) {
  console.log('\nREFUSED: packages/demand-capture/ is in the estate control plane.')
  console.log('verify-lane.mjs blocks product-worktree writes there. Apply from a')
  console.log('control-plane lane, then run: node --test e2e/demand-capture.e2e.test.mjs')
  process.exit(3)
}

if (!VERIFY) {
  console.log('\nNo files written. Run --verify to prove the fix, or apply from a control-plane lane.')
  process.exit(0)
}

// Prove the fix: local KV speaking the same REST subset, patched store.ts staged
// unmodified except for the replacement above, two submissions for one email.
const TOKEN = 'verify-token'
const hashes = new Map()
const counters = new Map()
const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => { body += c })
  req.on('end', () => {
    const [op, key, a, b] = JSON.parse(body)
    let result = null
    if (op === 'hget') result = hashes.get(key)?.get(a) ?? null
    else if (op === 'hset') { if (!hashes.has(key)) hashes.set(key, new Map()); hashes.get(key).set(a, String(b)); result = 1 }
    else if (op === 'hgetall') { const h = hashes.get(key); result = h ? [...h.entries()].flat() : null }
    else if (op === 'incr') { const n = (counters.get(key) ?? 0) + 1; counters.set(key, n); result = n }
    else if (op === 'get') result = counters.has(key) ? String(counters.get(key)) : null
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ result }))
  })
})

await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const url = `http://127.0.0.1:${server.address().port}`
process.env.KV_REST_API_URL = url
process.env.KV_REST_API_TOKEN = TOKEN
delete process.env.RESEND_API_KEY
delete process.env.RESEND_AUDIENCE_ID

const dir = mkdtempSync(join(tmpdir(), 'fix-signal-'))
for (const f of readdirSync(join(ESTATE, 'packages', 'demand-capture', 'src')).filter((x) => x.endsWith('.ts'))) {
  let text = readFileSync(join(ESTATE, 'packages', 'demand-capture', 'src', f), 'utf8')
  if (f === 'store.ts') text = patched
  text = text.replace(/from '\.\/store'/g, "from './store.ts'").replace(/from '\.\/types'/g, "from './types.ts'")
  writeFileSync(join(dir, f), text)
}
writeFileSync(join(dir, 'package.json'), '{"type":"module"}')

const store = await import(pathToFileURL(join(dir, 'store.ts')).href)
await store.saveSignal({ productId: 'claude-skills-eval-pack', email: 'buyer@example.com', consent: true, urgency: 'now', priceBand: '25-99', pain: 'first answer', position: 1, createdAt: '2026-11-07T00:00:00Z', source: '/waitlist' })
await store.saveSignal({ productId: 'claude-skills-eval-pack', email: 'buyer@example.com', consent: true, role: 'developer', position: 1, createdAt: '2026-11-07T00:01:00Z', source: '/waitlist' })
const rows = await store.allSignals('claude-skills-eval-pack')

const merged = rows.find((r) => r.email === 'buyer@example.com')
const ok = rows.length === 1 && merged?.urgency === 'now' && merged?.priceBand === '25-99' && merged?.pain === 'first answer' && merged?.role === 'developer'
console.log(`\nrows=${rows.length} urgency=${merged?.urgency} priceBand=${merged?.priceBand} pain=${merged?.pain} role=${merged?.role}`)
console.log(ok ? 'VERIFY PASS - the fix merges step-2 answers into step-1' : 'VERIFY FAIL')
server.closeAllConnections()
server.close()
rmSync(dir, { recursive: true, force: true })
process.exit(ok ? 0 : 1)
