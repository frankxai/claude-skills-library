#!/usr/bin/env node
/**
 * End-to-end test for the demand funnel, against the real production sources.
 *
 *   node --test e2e/demand-capture.e2e.test.mjs
 *
 * It does not need Frank's KV credentials. It starts a local HTTP server that
 * speaks the small Redis-REST subset `packages/demand-capture/src/store.ts` and
 * `report.mjs` use, then drives the real (unmodified) `handler.ts` and reads the
 * signal back through the real `report.mjs`. No network leaves the machine.
 *
 * The .ts sources are staged unmodified in a temp ESM directory because the
 * package has no package.json with "type": "module" and its imports are
 * extensionless. The staging step only rewrites those two specifiers; the
 * logic under test is byte-for-byte the production source.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtempSync, copyFileSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const execFileAsync = promisify(execFile)
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ESTATE = resolve(HERE, '..', '..', '..')
const PKG = join(ESTATE, 'packages', 'demand-capture')
const PRODUCT_ID = 'claude-skills-eval-pack'
const TOKEN = 'e2e-local-token'

const savedEnv = {
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
}

let server
let kvUrl
let staged
let handler
let product
let failing = false

function productConfig() {
  const registry = JSON.parse(readFileSync(join(ESTATE, 'graph', 'products.graph.json'), 'utf8'))
  const p = registry.products.find((x) => x.id === PRODUCT_ID)
  assert.ok(p, `product ${PRODUCT_ID} must exist in graph/products.graph.json`)
  return { id: p.id, stage: p.stage, waitlist: p.waitlist }
}

/** In-memory implementation of the Upstash Redis REST commands this package uses. */
function startKv() {
  const hashes = new Map()
  const counters = new Map()
  const srv = http.createServer((req, res) => {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      const auth = req.headers.authorization || ''
      if (auth !== `Bearer ${TOKEN}`) {
        res.writeHead(401, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'unauthorized' }))
        return
      }
      if (failing) {
        res.writeHead(500, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'simulated KV outage' }))
        return
      }
      let cmd
      try { cmd = JSON.parse(body) } catch {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'bad json' }))
        return
      }
      const [op, key, a, b] = cmd
      let result = null
      if (op === 'hget') result = hashes.get(key)?.get(a) ?? null
      else if (op === 'hset') {
        if (!hashes.has(key)) hashes.set(key, new Map())
        hashes.get(key).set(a, String(b))
        result = 1
      } else if (op === 'hgetall') {
        const h = hashes.get(key)
        result = h ? [...h.entries()].flat() : null
      } else if (op === 'incr') {
        const next = (counters.get(key) ?? 0) + 1
        counters.set(key, next)
        result = next
      } else if (op === 'get') result = counters.has(key) ? String(counters.get(key)) : null
      else {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: `unsupported command: ${op}` }))
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ result }))
    })
  })
  return new Promise((ok) => {
    srv.listen(0, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${srv.address().port}`
      ok({ server: srv, url })
    })
  })
}

/** Stage the real .ts sources into an ESM context and import them. */
function loadHandler() {
  const dir = mkdtempSync(join(tmpdir(), 'dc-e2e-'))
  for (const f of readdirSync(join(PKG, 'src')).filter((x) => x.endsWith('.ts'))) {
    const text = readFileSync(join(PKG, 'src', f), 'utf8')
      .replace(/from '\.\/store'/g, "from './store.ts'")
      .replace(/from '\.\/types'/g, "from './types.ts'")
    writeFileSync(join(dir, f), text)
  }
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}')
  return { dir, load: () => import(pathToFileURL(join(dir, 'handler.ts')).href) }
}

function request(path = '/waitlist?utm_source=github') {
  return new Request(`https://frankx.ai${path}`, {
    headers: { referer: 'https://github.com/frankxai/claude-skills-library' },
  })
}

async function runReport() {
  const { stdout } = await execFileAsync(process.execPath, [join(PKG, 'report.mjs'), PRODUCT_ID], {
    env: { ...process.env, KV_REST_API_URL: kvUrl, KV_REST_API_TOKEN: TOKEN },
    encoding: 'utf8',
  })
  return stdout
}

test.before(async () => {
  const kv = await startKv()
  server = kv.server
  kvUrl = kv.url
  process.env.KV_REST_API_URL = kvUrl
  process.env.KV_REST_API_TOKEN = TOKEN
  delete process.env.RESEND_API_KEY
  delete process.env.RESEND_AUDIENCE_ID
  staged = loadHandler()
  handler = await staged.load()
  product = productConfig()
})

test.after(() => {
  server?.closeAllConnections?.()
  server?.close()
  if (staged) rmSync(staged.dir, { recursive: true, force: true })
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

test('a valid join stores a DemandSignal and withholds the count below threshold', async () => {
  const res = await handler.handleJoin(product, {
    email: 'Buyer@Example.com',
    consent: true,
    name: 'A Buyer',
    role: 'developer',
    pain: 'I cannot tell whether a skill works before I install it',
    urgency: 'now',
    priceBand: '25-99',
    alternative: 'writing it myself',
  }, request())

  assert.equal(res.status, 200)
  assert.equal(res.body.productId, PRODUCT_ID)
  assert.equal(res.body.position, 1)
  assert.equal(res.body.publicCount, null, 'below the threshold the count must be withheld')
  assert.equal(res.body.foundingSeatsLeft, 99)
})

test('report.mjs reads the stored signal back with its price band', async () => {
  const out = await runReport()
  assert.match(out, /Skills that ship with their evals/)
  assert.match(out, /WHAT they would pay/)
  assert.match(out, /25-99\s+#+ 1 \(100%\)/)
  assert.match(out, /would pay 1/)
  assert.doesNotMatch(out, /No signals yet/)
})

test('a repeat submission does not double-count', async () => {
  const res = await handler.handleJoin(product, {
    email: 'buyer@example.com', consent: true, priceBand: '25-99',
  }, request())
  assert.equal(res.status, 200)
  assert.equal(res.body.position, 1, 'position must be stable for the same email')
  const out = await runReport()
  assert.match(out, /would pay 1/, 'the league table must still show one would-pay signal')
})

test('a second buyer with a different band changes the ranked order', async () => {
  const res = await handler.handleJoin(product, {
    email: 'second@example.com', consent: true, priceBand: '100-299', urgency: 'this-quarter',
  }, request())
  assert.equal(res.status, 200)
  assert.equal(res.body.position, 2)
  const out = await runReport()
  assert.match(out, /would pay 2/)
  assert.match(out, /100-299\s+#+\.+ 1 \(50%\)/)
})

test('invalid email and missing consent are refused before any write', async () => {
  const bad = await handler.handleJoin(product, { email: 'not-an-email', consent: true }, request())
  assert.equal(bad.status, 400)
  const noConsent = await handler.handleJoin(product, { email: 'third@example.com' }, request())
  assert.equal(noConsent.status, 400)
  const out = await runReport()
  assert.match(out, /would pay 2/, 'refused joins must not create a third signal')
})

test('a KV outage is an honest error, not a silent success', async () => {
  failing = true
  try {
    await assert.rejects(
      () => handler.handleJoin(product, { email: 'outage@example.com', consent: true }, request()),
      /KV 500/,
    )
  } finally {
    failing = false
  }
  const out = await runReport()
  assert.match(out, /would pay 2/, 'the failed join must not be recorded')
})
