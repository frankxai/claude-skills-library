#!/usr/bin/env node
// Builds catalog/skills.json, the agent-readable index of this marketplace.
//   node scripts/build-catalog.mjs          write catalog/skills.json
//   node scripts/build-catalog.mjs --check  exit 1 if catalog/skills.json is stale
// Output carries no timestamp so --check is deterministic.
//
// The catalog is a registry, not a list. Every skill carries its canonical owner, its canonical
// version, the eval suites that exist for it, the eval verdict when the estate has one, and a
// stable install URI. catalog/ownership.json is the estate-published source for owner, version
// and verdict; the library never hand-edits it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKETPLACE = path.join(ROOT, ".claude-plugin", "marketplace.json");
const OUT = path.join(ROOT, "catalog", "skills.json");
const OWNERSHIP = path.join(ROOT, "catalog", "ownership.json");
const PACKS = path.join(ROOT, "packs");
const REPO = "frankxai/claude-skills-library";

const BRANDS = {
  "creator-os-core": "GenCreator",
  "starlight-academy": "Starlight",
  "starlight-department-lab": "Starlight",
  "claude-skills-library": "Tooling",
};

const CODEX_DOCS = "https://learn.chatgpt.com/docs/build-skills";
const SKILLS_CLI_DOCS = "https://github.com/vercel-labs/skills";

const BLOCK = new Set(["|", ">", "|-", ">-", "|+", ">+"]);

// Mirrors scripts/_skillmeta.py: plain key/value pairs plus block scalars.
function frontmatter(text) {
  const m = text.match(/^﻿?---\s*\n([\s\S]*?)\n?---/);
  if (!m) return null;
  const lines = m[1].replace(/\r/g, "").split("\n");
  const fm = {};
  for (let i = 0; i < lines.length; ) {
    const km = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!km) { i++; continue; }
    const [, key, raw] = km;
    const val = raw.trim();
    if (BLOCK.has(val)) {
      const block = [];
      i++;
      while (i < lines.length) {
        const nxt = lines[i];
        if (nxt.trim() === "") { block.push(""); i++; continue; }
        // A dedent ends the block. The more-indented lines are the block body.
        if (nxt.length === nxt.trimStart().length) break;
        block.push(nxt.trim());
        i++;
      }
      while (block.length && block[block.length - 1] === "") block.pop();
      fm[key] = block.join(val.startsWith("|") ? "\n" : " ").trim();
    } else {
      fm[key] = val.replace(/^["']|["']$/g, "").trim();
      i++;
    }
  }
  return fm;
}

function skillDirs(plugin) {
  const base = path.join(ROOT, plugin.source);
  const roots = plugin.skills ?? ["./skills"];
  const dirs = [];
  for (const rel of roots) {
    const dir = path.join(base, rel);
    if (fs.existsSync(path.join(dir, "SKILL.md"))) { dirs.push(dir); continue; }
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, "SKILL.md"))) {
        dirs.push(path.join(dir, entry.name));
      }
    }
  }
  return dirs.sort();
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function ownershipIndex() {
  if (!fs.existsSync(OWNERSHIP)) return { map: new Map(), provenance: null };
  const doc = JSON.parse(fs.readFileSync(OWNERSHIP, "utf8"));
  return { map: new Map((doc.skills || []).map((s) => [s.name, s])), provenance: doc.provenance || null };
}

// Eval suites live in two places: beside the skill, and inside a pack that ships the suite.
function evalSuites(name, dir) {
  const found = [];
  const beside = path.join(dir, "evals");
  if (fs.existsSync(beside)) found.push(rel(beside));
  if (fs.existsSync(PACKS)) {
    for (const pack of fs.readdirSync(PACKS, { withFileTypes: true })) {
      if (!pack.isDirectory()) continue;
      const shipped = path.join(PACKS, pack.name, "evals", name);
      if (fs.existsSync(shipped)) found.push(rel(shipped));
    }
  }
  return found.sort();
}

function localSkills(plugin, own) {
  return skillDirs(plugin).map((dir) => {
    const fm = frontmatter(fs.readFileSync(path.join(dir, "SKILL.md"), "utf8"));
    if (!fm?.name || !fm?.description) {
      throw new Error(`missing name/description frontmatter: ${rel(dir)}`);
    }
    const record = own.map.get(fm.name);
    const suites = evalSuites(fm.name, dir);

    // The canonical owner decides the URI and the version. A copy in this repo is a mirror when
    // the resolver says another repo owns the name.
    const owner = record?.owner
      ? { repo: record.owner.repo, path: record.owner.path }
      : { repo: REPO, path: rel(dir) };
    const canonicalVersion = record?.version ?? null;
    const publishedVersion = fm.version ?? null;
    const version = canonicalVersion ?? publishedVersion;
    const versionConflict =
      canonicalVersion && publishedVersion && canonicalVersion !== publishedVersion
        ? { name: fm.name, published: publishedVersion, canonical: canonicalVersion }
        : null;

    return {
      name: fm.name,
      description: fm.description,
      path: rel(dir),
      version,
      hasEvals: suites.length > 0,
      evalSuites: suites,
      eval: record?.eval
        ? {
            verdict: record.eval.verdict,
            evaluatedAt: record.eval.evaluatedAt,
            receipt: record.eval.receipt ?? null
          }
        : null,
      owner,
      uri: `github:${owner.repo}/${owner.path}${version ? `@${version}` : ""}`,
      ...(versionConflict ? { versionConflict } : {})
    };
  });
}

function install(plugin, local) {
  const claudeCode = `/plugin marketplace add ${REPO} then /plugin install ${plugin.name}@claude-skills-library`;
  if (local) {
    return {
      claudeCode,
      codex: `Copy any skill folder listed under skills[].path into ~/.agents/skills/ (user) or <repo>/.agents/skills/ (project); Codex discovers SKILL.md folders there.`,
      skillsCli: `npx skills add ${REPO}`,
      note: `codex paths from ${CODEX_DOCS}; skillsCli syntax (owner/repo, -a codex|claude-code, -s <skill>) from ${SKILLS_CLI_DOCS}. Neither was executed against this repo.`,
    };
  }
  const repo = plugin.source.url.replace(/\.git$/, "");
  return {
    claudeCode,
    codex: `Clone ${repo} at ${plugin.source.sha}, then copy the skill folders under ${plugin.source.path}/skills/ into ~/.agents/skills/ or <repo>/.agents/skills/.`,
    skillsCli: null,
    note: `Skills live in another repo and are not listed here (not fetched). codex paths from ${CODEX_DOCS}; the plugin's skills directory layout is assumed, not verified.`,
  };
}

export function build() {
  const mp = JSON.parse(fs.readFileSync(MARKETPLACE, "utf8"));
  const own = ownershipIndex();
  const versionConflicts = [];
  const plugins = mp.plugins.map((p) => {
    const local = typeof p.source === "string";
    const skills = local ? localSkills(p, own) : null;
    if (skills) for (const s of skills) if (s.versionConflict) versionConflicts.push(s.versionConflict);
    return {
      name: p.name,
      brand: BRANDS[p.name] ?? null,
      description: p.description,
      source: local
        ? { type: "local", path: p.source }
        : { type: p.source.source, repo: p.source.url, path: p.source.path, ref: p.source.ref, sha: p.source.sha },
      skillCount: skills ? skills.length : null,
      skills,
      install: install(p, local),
    };
  });
  const listed = plugins.filter((p) => p.skills);
  const allSkills = listed.flatMap((p) => p.skills);
  return {
    schema: "claude-skills-library/catalog@2",
    generatedBy: "scripts/build-catalog.mjs",
    marketplace: { name: mp.name, repo: REPO, description: mp.description, pluginCount: plugins.length },
    ownership: own.provenance,
    totals: {
      pluginsWithListedSkills: listed.length,
      skills: allSkills.length,
      skillsWithEvals: allSkills.filter((s) => s.hasEvals).length,
      skillsWithEvalVerdict: allSkills.filter((s) => s.eval).length,
      skillsWithVersion: allSkills.filter((s) => s.version).length,
      skillsOwnedElsewhere: allSkills.filter((s) => s.owner.repo !== REPO).length,
      versionConflicts: versionConflicts.length,
      pluginsFromOtherRepos: plugins.length - listed.length
    },
    versionConflicts,
    plugins,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const text = JSON.stringify(build(), null, 2) + "\n";
  if (process.argv.includes("--check")) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
    if (current !== text) {
      console.error("catalog/skills.json is stale. Run: node scripts/build-catalog.mjs");
      process.exit(1);
    }
    console.log("catalog/skills.json is up to date.");
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, text);
    const t = JSON.parse(text).totals;
    console.log(`wrote catalog/skills.json: ${t.skills} skills (${t.skillsWithEvals} with eval suites, ${t.skillsWithEvalVerdict} with an estate verdict, ${t.skillsOwnedElsewhere} owned elsewhere, ${t.versionConflicts} version conflicts) across ${t.pluginsWithListedSkills} local plugin(s); ${t.pluginsFromOtherRepos} plugin(s) from other repos.`);
  }
}
