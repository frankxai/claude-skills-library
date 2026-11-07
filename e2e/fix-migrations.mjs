#!/usr/bin/env node
/**
 * Remove the `[[migrations]]` stanza that wrangler 4.158.0 rejects from the
 * agent-plugin configs. Verified live: `npx wrangler deploy --dry-run` on a
 * config carrying `new_sqlite_databases` prints
 *   Unexpected fields found in migrations field: "new_sqlite_databases"
 * and still exits 0. The three configs that deployed cleanly carry no such field.
 *
 *   node e2e/fix-migrations.mjs              # dry run, writes nothing
 *   node e2e/fix-migrations.mjs --apply      # write, requires a control-plane lane
 *
 * `ops/agent-plugins/` lives in the estate control plane. `tools/verify-lane.mjs`
 * blocks writes there from a product worktree, so --apply is intentionally not
 * the default and is not run from this lane.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ESTATE = resolve(HERE, '..', '..', '..')
const ROOT = join(ESTATE, 'ops', 'agent-plugins')
const APPLY = process.argv.includes('--apply')

/** Remove the [[migrations]] table and its key/value lines, LF or CRLF safe. */
function stripStanza(text) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => l.trim() === '[[migrations]]')
  if (start === -1) return null
  let end = start + 1
  while (end < lines.length && !/^\s*\[/.test(lines[end])) end++
  const kept = [...lines.slice(0, start), ...lines.slice(end)]
  while (kept.length && kept[0].trim() === '') kept.shift()
  return { after: kept.join(nl), removed: lines.slice(start, end).join(nl) }
}

if (!existsSync(ROOT)) {
  console.error(`agent-plugins root not found: ${ROOT}`)
  process.exit(2)
}

const rows = []
for (const entry of readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const file = join(ROOT, entry.name, 'wrangler.toml')
  if (!existsSync(file)) continue
  const before = readFileSync(file, 'utf8')
  const strip = stripStanza(before)
  if (!strip) continue
  const { after, removed } = strip
  if (after.includes('new_sqlite_databases') || !after.includes('[')) {
    console.error(`refusing ${entry.name}: result does not look like valid TOML`)
    process.exit(3)
  }
  rows.push({ id: entry.name, file, removed: removed.trim(), before, after })
}

console.log(`# fix-migrations ${APPLY ? 'APPLY' : 'DRY RUN'}`, '\n')
console.log(`configs with a [[migrations]] stanza: ${rows.length}`)
for (const r of rows) {
  console.log(`\n## ${r.id}`)
  console.log('removing:')
  for (const line of r.removed.split('\n')) console.log(`  - ${line}`)
  if (APPLY) {
    writeFileSync(r.file, r.after)
    console.log('  written')
  }
}
if (!APPLY) {
  console.log('\nNo files written. Re-run with --apply from a control-plane lane, then:')
  console.log('  for each changed dir: npx wrangler deploy --dry-run')
  console.log('  expected: no "Unexpected fields" warning, exit 0')
}
console.log(`\nexit=0`)
