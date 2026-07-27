#!/usr/bin/env python3
"""SessionStart hook — tell the agent the web-excellence pack exists.

Claude Code discovers skills from their frontmatter descriptions, which is
enough for a skill to be *available* but not enough to guarantee the sequencing
is followed. This injects the one paragraph that makes the gate the default,
and names the repo's own design contracts so they outrank the pack.

Cheap and silent: no network, no repo scan beyond a few stat() calls.
"""
import json
import os
import sys

PACK_SKILLS = [
    "web-release-gate",
    "web-design-guidelines",
    "ui-ux-pro-max",
    "emil-design-eng",
    "apple-design",
    "review-animations",
    "improve-animations",
    "find-animation-opportunities",
    "animation-vocabulary",
    "core-web-vitals",
    "visual-proof",
    "image-to-code",
    "extract-design-system",
    "brandkit",
]

# Repo-level design contracts, in precedence order. These beat the pack.
CONTRACTS = [
    "design.md",
    "taste.md",
    "tailwind.config.js",
    "tailwind.config.ts",
    "lib/design-system.ts",
    "app/globals.css",
]


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}
    cwd = payload.get("cwd") or os.getcwd()

    skills_dir = os.path.join(cwd, ".claude", "skills")
    present = [s for s in PACK_SKILLS if os.path.isdir(os.path.join(skills_dir, s))]
    if not present:
        # Pack not installed here — stay quiet rather than advertising nothing.
        return 0

    contracts = [c for c in CONTRACTS if os.path.exists(os.path.join(cwd, c))]

    lines = [
        "WEB EXCELLENCE PACK is installed in this repo.",
        "",
        "Any task that changes what a web surface looks like, feels like, moves like, "
        "or how it is interacted with goes through the `web-release-gate` skill FIRST — "
        "read it before writing UI code, not after. It sequences the rest of the pack "
        "and defines what \"done\" requires (audit output + screenshots, never a "
        "self-assigned score).",
        "",
        "Installed: " + ", ".join(present) + ".",
    ]
    if contracts:
        lines += [
            "",
            "This repo's own design contracts OUTRANK every skill in the pack: "
            + ", ".join(contracts)
            + ". The pack supplies craft; the repo supplies the brand. On conflict, the repo wins.",
        ]
    lines += [
        "",
        "Non-negotiable before calling any UI change complete: run `web-design-guidelines` "
        "on the changed files, honor prefers-reduced-motion, keep keyboard focus visible, "
        "and verify 375 / 768 / 1440. If you could not verify something, say so — do not "
        "describe a page you never rendered.",
    ]

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": "\n".join(lines),
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
