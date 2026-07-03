#!/usr/bin/env python3
"""Generate docs/CATALOG.md from the frontmatter of every SKILL.md.

Skills are deduplicated by `name` (the shortest path wins, so a top-level
skill folder is preferred over a nested one) and grouped into categories by a
simple, ordered keyword map. The frontmatter parser is shared with the
validator and understands YAML block scalars, so multi-line descriptions
resolve correctly. Files are read as UTF-8, so characters like em-dashes are
preserved instead of being mangled. Run this whenever skills change:

    python3 scripts/generate_catalog.py            # write docs/CATALOG.md
    python3 scripts/generate_catalog.py --check    # exit 1 if it would change
"""
from __future__ import annotations

import collections
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from _skillmeta import parse_frontmatter, read_text  # noqa: E402

HERE = os.path.dirname(__file__)
ROOT = os.path.normpath(os.path.join(HERE, "..", "free-skills"))
REPO = os.path.normpath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "docs", "CATALOG.md")

# Ordered (first match wins). Each entry: (category title, name-regex).
CATEGORIES = [
    ("AI Agents & Orchestration", r"agentic|swarm|hive-mind|stream-chain|model-routing|reasoningbank|memory-prune|opus-extended|sparc|pair-programming|nextjs-agent-team"),
    ("AI Frameworks, MCP & SDKs", r"^mcp|mcp-|openai-agentkit|claude-sdk|langgraph|oracle-adk|oracle-agent-spec|partner-"),
    ("Oracle & Cloud", r"oracle|^oci|^si$|ai-architecture"),
    ("Web, Frontend & Animation", r"nextjs|tailwind|^three$|framer|web-design|ui-ux|css-animations|animejs|gsap|lottie|waapi|defuddle|design-asset"),
    ("Engineering Workflow & GitHub", r"github|performance-analysis|verification-quality|hooks-automation|worker-|skill-comply|template-skill"),
    ("Content, Writing & Brand", r"brand|book|newsletter|social-media|content-strategy|creator|prompt-hub|internal-comms"),
    ("Creative & Media Production", r"suno|higgsfield|hyperframes|website-to|remotion|starlight|arcanea|acos|cacos|video-production|algorithmic-art|canvas|theme-factory|slack-gif|artifacts-builder|creator-intelligence"),
    ("Mind, Body & Philosophy", r"greek-philosopher|spartan|gym-training|health-nutrition|soulbook|frankx-daily"),
    ("Documents & Productivity", r"^pdf$|^docx$|^pptx$|^xlsx$|webapp-testing|mcp-builder|product-management"),
    ("Meta & Library", r"meta$|contribute-catalog|brand-guidelines"),
]


def collect() -> dict[str, tuple[str, str]]:
    skills: dict[str, tuple[str, str]] = {}
    for dirpath, _dirs, files in os.walk(ROOT):
        for fn in files:
            if fn.lower() != "skill.md":
                continue
            p = os.path.join(dirpath, fn)
            try:
                fm = parse_frontmatter(read_text(p))
            except UnicodeDecodeError:
                continue
            if not fm:
                continue
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


def render(skills: dict[str, tuple[str, str]]) -> str:
    grouped: dict[str, list[tuple[str, str, str]]] = collections.defaultdict(list)
    for name, (rel, desc) in sorted(skills.items()):
        grouped[categorize(name)].append((name, rel, desc))

    order = [c[0] for c in CATEGORIES] + ["Other"]
    total = len(skills)
    lines = [
        "# 📚 Skills Catalog\n",
        f"The complete index of all **{total} skills** in this library. "
        "Every skill ships as a self-contained `SKILL.md` with spec-compliant frontmatter "
        "(`name`, `description`) and works across Claude Code, Claude.ai, and other "
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
            d = " ".join(desc.split()).replace("|", "\\|")  # collapse newlines from block scalars
            if len(d) > 180:
                d = d[:177].rstrip() + "..."
            lines.append(f"| [`{name}`](../{rel}) | {d} |\n")
    return "".join(lines)


def main() -> int:
    skills = collect()
    content = render(skills)
    if "--check" in sys.argv:
        current = read_text(OUT) if os.path.exists(OUT) else ""
        if current != content:
            print("DRIFT: docs/CATALOG.md is out of date. Run scripts/generate_catalog.py.")
            return 1
        print(f"OK: docs/CATALOG.md is up to date ({len(skills)} skills).")
        return 0
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(content)
    cats = sum(1 for c in [x[0] for x in CATEGORIES] + ["Other"]
               if any(categorize(n) == c for n in skills))
    print(f"Wrote {OUT} with {len(skills)} skills across {cats} categories.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
