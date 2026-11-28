#!/usr/bin/env node
/**
 * eval-pack-scoreboard.mjs — measure the goals in GOALS.md, never type them.
 *
 * Run:
 *   node scripts/eval-pack-scoreboard.mjs --estate-root C:/Users/frank/starlight
 *   node scripts/eval-pack-scoreboard.mjs --estate-root C:/Users/frank/starlight --strict
 *
 * Reads the estate control plane (read-only) and live GitHub signals, writes one generated
 * JSON file inside this product's docs directory, and prints the goal table. A metric whose
 * source command fails is reported as [OPEN] with the reason, never as zero. --strict exits 1
 * if any goal is FAIL, so a phase cannot report green while a hard gate is red.
 *
 * Independent review 2026-11-07 (oracle subagent) found that a regex-only G7 and a
 * header-only G9 could ship green without evidence. Both now check content on disk.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DOCS = resolve(HERE, '..', 'docs', 'products', 'claude-skills-eval-pack')
const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const valueOf = (name) => {
  const i = args.indexOf(name)
  return i !== -1 && i + 1 < args.length ? args[i + 1] : null
}

// Walk up for the control-plane marker instead of assuming a worktree layout.
function findRoot(start) {
  let dir = resolve(start)
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'graph', 'skills.graph.json'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}
const explicit = valueOf('--estate-root')
const ROOT = explicit ? resolve(explicit) : findRoot(HERE)
if (!ROOT || !existsSync(join(ROOT, 'graph', 'skills.graph.json'))) {
  console.error(`eval-pack-scoreboard: estate root not found${explicit ? ` at ${explicit}` : ''}; pass --estate-root <dir containing graph/skills.graph.json>`)
  process.exit(2)
}
const NOW = new Date().toISOString()

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}
function readText(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}
function ghJson(argv) {
  try {
    return JSON.parse(execFileSync('gh', argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
  } catch {
    return null
  }
}
function nodeExit(argv) {
  try {
    execFileSync('node', argv, { stdio: 'ignore' })
    return 0
  } catch (e) {
    return e.status ?? 1
  }
}
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(2)}%` : '[OPEN]')

const graph = readJson(join(ROOT, 'graph', 'skills.graph.json'))
const verdicts = readJson(join(ROOT, 'ops', 'skill-eval-verdicts.json'))
const products = readJson(join(ROOT, 'graph', 'products.graph.json'))
const harnesses = readJson(join(HERE, '..', 'runtimes', 'harnesses.json'))
const harnessCount = Array.isArray(harnesses?.harnesses) ? harnesses.harnesses.length : null
const measuredHarnesses = harnessCount === null ? null : harnesses.harnesses.filter((h) => !String(h.discovery).startsWith('[OPEN]') && !String(h.install).startsWith('[OPEN]')).length
const stateCount = (state) => harnessCount === null ? null : harnesses.harnesses.filter((h) => (h.pathState || (String(h.discovery).startsWith('[OPEN]') ? 'open' : 'verified')) === state).length
const harnessTestExit = nodeExit(['--test', join(HERE, '..', 'scripts', 'tests', 'harness-surface.test.mjs')])
const row = products?.products?.find((p) => p.id === 'claude-skills-eval-pack') ?? null
const traffic = ghJson(['api', 'repos/frankxai/claude-skills-library/traffic/views'])
const paths = ghJson(['api', 'repos/frankxai/claude-skills-library/traffic/popular/paths'])
const openPrs = ghJson(['search', 'prs', '--repo', 'frankxai/claude-skills-library', '--state', 'open', '--limit', '100', '--json', 'number'])

const names = graph?.counts?.uniqueNames ?? null
const withEval = graph?.counts?.withEval ?? null
const conflicts = graph?.counts?.conflicts ?? null
const passed = verdicts?.passed ?? null
const faults = verdicts?.plantedFaultsCaught ?? null
const uniques = traffic?.uniques ?? null
const views = traffic?.count ?? null
const trafficDays = Array.isArray(traffic?.views) ? traffic.views.length : null
const prCount = Array.isArray(openPrs) ? openPrs.length : null

// G3: parse the fault ratio rather than hardcoding a string; check verdict staleness.
let faultsOk = false
let staleCount = 0
let staleNames = []
if (typeof faults === 'string' && /^\d+\/\d+$/.test(faults)) {
  const [a, b] = faults.split('/').map(Number)
  faultsOk = a === b && b >= 90
}
const ownerByName = new Map((graph?.skills ?? []).map((s) => [s.name, s.owner?.updated ?? null]))
for (const [name, v] of Object.entries(verdicts?.skills ?? {})) {
  const updated = ownerByName.get(name)
  const evaluated = v?.evaluatedAt
  if (updated && evaluated && updated > evaluated) {
    staleCount++
    if (staleNames.length < 5) staleNames.push(name)
  }
}

// G1: rank skills from any popular path under free-skills, not only SKILL.md paths.
const trafficSlugs = []
for (const entry of Array.isArray(paths) ? paths : []) {
  const path = String(entry.path || '')
  if (!path.includes('/free-skills/')) continue
  const parts = path.split('/free-skills/')[1].split('/').filter(Boolean).filter((p) => p !== 'SKILL.md' && !p.startsWith('SKILL.'))
  if (!parts.length) continue
  const slug = parts[parts.length - 1]
  if (!trafficSlugs.includes(slug)) trafficSlugs.push(slug)
}
const topTen = trafficSlugs.slice(0, 10)
const topTenComplete = topTen.length === 10
const topTenWithVerdict = topTen.filter((s) => verdicts?.skills?.[s]?.verdict === 'PASS').length

const suiteFiles = [
  'README.md', 'PRD.md', 'CAPABILITY-MAP.md', 'GOALS.md', 'PHASES.md', 'DESIGN-EXPECTATIONS.md',
  'SPEC-verdict-store.md', 'SPEC-eval-runner.md', 'SPEC-catalog.md', 'SPEC-capture.md',
  'SPEC-publication.md', 'SPEC-harness-surface.md', 'HARNESS-COVERAGE.md',
  'evidence/red-green-2026-11-07.md',
  'tasks/plan.md', 'tasks/todo.md', 'adr/README.md', 'adr/0005-one-manifest-many-harnesses.md',
  'CRAFT-RECEIPT.md',
]
const suitePresent = suiteFiles.filter((f) => existsSync(join(DOCS, f))).length
const craftExit = nodeExit([
  join(ROOT, 'tools', 'craft-receipt.mjs'),
  '--product', 'claude-skills-eval-pack',
  '--receipt', join(DOCS, 'CRAFT-RECEIPT.md'),
])
const craftText = readText(join(DOCS, 'CRAFT-RECEIPT.md')) ?? ''
const critiqueSection = craftText.split(/^## Critique/im)[1] ?? ''
const critiqueOk =
  critiqueSection.length > 0 &&
  !/pending/i.test(critiqueSection) &&
  /reviewer|provider|independent/i.test(critiqueSection) &&
  /finding/i.test(critiqueSection) &&
  /fix/i.test(critiqueSection) &&
  /\b[0-9a-f]{7,40}\b/i.test(critiqueSection)

const demandExit = nodeExit([join(ROOT, 'packages', 'demand-capture', 'report.mjs')])
const enumOk = row ? ['skill-pack', 'mcp-server', 'prompt-library', 'template', 'book', 'course', 'community', 'media-ip', 'platform'].includes(row.listType) : false

// G7: a gate string is not evidence. Require dated receipt files covering G0-G5 with paths.
const gateDir = join(ROOT, 'queen', 'reports', 'product-gates')
let gateReceipts = []
if (existsSync(gateDir)) {
  gateReceipts = readdirSync(gateDir).filter((f) => f.includes('claude-skills-eval-pack'))
}
let gatesComplete = false
for (const f of gateReceipts) {
  const text = readText(join(gateDir, f)) ?? ''
  const gates = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5']
  if (gates.every((g) => new RegExp(`\\|\\s*${g}\\b[^|]*\\|\\s*PASS`, 'i').test(text)) && /\d{4}-\d{2}-\d{2}/.test(text)) {
    gatesComplete = true
    break
  }
}
const gatePass = !!row && /^PASS/.test(row.gate) && gatesComplete

const goals = [
  {
    id: 'G1', name: 'Proof on every listing',
    current: withEval !== null && names !== null && topTenComplete
      ? `${withEval} / ${names} = ${pct(withEval, names)}; top-10 traffic with verdict ${topTenWithVerdict}/10`
      : '[OPEN] coverage or traffic ranking incomplete',
    target: '>=10% and all top-10 traffic skills',
    status: withEval !== null && names !== null && topTenComplete && withEval / names >= 0.1 && topTenWithVerdict === 10 ? 'PASS' : 'FAIL',
    command: 'node scripts/eval-pack-scoreboard.mjs',
    note: `traffic slugs found: ${topTen.length}${topTen.length ? ' (' + topTen.join(', ') + ')' : ''}`,
  },
  {
    id: 'G2', name: 'Namespace is unambiguous',
    current: conflicts === null ? '[OPEN]' : `${conflicts} unresolved conflicts`,
    target: '0 (hard gate)',
    status: conflicts === 0 ? 'PASS' : 'FAIL',
    command: 'node tools/gen-skills-graph.mjs',
    note: '15 names resolved by catalog-over-internal-pack (RULED 2026-10-24)',
  },
  {
    id: 'G3', name: 'The grader refuses rubber stamps',
    current: `${faults ?? '[OPEN]'} faults; ${staleCount} stale verdict(s)`,
    target: '100% of planted faults caught, no stale verdict',
    status: faultsOk && staleCount === 0 ? 'PASS' : 'FAIL',
    command: 'Get-Content ops/skill-eval-verdicts.json + graph/skills.graph.json',
    note: `verdicts updated ${verdicts?.updatedAt ?? '[OPEN]'}${staleNames.length ? '; stale: ' + staleNames.join(', ') : ''}`,
  },
  {
    id: 'G4', name: 'Real demand evidence',
    current: demandExit === 0 ? 'report.mjs exits 0' : 'report.mjs exit 1 (KV credentials missing)',
    target: '>=1 DemandSignal with priceBand',
    status: demandExit === 0 ? 'PASS' : 'BLOCKED',
    command: 'node packages/demand-capture/report.mjs',
    note: 'Frank holds KV + Resend; no bespoke fallback is permitted',
  },
  {
    id: 'G5', name: 'Audience on the measured channel',
    current: uniques === null ? '[OPEN]' : `${views} views / ${uniques} uniques (${trafficDays ?? '[OPEN]'}-day window)`,
    target: '1,000 uniques in the API window',
    status: uniques === null ? 'OPEN' : uniques >= 1000 ? 'PASS' : 'BEHIND',
    command: 'gh api repos/frankxai/claude-skills-library/traffic/views',
    note: 'GitHub traffic/views returns a rolling window; snapshots from different dates overlap and are not a trend',
  },
  {
    id: 'G6', name: 'One installable, versioned pack',
    current: '[OPEN] no pack published',
    target: 'installable on three harnesses, version equals repo',
    status: 'FAIL',
    command: 'npm view <pkg> version',
    note: 'Phase 4, Frank gate',
  },
  {
    id: 'G7', name: 'Gate receipts before money',
    current: row ? `${row.gate}; dated receipts covering G0-G5: ${gatesComplete ? 'yes' : 'none'}` : '[OPEN] row missing',
    target: 'dated PASS with G5 price evidence AND receipt files',
    status: gatePass ? 'PASS' : 'FAIL',
    command: 'Get-Content graph/products.graph.json + ls queen/reports/product-gates/',
    note: `listType ${row?.listType ?? '[OPEN]'} ${enumOk ? 'valid' : 'DRIFT: not in the section 12 enum'}; a string match alone never sets this PASS`,
  },
  {
    id: 'G8', name: 'Queue stays admissible',
    current: prCount === null ? '[OPEN]' : `${prCount} / 10 budget`,
    target: '<=10 at every PR',
    status: prCount !== null && prCount <= 10 ? 'PASS' : 'FAIL',
    command: 'gh search prs --repo frankxai/claude-skills-library --state open --limit 100 --json number',
    note: 'quote this number in every PR body',
  },
  {
    id: 'G9', name: 'Craft bar is evidenced',
    current: `suite ${suitePresent}/${suiteFiles.length} files; craft-receipt exit ${craftExit}; critique content ${critiqueOk ? 'closed' : 'missing'}`,
    target: '4/4 blocks PASS, critique names reviewer/findings/fixes at a revision',
    status: craftExit === 0 && suitePresent === suiteFiles.length && critiqueOk ? 'PASS' : 'FAIL',
    command: 'node tools/craft-receipt.mjs --product claude-skills-eval-pack --receipt <path>',
    note: 'header presence alone is not a critique',
  },
  {
    id: 'G10', name: 'Mobile-native public surface',
    current: '[OPEN] no page built in this slice',
    target: '10/10 section 11.3 predicates + real-device Playwright',
    status: 'BLOCKED',
    command: '.claude/ci/web-guidelines-lint.mjs --changed',
    note: 'visual reference lock is deferred until Phase 2',
  },
  {
    id: 'G11', name: 'Every harness has a sourced install surface',
    current: harnessCount === null ? '[OPEN] manifest unreadable' : `${harnessCount} adapter docs / ${measuredHarnesses} sourced (${stateCount('verified')} verified, ${stateCount('documented')} documented, ${stateCount('open')} open)`,
    target: `${harnessCount ?? 14}/${harnessCount ?? 14} sourced, --verify exit 0`,
    status: harnessCount !== null && measuredHarnesses === harnessCount ? 'PASS' : 'FAIL',
    command: 'node scripts/install-any-agent.mjs --all --verify',
    note: '2 surfaces remain [OPEN] with failed probes recorded; a documented path is not a working install',
  },
  {
    id: 'G12', name: 'Planted-fault regression suite passes',
    current: `node --test harness-surface.test.mjs exit ${harnessTestExit}`,
    target: '9/9 pass, 0 fail',
    status: harnessTestExit === 0 ? 'PASS' : 'FAIL',
    command: 'node --test scripts/tests/harness-surface.test.mjs',
    note: 'path states, exit codes 2/3/4/5, JSON-mode faults, manifest fail-closed, docs guard, idempotency, fake HOME',
  },
]

const doc = {
  schema: 'eval-pack-scoreboard.v4',
  generatedAt: NOW,
  estateRoot: ROOT,
  productId: 'claude-skills-eval-pack',
  sources: {
    skillsGraph: graph ? 'graph/skills.graph.json' : null,
    verdicts: verdicts ? 'ops/skill-eval-verdicts.json' : null,
    productsGraph: products ? 'graph/products.graph.json' : null,
    traffic: traffic ? 'gh api .../traffic/views' : null,
    trafficPaths: paths ? 'gh api .../traffic/popular/paths' : null,
    openPrs: openPrs ? 'gh search prs' : null,
    harnesses: harnesses ? 'runtimes/harnesses.json' : null,
  },
  measured: {
    names, withEval, conflicts, passed, faults, faultsOk, staleCount, staleNames,
    views, uniques, trafficDays, prCount, topTen, topTenComplete, topTenWithVerdict,
    suitePresent, suiteFiles: suiteFiles.length, craftExit, critiqueOk, demandExit,
    harnessCount, measuredHarnesses, harnessTestExit,
    verifiedHarnesses: stateCount('verified'), documentedHarnesses: stateCount('documented'), openHarnesses: stateCount('open'),
    listType: row?.listType ?? null, enumOk, gateReceipts, gatesComplete, gatePass,
  },
  goals,
  northStar: { metric: 'shipped artifacts / provider-% burned', status: '[OPEN]', reason: 'cost collector output not pulled in this run' },
}
mkdirSync(DOCS, { recursive: true })
writeFileSync(join(DOCS, 'scoreboard.latest.json'), `${JSON.stringify(doc, null, 2)}\n`)

const lines = [
  `# Goal scoreboard - claude-skills-eval-pack - ${NOW}`,
  '',
  `Estate root: ${ROOT}. Values are measured by their named command; [OPEN] is never guessed.`,
  '',
  '| Goal | Current | Target | Status | Command |',
  '|---|---|---|---|---|',
]
for (const g of goals) lines.push(`| ${g.id} ${g.name} | ${g.current} | ${g.target} | **${g.status}** | \`${g.command}\` |`)
lines.push('', `North-star: ${doc.northStar.metric} - ${doc.northStar.status} (${doc.northStar.reason}).`, '')
for (const g of goals) lines.push(`- ${g.id}: ${g.note}`)
console.log(lines.join('\n'))
console.log(`\nwrote ${join(DOCS, 'scoreboard.latest.json')}`)

if (flag('--strict') && goals.some((g) => g.status === 'FAIL')) {
  console.error(`strict: ${goals.filter((g) => g.status === 'FAIL').length} goal(s) FAIL`)
  process.exit(1)
}
