#!/usr/bin/env python3
"""agent-lint — the mechanical half of the agent-file contract.

Lints agent definitions (.claude/agents/**/*.md, agents/**/*.md, *.agent.md,
*/AGENT.md) and skill files (SKILL.md) against the contract in
free-skills/agent-hygiene/references/agent-file-contract.md. Zero dependencies,
no network, no model. Installed into a repo as .claude/ci/agent-lint.py by
packs/agent-hygiene/install.sh; edit it in frankxai/claude-skills-library.

    agent-lint.py [paths...]                 lint these files or directories
    agent-lint.py --all                      walk the repo's agent and skill files
    agent-lint.py --changed [--base REF]     only files the branch touched (CI ratchet)
    agent-lint.py --strict                   warnings fail too
    agent-lint.py --json                     one JSON object per file, then a summary

Exit 1 on any error (or any warning with --strict). The summary line is
`agent-lint: N files, E errors, W warnings`. Errors are the checks a reviewer
should never have to make by hand; warnings are the checks that need a human to
confirm the file is a stub rather than a deliberate shape. Existing debt never
blocks a PR that did not touch it: --changed is what CI runs.

The checks are numbered E1..E7 and W1..W10 in the contract; the numbers here
match it so a finding can be looked up.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys

# --------------------------------------------------------------- discovery
AGENT_DIR_RE = re.compile(r"(^|/)(\.claude/agents|agents)(/|$)")
AGENT_FILE_RE = re.compile(r"(\.agent\.md|(^|/)AGENT\.md)$")
SKIP_BASENAMES = {"CLAUDE.md", "AGENTS.md", "README.md", "AGENT_STANDARDIZATION.md",
                  "PRODUCT_TEAMS.md", "GROK.md", "GEMINI.md", "CONTRIBUTING.md"}
SKIP_SUFFIXES = ("_REGISTRY.md", "-REGISTRY.md")
SKIP_DIRS = {".git", "node_modules", ".next", "dist", "build", ".replaced", "__pycache__",
             ".venv", "venv", "_staging"}


def kind_of(path: str) -> str | None:
    """'agent', 'skill', or None when the file is not in scope."""
    rel = path.replace(os.sep, "/")
    base = os.path.basename(rel)
    if base == "SKILL.md":
        return "skill"
    if not base.endswith(".md"):
        return None
    if base in SKIP_BASENAMES or base.endswith(SKIP_SUFFIXES):
        return None
    if AGENT_FILE_RE.search(rel) or AGENT_DIR_RE.search(os.path.dirname(rel) + "/"):
        return "agent"
    return None


def walk(root: str) -> list[str]:
    found = []
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fn in files:
            p = os.path.join(dirpath, fn)
            if kind_of(os.path.abspath(p)):
                found.append(p)
    return sorted(found)


def git(root: str, *args: str) -> str | None:
    try:
        out = subprocess.run(["git", "-C", root, *args], capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout if out.returncode == 0 else None


def changed_files(root: str, base: str | None) -> list[str]:
    """Files changed on this branch: committed since the merge-base plus the working tree."""
    names: set[str] = set()
    if base:
        mb = (git(root, "merge-base", base, "HEAD") or "").strip()
        diff = git(root, "diff", "--name-only", "--diff-filter=ACMR", mb or base, "HEAD") if mb or base else None
        names.update((diff or "").split())
    status = git(root, "status", "--porcelain=v1", "--untracked-files=all") or ""
    for line in status.splitlines():
        if len(line) > 3 and line[0] != "D" and line[1] != "D":
            names.add(line[3:].split(" -> ")[-1])
    out = []
    for rel in sorted(names):
        full = os.path.join(root, rel)
        if os.path.isfile(full) and kind_of(rel):
            out.append(full)
    return out


# ------------------------------------------------------------- frontmatter
FM_RE = re.compile(r"^﻿?---[ \t]*\n(.*?)\n?---[ \t]*(?:\n|$)", re.S)
KEY_RE = re.compile(r"^([A-Za-z0-9_-]+):\s*(.*)$")
BLOCK = {"|", ">", "|-", ">-", "|+", ">+"}


def parse_frontmatter(text: str) -> tuple[dict | None, str]:
    """(frontmatter, body). Handles key: value, block scalars, and YAML lists
    (both `- item` lines and `[a, b]` flow form), which is the whole subset
    agent files use. Lists come back as a comma-joined string."""
    m = FM_RE.match(text)
    if not m:
        return None, text
    lines = m.group(1).split("\n")
    fm: dict[str, str] = {}
    i = 0
    while i < len(lines):
        km = KEY_RE.match(lines[i])
        if not km:
            i += 1
            continue
        key, val = km.group(1), km.group(2).strip()
        if val in BLOCK or val == "":
            block: list[str] = []
            i += 1
            while i < len(lines) and (lines[i].strip() == "" or lines[i][:1] in " \t"):
                s = lines[i].strip()
                if s:
                    block.append(s[2:].strip() if s.startswith("- ") else s)
                i += 1
            fm[key] = (", " if val == "" else ("\n" if val.startswith("|") else " ")).join(block).strip()
            continue
        if val.startswith("[") and val.endswith("]"):
            val = ", ".join(x.strip().strip("'\"") for x in val[1:-1].split(",") if x.strip())
        fm[key] = val.strip().strip('"').strip("'")
        i += 1
    return fm, text[m.end():]


def strip_code(body: str) -> str:
    body = re.sub(r"```.*?```", "", body, flags=re.S)
    return re.sub(r"`[^`\n]*`", "", body)


# ------------------------------------------------------------------ rules
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
TIERS = {"haiku", "sonnet", "opus", "fable", "inherit"}
MODEL_OK_RE = re.compile(r"^(claude|gpt|gemini|grok|glm|minimax|deepseek|llama|qwen|mistral)[a-z0-9.-]*$", re.I)
MODEL_STALE_RE = re.compile(r"claude-3|-20(24|25)[01]\d[0-3]\d$", re.I)

# The definite tells. Word-boundaried, case-insensitive, checked outside code.
# Phrases only: single words with legitimate technical uses (harness, leverage,
# journey) are deliberately absent. Matching too much gets a linter switched off.
SLOP = [
    "delve", "dive into", "deep dive", "it's worth noting", "it is worth noting", "certainly",
    "absolutely", "in conclusion", "in summary", "navigate the landscape", "paradigm shift",
    "world-class", "best-in-class", "cutting-edge", "bleeding-edge", "seamless", "seamlessly",
    "effortless", "effortlessly", "thought leader", "synergy", "synergies", "innovative solution",
]
SLOP_RE = re.compile(r"\b(" + "|".join(re.escape(s) for s in SLOP) + r")\b", re.I)

# Arcanea canon that leaks into other brands' agent files. Proper nouns only:
# "guardian", "gate", "realm" and "sage" are ordinary English in an agent file
# (voice-guardian, quality gates), and a check that fires on them gets switched
# off. The names below mean one thing in this estate.
CANON_RE = re.compile(
    r"\b(Shinkami|Luminors?|Arcanean|Godbeasts?|Malachar|Lyssandria|Draconia|Maylinn|Aiyami|"
    r"Shadowfen|Lumenbright|Awakened One|Ten Gates|Gate of \w+)\b"
)
TRIGGER_CUE_RE = re.compile(
    r"\buse (this )?(when|for|before|after|whenever|if)\b|\bwhen (the |a |an |frank |user )|\bauto-?(invoke|fire|activate)|"
    r"\btrigger|\bsays?\b|\binvoke\b|\*\*/|\*\.\w+|\brun (this )?(before|after)\b|\bbefore (any|a|the|each)\b|\bafter (any|a|the|each)\b|/\w+-?\w*\b.*command",
    re.I,
)
TRIGGER_CUE_RE2 = re.compile(r"\b(use|load|run) (it|this)? ?(when|for|before|after|whenever)\b", re.I)
DISPATCH_RE = re.compile(r"\bAgent\(|\bTask\(|\bdispatch|\bsubagent|\bdelegate|\bfan[- ]?out|\bspawn", re.I)
HEADING_RE = re.compile(r"^#{1,6}\s+(.*)$", re.M)
BOUNDARY_HEAD = re.compile(r"anti-?pattern|does not|doesn't|do not|not do|stop condition|boundar|termination|never|hard rules|guardrail|refus|out of scope|constraints|write scope|must not|limits", re.I)
NEGATION_RE = re.compile(r"^\s*(?:[-*]|\d+\.)\s+.*\b(does not|doesn't|never|refuses?|must not|do not|don't|not allowed|no autonomous)\b", re.I | re.M)
PROCEDURE_HEAD = re.compile(r"process|procedure|pipeline|workflow|method|steps|reasoning protocol|how it works|how this works|instructions|what it does|protocol|operating|playbook|routing|sequence|flow\b", re.I)
DONE_RE = re.compile(r"\b(tests?|smoke|evals?|verif(y|ied|ication)|receipt|exit 0|evidence|quality gates?|guarantees?|acceptance|done means|definition of done|checklist|assert|scorecard|rubric|exit code|stamp|hand-?off contract|pass\/fail|passes?|fails?)\b", re.I)


def is_arcanea(path: str, name: str) -> bool:
    low = path.replace(os.sep, "/").lower()
    return "arcanea" in low or name.lower().startswith("arcanea")


def lint_file(path: str, root: str) -> dict:
    rel = os.path.relpath(path, root).replace(os.sep, "/")
    kind = kind_of(rel) or kind_of(path) or "agent"
    errors: list[str] = []
    warnings: list[str] = []
    try:
        raw = open(path, "rb").read()
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        return {"file": rel, "kind": kind, "errors": [f"E1 not valid UTF-8 ({exc})"], "warnings": []}
    if b"\r\n" in raw:
        warnings.append("W10 CRLF line endings")
        text = text.replace("\r\n", "\n")
    if not text.strip():
        return {"file": rel, "kind": kind, "errors": ["E1 file is empty"], "warnings": []}

    fm, body = parse_frontmatter(text)
    if fm is None:
        errors.append("E1 missing or malformed YAML frontmatter (the harness cannot discover this file)")
        fm = {}
    name = fm.get("name", "")
    desc = " ".join(fm.get("description", "").split())
    model = fm.get("model", "")
    tools = fm.get("tools", "")
    stem = os.path.basename(rel)[:-3]
    if stem in ("AGENT", "SKILL") or rel.endswith(".agent.md"):
        stem = os.path.basename(os.path.dirname(rel)) if stem in ("AGENT", "SKILL") else stem[:-6]

    if fm is not None and not errors:
        if not name:
            errors.append("E2 missing 'name'")
        if not desc:
            errors.append("E3 missing 'description' (the only text preloaded for routing)")

    if kind == "skill":
        if name and not NAME_RE.match(name):
            errors.append(f"E7 skill 'name' must match ^[a-z0-9][a-z0-9-]*$ (got {name!r})")
        if len(desc) > 1024:
            errors.append(f"E7 skill 'description' is {len(desc)} characters (max 1024)")
    else:
        if name and not NAME_RE.match(name):
            warnings.append(f"W1 'name' is not hyphen-case ({name!r})")
        elif name and name != stem:
            warnings.append(f"W1 'name' {name!r} differs from file/folder name {stem!r}")

    if desc:
        if len(desc) < 50:
            warnings.append(f"W2 description is {len(desc)} characters; say what it does and when it fires")
        elif kind == "agent" and not (TRIGGER_CUE_RE.search(desc) or TRIGGER_CUE_RE2.search(desc)):
            warnings.append("W2 description has no trigger cue (use when / auto-invoke / says / a file pattern)")

    if model:
        if MODEL_STALE_RE.search(model):
            errors.append(f"E5 'model' {model!r} is a dated or retired id; use a tier word (haiku, sonnet, opus, fable)")
        elif model.lower() not in TIERS and not MODEL_OK_RE.match(model):
            warnings.append(f"W3 'model' {model!r} is neither a tier word nor a model id")
    elif kind == "agent" and fm and (tools or "/.claude/agents/" in f"/{rel}"):
        # Only where the field means something: a Claude Code subagent, or a
        # file that already declares a tool allowlist. Harness-agnostic identity
        # cards (SIS agents/*.md) leave model to the router.
        warnings.append("W3 no 'model' field; name the tier and justify it in one sentence")

    if kind == "agent" and re.search(r"\b(Task|Agent)\b", tools) and not DISPATCH_RE.search(body):
        warnings.append("W4 'tools' declares Task/Agent but the body never dispatches another agent")

    prose = strip_code(body)
    slop = sorted({m.group(1).lower() for m in SLOP_RE.finditer(prose + " " + desc)})
    if slop:
        msg = f"{'E4' if kind == 'agent' else 'W-E4'} generated-prestige phrases: {', '.join(slop)}"
        (errors if kind == "agent" else warnings).append(msg)

    if kind == "agent" and fm:
        heads = [h.strip() for h in HEADING_RE.findall(body)]
        if not any(BOUNDARY_HEAD.search(h) for h in heads) and len(NEGATION_RE.findall(prose)) < 3:
            warnings.append("W5 no boundary section (anti-patterns / stop conditions / what it does NOT do) and fewer than 3 negation lines")
        if not any(PROCEDURE_HEAD.search(h) for h in heads):
            warnings.append("W6 no procedure section (process / procedure / pipeline / method / steps)")
        if not DONE_RE.search(prose):
            warnings.append("W7 no done cue (test, smoke, eval, verify, receipt, exit 0, evidence, quality gate)")
        if not is_arcanea(rel, name):
            canon = sorted({m.group(1) for m in CANON_RE.finditer(prose)})
            if canon:
                warnings.append(f"W8 Arcanea canon vocabulary outside an Arcanea repo: {', '.join(canon[:6])}")

    lines = body.count("\n") + 1
    if kind == "agent":
        if lines > 800:
            errors.append(f"E6 body is {lines} lines (ceiling 800); split scope or move teaching to a skill")
        elif lines > 400:
            warnings.append(f"W9 body is {lines} lines (target 150 to 400)")
    elif lines > 500:
        warnings.append(f"W9 skill body is {lines} lines (>500); push depth into references/")

    return {"file": rel, "kind": kind, "errors": errors, "warnings": warnings}


# ------------------------------------------------------------------- main
def main(argv: list[str]) -> int:
    strict = "--strict" in argv
    as_json = "--json" in argv
    use_changed = "--changed" in argv
    use_all = "--all" in argv
    base = None
    if "--base" in argv:
        i = argv.index("--base")
        base = argv[i + 1] if i + 1 < len(argv) else None
    positional = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] != "--base")]

    root = (git(os.getcwd(), "rev-parse", "--show-toplevel") or os.getcwd()).strip()

    files: list[str] = []
    if use_changed:
        files = changed_files(root, base)
    elif positional:
        for raw in positional:
            p = raw if os.path.isabs(raw) else os.path.join(os.getcwd(), raw)
            if os.path.isdir(p):
                files += walk(p)
            elif os.path.isfile(p):
                files.append(p)
            else:
                print(f"agent-lint: no such path: {raw}", file=sys.stderr)
                return 2
    else:
        # Default and --all: the conventional roots, not the whole tree, so a
        # vendored node_modules or a docs folder full of examples is never linted.
        for sub in (".claude/agents", "agents", ".claude/skills", "skills", "free-skills", "packs"):
            p = os.path.join(root, sub)
            if os.path.isdir(p):
                files += walk(p)

    seen, uniq = set(), []
    for f in files:
        rf = os.path.realpath(f)
        if rf not in seen:
            seen.add(rf)
            uniq.append(f)

    results = [lint_file(f, root) for f in uniq]
    n_err = sum(len(r["errors"]) for r in results)
    n_warn = sum(len(r["warnings"]) for r in results)

    if as_json:
        for r in results:
            print(json.dumps(r))
    else:
        for r in results:
            if not r["errors"] and not r["warnings"]:
                continue
            print(f"{r['file']}")
            for e in r["errors"]:
                print(f"  ERROR {e}")
            for w in r["warnings"]:
                print(f"  warn  {w}")
    print(f"agent-lint: {len(results)} files, {n_err} errors, {n_warn} warnings"
          + (" (strict)" if strict else "") + (" [changed only]" if use_changed else ""))
    return 1 if n_err or (strict and n_warn) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
