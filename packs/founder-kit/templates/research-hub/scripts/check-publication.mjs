#!/usr/bin/env node
// Publication gate. Fails the build when an investigation breaks the rules.
// Usage: node scripts/check-publication.mjs [--dir <path>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const STATUSES = ["draft", "analysis", "reviewed"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "").trim());

export function checkFile(file, raw) {
  const errors = [];
  const { data } = matter(raw);
  for (const f of ["title", "kind", "summary"]) {
    if (!data[f] || typeof data[f] !== "string") errors.push(`missing or empty "${f}"`);
  }
  if (!STATUSES.includes(data.status)) {
    errors.push(`status must be one of ${STATUSES.join(", ")} (got "${data.status}")`);
  }
  const sources = data.sources ?? [];
  if (!Array.isArray(sources)) {
    errors.push(`"sources" must be a list`);
    return errors;
  }
  const good = [];
  sources.forEach((s, n) => {
    const where = `sources[${n}]`;
    let ok = true;
    if (!s || typeof s.title !== "string" || !s.title) { errors.push(`${where}: missing title`); ok = false; }
    try {
      const u = new URL(String(s?.url ?? ""));
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch { errors.push(`${where}: url must be a valid http(s) URL`); ok = false; }
    if (!ISO_DATE.test(toDate(s?.accessed))) { errors.push(`${where}: accessed must be a YYYY-MM-DD date`); ok = false; }
    if (ok) good.push(s);
  });
  if (data.status === "reviewed" && good.length < 1) {
    errors.push(`status "reviewed" needs at least 1 source with a url and an accessed date`);
  }
  return errors;
}

export function checkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir).filter((x) => /\.mdx?$/.test(x))) {
    results.push({ file: f, errors: checkFile(f, fs.readFileSync(path.join(dir, f), "utf8")) });
  }
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--dir");
  const dir = i > -1 ? path.resolve(process.argv[i + 1]) : path.join(process.cwd(), "content", "investigations");
  const results = checkDir(dir);
  const failed = results.filter((r) => r.errors.length);
  for (const r of failed) for (const e of r.errors) console.error(`FAIL ${r.file}: ${e}`);
  if (failed.length) {
    console.error(`\nPublication check failed: ${failed.length} of ${results.length} file(s).`);
    process.exit(1);
  }
  console.log(`Publication check passed: ${results.length} file(s).`);
}
