#!/usr/bin/env python3
"""Generate docs/CATALOG.md from the frontmatter of every SKILL.md.

Skills are deduplicated by `name` (the shortest path wins, so a top-level skill
folder is preferred over a nested duplicate) and grouped into categories by a
simple, ordered keyword map. Run this whenever skills are added or renamed:

    python3 scripts/generate_catalog.py
"""
from __future__ import annotations
import collections
import os
import re

HERE = os.path.dirname(__file__)
ROOT = os.path.normpath(os.path.join(HERE, "..", "free-skills"))
REPO = os.path.normpath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "docs", "CATALOG.md")

FM_RE = re.compile(r"^\ufeff?---\s*\n(.*?)\n?---", re.S)

# Ordered (first match wins). Each entry: (category title, name-regex).
CATEGORIES = [
    ("AI Agents & Orchestration", r"agentic|swarm|hive-mind|stream-chain|model-routing|reasoningbank|memory-prune|opus-extended|sparc|pair-programming|nextjs-agent-team"),
    ("AI Frameworks, MCP & SDKs", r"^mcp|mcp-|openai-agentkit|claude-sdk|langgraph|oracle-adk|oracle-agent-spec|partner-"),
    ("Oracle & Cloud", r"oracle|^oci|^si$|ai-architecture"),
    ("Web, Frontend & Animation", r"nextjs|tailwind|^three$|framer|web-design|ui-ux|css-animations|animejs|gsap|lottie|waapi|defuddle"),
    ("Engineering Workflow & GitHub", r"github|performance-analysis|verification-quality|hooks-automation|worker-|skill-comply|template-skill"),
    ("Content, Writing & Brand", r"brand|book|newsletter|social-media|content-strategy|creator|prompt-hub|internal-comms"),
    ("Creative & Media Production", r"suno|higgsfield|hyperframes|website-to|remotion|starlight|arcanea|acos|cacos|video-production|algorithmic-art|canvas|theme-factory|slack-gif|artifacts-builder|creator-intelligence"),
    ("Mind, Body & Philosophy", r"greek-philosopher|spartan|gym-training|health-nutrition|soulbook|frankx-daily"),
    ("Documents & Productivity", r"^pdf$|^docx$|^pptx$|^xlsx$|webapp-testing|mcp-builder|product-management"),
    ("Meta & Library", r"meta$|contribute-catalog|brand-guidelines"),
]


def parse_frontmatter(path: str) -> dict:
    text = open(path, encoding="latin-1").read()
    m = FM_RE.match(text)
    fm: dict[str, str] = {}
    if m:
        for line in m.group(1).splitlines():
            kv = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
            if kv:
                fm[kv.group(1)] = kv.group(2).strip().strip('"')
    return fm


def collect() -> dict[str, tuple[str, str]]:
    skills: dict[str, tuple[str, str]] = {}
    for dirpath, _dirs, files in os.walk(ROOT):
        for fn in files:
            if fn.lower() != "skill.md":
                continue
            p = os.path.join(dirpath, fn)
            fm = parse_frontmatter(p)
            name = fm.get("name")
            if not name:
                continue
            rel = os.path.relpath(p, REPO).replace(os.sep, "/")
            if name not in skills or len(rel) < len(skills[name][0]):
                skills[name] = (rel, fm.get("description", ""))
    return skills


def categorize(name: str) -> str:
    for title, rx in CATEGORIES:
        if re.search(rx, name):
            return title
    return "Other"


def main() -> None:
    skills = collect()
    grouped: dict[str, list[tuple[str, str, str]]] = collections.defaultdict(list)
    for name, (rel, desc) in sorted(skills.items()):
        grouped[categorize(name)].append((name, rel, desc))

    order = [c[0] for c in CATEGORIES] + ["Other"]
    total = len(skills)
    lines = [
        "# 📚 Skills Catalog\n",
        f"The complete index of all **{total} skills** in this library. "
        "Every skill ships as a self-contained `SKILL.md` with spec-compliant frontmatter "
        "(`name`, `description`, `version`) and works across Claude Code, Claude.ai, and other "
        "agentic runtimes (see [`runtimes/`](../runtimes/)).\n",
        "\n> This file is generated. After adding or renaming a skill, run "
        "`python3 scripts/generate_catalog.py` to regenerate it, then "
        "`python3 scripts/validate_skills.py` to verify compliance.\n",
    ]
    for cat in order:
        items = grouped.get(cat)
        if not items:
            continue
        lines.append(f"\n## {cat}\n")
        lines.append(f"_{len(items)} skill{'s' if len(items) != 1 else ''}_\n")
        lines.append("\n| Skill | Description |\n|---|---|\n")
        for name, rel, desc in items:
            d = desc.replace("|", "\\|")
            if len(d) > 180:
                d = d[:177].rstrip() + "..."
            lines.append(f"| [`{name}`]({rel}) | {d} |\n")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write("".join(lines))
    print(f"Wrote {OUT} with {total} skills across "
          f"{sum(1 for c in order if grouped.get(c))} categories.")


if __name__ == "__main__":
    main()
