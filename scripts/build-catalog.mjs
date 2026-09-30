#!/usr/bin/env node
// Builds catalog/skills.json, the agent-readable index of this marketplace.
//   node scripts/build-catalog.mjs          write catalog/skills.json
//   node scripts/build-catalog.mjs --check  exit 1 if catalog/skills.json is stale
// Output carries no timestamp so --check is deterministic.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKETPLACE = path.join(ROOT, ".claude-plugin", "marketplace.json");
const OUT = path.join(ROOT, "catalog", "skills.json");
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
        if (nxt.length === nxt.trimStart().length) break;
        block.push(nxt.trim());
        i++;
      }
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

function localSkills(plugin) {
  return skillDirs(plugin).map((dir) => {
    const fm = frontmatter(fs.readFileSync(path.join(dir, "SKILL.md"), "utf8"));
    if (!fm?.name || !fm?.description) {
      throw new Error(`missing name/description frontmatter: ${path.relative(ROOT, dir)}`);
    }
    return {
      name: fm.name,
      description: fm.description,
      path: path.relative(ROOT, dir).split(path.sep).join("/"),
      hasEvals: fs.existsSync(path.join(dir, "evals")),
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

function build() {
  const mp = JSON.parse(fs.readFileSync(MARKETPLACE, "utf8"));
  const plugins = mp.plugins.map((p) => {
    const local = typeof p.source === "string";
    const skills = local ? localSkills(p) : null;
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
  return {
    schema: "claude-skills-library/catalog@1",
    generatedBy: "scripts/build-catalog.mjs",
    marketplace: { name: mp.name, repo: REPO, description: mp.description, pluginCount: plugins.length },
    totals: {
      pluginsWithListedSkills: listed.length,
      skills: listed.reduce((n, p) => n + p.skills.length, 0),
      skillsWithEvals: listed.reduce((n, p) => n + p.skills.filter((s) => s.hasEvals).length, 0),
      pluginsFromOtherRepos: plugins.length - listed.length,
    },
    plugins,
  };
}

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
  console.log(`wrote catalog/skills.json: ${t.skills} skills (${t.skillsWithEvals} with evals) across ${t.pluginsWithListedSkills} local plugin(s); ${t.pluginsFromOtherRepos} plugin(s) from other repos.`);
}
