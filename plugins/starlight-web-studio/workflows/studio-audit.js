export const meta = {
  name: 'studio-audit',
  description: 'Audit several sites in parallel: measure, read copy and findability, critique as a buyer, then rank proposals',
  whenToUse: 'Portfolio-wide or multi-page design, copy, SEO and AEO review. Pass args: {runId: "2026-10-20T1530", targets: [{id, url, repo}]}.',
  phases: [
    { title: 'Measure', detail: 'site-scout: machine scan, screenshots, eye rubric' },
    { title: 'Read', detail: 'copy-chief and search-strategist, audit only' },
    { title: 'Critique', detail: 'studio-critic through a second provider' },
    { title: 'Rank', detail: 'one proposal per site, ordered by leverage' },
  ],
}

const targets = (args && Array.isArray(args.targets) ? args.targets : []).filter(t => t && t.url)
if (!targets.length) {
  log('No targets. Pass args: {targets: [{id, url, repo}]}.')
  return { proposals: [], skipped: 'no targets' }
}
const ids = targets.map(t => t.id)
const unsafe = ids.filter(id => !/^[a-z0-9][a-z0-9._-]*$/i.test(String(id || '')))
// Case-insensitive: "Site" and "site" are one folder on Windows and macOS.
const folded = ids.map(id => String(id || '').toLowerCase())
const dupes = ids.filter((id, i) => folded.indexOf(folded[i]) !== i)
if (unsafe.length || dupes.length) {
  log(`Refusing to run: evidence folders would be unsafe or collide (${[...unsafe, ...dupes].join(', ')}). Give every target a unique id.`)
  return { proposals: [], skipped: 'bad target ids', unsafe, dupes }
}
// Each run writes its own folders so a second audit never overwrites the first. The script cannot
// read the clock, so the caller names the run (for example the date and time).
if (!args.runId) {
  log('Refusing to run: pass args.runId (for example "2026-10-20T1530") so this run does not overwrite an earlier one.')
  return { proposals: [], skipped: 'no runId' }
}
const run = String(args.runId).replace(/[^a-z0-9._-]/gi, '-')

const SCOUT = {
  type: 'object',
  properties: {
    machineScore: { type: 'number' },
    eyeScore: { type: 'number' },
    captured: { type: 'boolean' },
    topFixes: { type: 'array', items: { type: 'string' } },
    auditPath: { type: 'string' },
  },
  required: ['machineScore', 'eyeScore', 'captured', 'topFixes', 'auditPath'],
}

const LENS = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
    reportPath: { type: 'string' },
  },
  required: ['verdict', 'findings', 'reportPath'],
}

const CRITIQUE = {
  type: 'object',
  properties: {
    independentProvider: { type: 'string' },
    verdict: { type: 'string', enum: ['ship', 'revise', 'restart'] },
    worst: { type: 'array', items: { type: 'string' } },
    report: { type: 'string' },
  },
  required: ['independentProvider', 'verdict', 'worst', 'report'],
}

const RANKED = {
  type: 'object',
  properties: {
    proposals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          route: { type: 'string' },
          problem: { type: 'string' },
          roles: { type: 'array', items: { type: 'string' } },
          expectedChange: { type: 'string' },
          humanGate: { type: 'string' },
        },
        required: ['id', 'route', 'problem', 'roles', 'expectedChange', 'humanGate'],
      },
    },
  },
  required: ['proposals'],
}

const where = t => `Target id "${t.id}", URL ${t.url}${t.repo ? `, deployed from repo ${t.repo} (read origin/main)` : ''}. Evidence folder: .studio/${t.id}/${run}/.`

const results = await pipeline(
  targets,
  t => agent(
    `${where(t)} Run your full scout pass: machine scan, visual-proof capture at 375/768/1440, open every screenshot, score the studio-audit eye rubric, write audit.md. If capture is impossible set captured=false and eyeScore=0.`,
    { label: `scout:${t.id}`, phase: 'Measure', agentType: 'starlight-web-studio:site-scout', schema: SCOUT }),
  (scout, t) => !scout ? { scout: null, copy: null, search: null } : parallel([
    () => agent(
      `${where(t)} Audit only, edit nothing. Run the copy-desk five-second test and block-by-block verdicts on the first screen and the next two sections. Read .studio/${t.id}/${run}/audit.md first. Save .studio/${t.id}/${run}/copy.md.`,
      { label: `copy:${t.id}`, phase: 'Read', agentType: 'starlight-web-studio:copy-chief', schema: LENS }),
    () => agent(
      `${where(t)} Audit only, edit nothing. Use .studio/${t.id}/${run}/scan.json and the answer-engine skill: fetchability, server-rendered copy, JSON-LD against visible text, crawler policy. Save .studio/${t.id}/${run}/search.md.`,
      { label: `search:${t.id}`, phase: 'Read', agentType: 'starlight-web-studio:search-strategist', schema: LENS }),
  ]).then(([copy, search]) => ({ scout, copy, search })),
  (read, t) => !read.scout ? { target: t, ...read, critique: null } : agent(
    `${where(t)} Critique the live page as it is today, as the buyer who declined. Inputs: .studio/${t.id}/${run}/audit.md, copy.md, search.md and the screenshots. Run the independent pass through a different provider; if none is reachable set independentProvider to "missing".`,
    { label: `critic:${t.id}`, phase: 'Critique', agentType: 'starlight-web-studio:studio-critic', schema: CRITIQUE })
    .then(critique => ({ target: t, ...read, critique })),
)

// A site is ranked only when every stage returned. Anything else is reported as incomplete,
// with the stages that are missing, so a partial review never reads as a whole one.
const stages = ['scout', 'copy', 'search', 'critique']
const settled = results.map((r, i) => r || { target: targets[i] })
const incomplete = settled
  .map(r => ({ id: r.target.id, missing: stages.filter(s => !r[s]) }))
  .filter(r => r.missing.length)
const done = settled.filter(r => stages.every(s => r[s]))
if (incomplete.length) log(`Not ranked, review incomplete: ${incomplete.map(r => `${r.id} (missing ${r.missing.join(', ')})`).join('; ')}.`)
const blind = done.filter(r => !r.scout.captured).map(r => r.target.id)
if (blind.length) log(`No screenshots for: ${blind.join(', ')}. Their eye scores are not evidence.`)
const unverified = done.filter(r => /^missing$/i.test(r.critique.independentProvider)).map(r => r.target.id)
if (unverified.length) log(`No independent critique for: ${unverified.join(', ')}. Their critique is same-model only.`)
if (!done.length) return { proposals: [], incomplete, noScreenshots: blind, unverifiedCritique: unverified }

phase('Rank')
const ranked = await agent(
  `You are the studio director. Rank these sites by where one focused studio run moves the most, using the studio-protocol routes R2 to R5. Prefer regressions, tier-1 properties, and fixes with evidence. For each site give the route, the problem in one sentence with its evidence, the roles, the expected score change, and the human gate it needs ("none" for R2 hygiene).\n\n${JSON.stringify(done.map(r => ({ id: r.target.id, url: r.target.url, scout: r.scout, copy: r.copy, search: r.search, critique: r.critique && { provider: r.critique.independentProvider, verdict: r.critique.verdict, worst: r.critique.worst } })), null, 1)}`,
  { label: 'rank', phase: 'Rank', schema: RANKED })

return {
  run,
  proposals: ranked ? ranked.proposals : [],
  critiques: done.map(r => ({ id: r.target.id, provider: r.critique.independentProvider, report: r.critique.report })),
  incomplete,
  noScreenshots: blind,
  unverifiedCritique: unverified,
}
