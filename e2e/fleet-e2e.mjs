#!/usr/bin/env node
/**
 * Live production e2e verifier for the Cloudflare agent fleet.
 *
 *   node e2e/fleet-e2e.mjs [--md-out <path>] [--json-out <path>]
 *
 * It speaks HTTP to the deployed endpoints and exercises real MCP calls. A tool
 * list that parses is not a pass; every Worker must answer initialize, tools/list
 * and at least one tools/call. The gateway must prove its licence gate and its
 * notification handling. No credentials are needed because only free tools and
 * unauthenticated refusals are exercised.
 *
 * Exit 0 when every hard check passes. Known gaps are reported, not hidden.
 */
import { writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SUITE_DIR = resolve(HERE, '..')
const argv = process.argv.slice(2)
const valueOf = (n) => { const i = argv.indexOf(n); return i !== -1 && i + 1 < argv.length ? argv[i + 1] : null }
// The demand funnel lives in the estate control plane, not in this product repo.
// Make the target explicit and fail closed if it is not the expected checkout.
const ESTATE = resolve(valueOf('--estate-root') || join(HERE, '..', '..', '..'))
const JSON_OUT = valueOf('--json-out') || join(HERE, 'receipts', `fleet-e2e-${new Date().toISOString().slice(0, 10)}.json`)
const MD_OUT = valueOf('--md-out')

const GW = 'https://starlight-universal-mcp-gateway.frankxai.workers.dev'
const WORKERS = [
  { id: 'gateway', url: GW },
  { id: 'sentinel', url: 'https://starlight-sentinel.frankxai.workers.dev' },
  { id: 'starlight-core', url: 'https://starlight-core.frankxai.workers.dev' },
  { id: 'mcp-doctor', url: 'https://mcp-doctor.frankxai.workers.dev' },
  { id: 'starlight-kernel', url: 'https://starlight-kernel.frankxai.workers.dev' },
]
const PORTAL = 'https://mcp.starlightintelligence.ai'
const WAITLIST = 'https://frankx.ai/waitlist'

const checks = []
const gaps = []

// Fail closed if the harness is pointed at the wrong checkout.
for (const required of [
  'packages/demand-capture/report.mjs',
  'graph/products.graph.json',
  'ops/agent-plugins/RUNBOOK.md',
]) {
  if (!existsSync(join(ESTATE, required))) {
    console.error(`fleet-e2e: estate root ${ESTATE} is missing ${required}; pass --estate-root`)
    process.exit(2)
  }
}

async function req(url, { method = 'GET', body, headers = {}, timeout = 15000, follow = false } = {}) {
  const res = await fetch(url, {
    method,
    headers: { ...headers },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
    signal: AbortSignal.timeout(timeout),
    redirect: follow ? 'follow' : 'manual',
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* plain text is fine */ }
  return { status: res.status, json, text, headers: res.headers }
}

function rpc(id, method, params = {}, extra = {}) {
  return { jsonrpc: '2.0', id, method, params, ...extra }
}

async function check(id, label, fn) {
  const t0 = Date.now()
  try {
    const { ok, detail } = await fn()
    checks.push({ id, label, ok: Boolean(ok), detail, ms: Date.now() - t0 })
  } catch (e) {
    checks.push({ id, label, ok: false, detail: `EXCEPTION ${String(e?.message ?? e).slice(0, 180)}`, ms: Date.now() - t0 })
  }
}

function gap(id, label, detail, owner, severity = 'P1') {
  gaps.push({ id, label, detail, owner, severity })
}

// 1. Health on all five Workers.
for (const w of WORKERS) {
  await check(`health:${w.id}`, `GET /health ${w.id}`, async () => {
    const r = await req(`${w.url}/health`)
    const ok = r.status === 200 && r.json?.ok === true
    return { ok, detail: `${r.status} service=${r.json?.service ?? '?'} version=${r.json?.version ?? '?'} tools=${r.json?.tools ?? r.json?.toolCount ?? '?'}` }
  })
}

// 2. MCP handshake and a real call on every Worker.
for (const w of WORKERS) {
  const mcp = `${w.url}/mcp`
  await check(`initialize:${w.id}`, `initialize ${w.id}`, async () => {
    const r = await req(mcp, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'fleet-e2e', version: '1.0.0' } }) })
    return { ok: r.status === 200 && r.json?.result?.protocolVersion === '2025-06-18', detail: `${r.status} ${r.json?.result?.serverInfo?.name ?? '?'} ${r.json?.result?.protocolVersion ?? '?'}` }
  })
  await check(`tools-list:${w.id}`, `tools/list ${w.id}`, async () => {
    const r = await req(mcp, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(2, 'tools/list') })
    const n = Array.isArray(r.json?.result?.tools) ? r.json.result.tools.length : 0
    return { ok: r.status === 200 && n > 0, detail: `${r.status} tools=${n}` }
  })
  await check(`tools-call:${w.id}`, `tools/call ${w.id}`, async () => {
    const list = await req(mcp, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(3, 'tools/list') })
    const tool = list.json?.result?.tools?.[0]
    if (!tool) return { ok: false, detail: 'no tool to call' }
    const r = await req(mcp, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(4, 'tools/call', { name: tool.name, arguments: {} }) })
    const result = r.json?.result
    const hasRealResult = Boolean(result?.structuredContent || result?.content) && result?.isError !== true
    return { ok: r.status === 200 && hasRealResult, detail: `${r.status} ${tool.name} realResult=${hasRealResult} rpcError=${r.json?.error?.code ?? '-'}` }
  })
}

// 3. Gateway: derived metrics, free tool, licence gate, notifications, errors.
await check('gw:metrics', 'gateway /health metrics are internally consistent', async () => {
  const r = await req(`${GW}/health`)
  const j = r.json || {}
  const list = await req(`${GW}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(9, 'tools/list') })
  const listed = Array.isArray(list.json?.result?.tools) ? list.json.result.tools.length : -1
  const derived = j.freeKernelTools + j.gatedProTools === j.toolCount && j.toolCount === listed
  const scoreOk = j.contractScore === 100
  return { ok: r.status === 200 && derived && scoreOk, detail: `${r.status} plugins=${j.pluginCount} tools=${j.toolCount} listed=${listed} free=${j.freeKernelTools} gated=${j.gatedProTools} sumOK=${derived} contract=${j.contractScore}` }
})
await check('gw:free-tool', 'gateway free tool returns real data with no key', async () => {
  const r = await req(`${GW}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(5, 'tools/call', { name: 'starlight_skill_lookup', arguments: {} }) })
  const payload = r.json?.result?.structuredContent || r.json?.result?.content
  return { ok: r.status === 200 && Boolean(payload) && !r.json?.result?.isError, detail: `${r.status} bytes=${JSON.stringify(payload ?? '').length}` }
})
await check('gw:licence-gate', 'gateway paid tool refuses without a licence key', async () => {
  const r = await req(`${GW}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(6, 'tools/call', { name: 'arcanea_taste_score', arguments: { prompt: 'a cinematic forest' } }) })
  return { ok: r.status === 401 && r.json?.error?.code === -32001, detail: `${r.status} code=${r.json?.error?.code ?? '-'}` }
})
await check('gw:notification', 'gateway answers notifications 202 with an empty body', async () => {
  const r = await req(`${GW}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: { jsonrpc: '2.0', method: 'notifications/initialized', params: {} } })
  return { ok: r.status === 202 && r.text.length === 0, detail: `${r.status} bodyBytes=${r.text.length}` }
})
await check('gw:unknown-method', 'gateway unknown method with an id is 404 -32601', async () => {
  const r = await req(`${GW}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(7, 'no/such/method') })
  return { ok: r.status === 404 && r.json?.error?.code === -32601, detail: `${r.status} code=${r.json?.error?.code ?? '-'}` }
})
await check('gw:malformed', 'gateway malformed JSON is 400 -32700', async () => {
  const r = await req(`${GW}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' })
  return { ok: r.status === 400 && r.json?.error?.code === -32700, detail: `${r.status} code=${r.json?.error?.code ?? '-'}` }
})

// 4. Branded portal and the one live capture door.
await check('portal:html', 'portal serves its HTML to a browser Accept header', async () => {
  const r = await req(PORTAL, { headers: { accept: 'text/html,application/xhtml+xml' } })
  const title = (r.text.match(/<title>([^<]*)<\/title>/i) || [])[1] || ''
  return { ok: r.status === 200 && /Cloudflare MCP portal/i.test(title), detail: `${r.status} bytes=${r.text.length} title="${title}"` }
})
await check('portal:oauth', 'portal /mcp keeps its OAuth gate', async () => {
  const r = await req(`${PORTAL}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rpc(8, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'fleet-e2e', version: '1.0.0' } }) })
  const ok = r.status === 401 || r.status === 403
  return { ok, detail: `${r.status} (interactive OAuth required)` }
})
await check('waitlist:form', 'frankx.ai/waitlist renders its named capture form', async () => {
  const r = await req(WAITLIST, { follow: true })
  const named = /FrankX Waitlist/i.test(r.text) && /Join Waitlist/i.test(r.text) && /Email Address/i.test(r.text)
  return { ok: r.status === 200 && named, detail: `${r.status} bytes=${r.text.length} namedForm=${named}` }
})
gap('door:bespoke-waitlist', 'the only live capture door is bespoke', 'frankx.ai/waitlist has no productId, consent control or price question; it does not write a DemandSignal (TRUTH.md 5c.3)', 'product repo lane: install the standard two-step capture')

// 5. Known gaps, reported rather than hidden.
for (const [id, url] of [
  ['door:si-signal', 'https://starlightintelligence.ai/signal'],
  ['door:si-api', 'https://starlightintelligence.ai/api/waitlist'],
  ['door:ra-waitlist', 'https://realityarchitect.ai/waitlist'],
]) {
  try {
    const r = await req(url)
    gap(id, url, `GET returns ${r.status}`, 'product repo lane: point at the working waitlist', 'P0')
  } catch (e) {
    gap(id, url, `probe failed: ${String(e?.message ?? e).slice(0, 120)}`, 'product repo lane: point at the working waitlist', 'P0')
  }
}
const migrationDirs = []
const pluginsRoot = join(ESTATE, 'ops', 'agent-plugins')
if (existsSync(pluginsRoot)) {
  for (const name of readdirSync(pluginsRoot, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const f = join(pluginsRoot, name.name, 'wrangler.toml')
    if (existsSync(f) && /\[\[migrations\]\]/.test(readFileSync(f, 'utf8'))) migrationDirs.push(name.name)
  }
}
if (migrationDirs.length) {
  gap('config:migrations', 'wrangler 4.158.0 rejects new_sqlite_databases', `${migrationDirs.length} configs still carry [[migrations]]: ${migrationDirs.join(', ')}`, 'control-plane lane: remove the field')
}
gap('contract:sentinel', 'family-contract still reports 1 failure', 'sentinel/ has no package.json; it is also absent from directory.json and BUNDLE_ACCESS', 'control-plane lane: manifest + registration')
gap('data:signal-overwrite', 'a repeat waitlist submission overwrites earlier answers', 'packages/demand-capture/src/store.ts saveSignal does hset keyed by email; step-2 answers (urgency, pain, priceBand) are lost on re-submit. Found by e2e/demand-capture.e2e.test.mjs; a proven fix is in e2e/fix-signal-merge.mjs', 'control-plane lane: apply the merge fix', 'P1')

// 6. Receipt.
const hard = checks.filter((c) => c.ok).length
const failed = checks.filter((c) => !c.ok)
const now = new Date().toISOString()
const p0 = gaps.filter((g) => g.severity === 'P0')
const receipt = {
  schema: 'starlight.fleet-e2e/v1',
  generatedAt: now,
  estateRoot: ESTATE,
  suiteDir: SUITE_DIR,
  verdict: failed.length === 0 ? 'FLEET E2E PASS' : 'FLEET E2E FAIL',
  productionReadiness: p0.length || failed.length ? 'HOLD' : 'READY',
  readinessReason: p0.length ? `${p0.length} P0 gaps remain; the hard checks cover the deployed Workers, not the whole estate` : (failed.length ? 'hard checks failed' : 'no P0 gaps'),
  hardChecks: { total: checks.length, passed: hard, failed: failed.length },
  knownGaps: gaps,
  checks,
}
mkdirSync(dirname(JSON_OUT), { recursive: true })
writeFileSync(JSON_OUT, `${JSON.stringify(receipt, null, 2)}\n`)

const md = [
  `# Fleet production e2e - ${now.slice(0, 10)}`,
  '',
  `Verdict: **${receipt.verdict}**. Hard checks ${hard}/${checks.length} passed. Production readiness: **${receipt.productionReadiness}** (${receipt.readinessReason}).`,
  '',
  `${gaps.length} known gaps, ${p0.length} of them P0. Exit 0 means the deployed fleet answered every hard check; it does not mean the estate is ready to sell.`,
  '',
  '| Check | Result | Detail |',
  '|---|---|---|',
  ...checks.map((c) => `| ${c.label} | ${c.ok ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '\\|')} |`),
  '',
  '## Known gaps (reported, not hidden)',
  '',
  ...gaps.map((g) => `- **${g.id}**: ${g.detail}. Owner: ${g.owner}.`),
  '',
  `Receipt: \`${JSON_OUT}\``,
  '',
].join('\n')
if (MD_OUT) {
  mkdirSync(dirname(MD_OUT), { recursive: true })
  writeFileSync(MD_OUT, md)
}
console.log(md)
console.log(`exit=${failed.length ? 1 : 0}`)
process.exit(failed.length ? 1 : 0)
