#!/usr/bin/env python3
"""PreToolUse hook on Bash — the deterministic hard-stop gate.

Two tiers, matched against the command string:

  DENY  — catastrophic and irreversible: force-push to main/master, recursive
          delete of / ~ or $HOME, curl|sh, permission-bypass flags, history
          rewrites pushed, secret deletion, DROP/TRUNCATE in a db shell,
          writes to the global Claude settings.
  ASK   — risky but legitimate with a human: direct push to main, reset --hard,
          clean -fd, any rm -rf, unpinned remote execution (npx -y, @latest),
          production deploys, db pushes, DELETE API calls, secret writes.

Anything else passes untouched. Malformed input passes (fail-open): this is a
deny-list gate, not an allow-list, and a hook that blocks every Bash call on a
parse error is worse than no hook.

Env:
  ESTATE_GUARD_OFF=1          disable for the session
  ESTATE_GUARD_ALLOW_FORCE=1  downgrade the force-push deny to ask (own branch work)
"""
from __future__ import annotations

import json
import os
import re
import sys

# A command position: start of line, after a separator, or inside a substitution.
# Keeps `echo "never run rm -rf /"` from tripping the gate.
CMD = r"(?:^|[;&|]\s*|\(\s*|\$\(\s*|`\s*|&&\s*|\|\|\s*)(?:sudo\s+)?"

DENY = [
    (r"git\s+push\b[^|;&]*\s(?:--force|-f|--force-with-lease)\b[^|;&]*\b(?:main|master|production)\b", "force-push to a protected branch"),
    (r"git\s+push\b[^|;&]*\b(?:main|master|production)\b[^|;&]*\s(?:--force|-f|--force-with-lease)\b", "force-push to a protected branch"),
    (r"git\s+push\b[^|;&]*--mirror", "mirror push rewrites every ref on the remote"),
    (CMD + r"rm\s+-[a-zA-Z]*r[a-zA-Z]*\s+(?:-[a-zA-Z]+\s+)*(?:/|~|\$HOME|\"\$HOME\"|\$\{HOME\}|/home/[^/\s]+|/Users/[^/\s]+)(?:/\*)?(?:\s|$|\")", "recursive delete of a root or home directory"),
    (r"\b(?:curl|wget)\b[^|]*\|\s*(?:sudo\s+)?(?:ba|z|da)?sh\b", "piping a download into a shell"),
    (r"\biwr\b[^|]*\|\s*iex\b", "piping a download into a shell"),
    (r"--dangerously-skip-permissions|--dangerously-disable-sandbox|bypassPermissions", "permission bypass"),
    (r"\bgit\s+filter-(?:branch|repo)\b", "history rewrite"),
    (r"\bgh\s+secret\s+(?:delete|remove)\b", "deleting a repository secret"),
    (r"\b(?:psql|supabase\s+db|mysql|sqlite3)\b[^|;&]*\b(?:DROP\s+(?:TABLE|DATABASE|SCHEMA)|TRUNCATE)\b", "destructive SQL"),
    (r"(?:>|>>|tee)\s*\"?(?:~|\$HOME|\$\{HOME\})/\.claude/settings\.json", "writing the global Claude settings"),
    (r"\bchmod\s+(?:-R\s+)?(?:777|a\+rwx|o\+w)\b", "world-writable permissions"),
]
ASK = [
    (r"git\s+push\b(?![^|;&]*--dry-run)[^|;&]*\s(?:origin|upstream)\s+(?:main|master|production)\b", "direct push to a protected branch"),
    (r"git\s+push\b[^|;&]*\s(?:--force|-f|--force-with-lease)\b", "force-push"),
    (r"git\s+reset\s+--hard\b", "discarding working-tree changes"),
    (r"git\s+clean\s+-[a-zA-Z]*f", "deleting untracked files"),
    (r"git\s+branch\s+-D\b|git\s+push\b[^|;&]*--delete\b", "deleting a branch"),
    (CMD + r"rm\s+-[a-zA-Z]*r", "recursive delete"),
    (r"\b(?:npx|pnpm\s+dlx|bunx)\s+(?:-y\s+)?[^\s]+@latest\b|\b(?:npx|bunx)\s+-y\s+[^\s@]+(?:\s|$)|\buvx\s+[^\s@]+(?:\s|$)|\bpipx\s+run\b", "executing an unpinned remote package"),
    (r"\bvercel\b[^|;&]*(?:--prod\b|\bpromote\b|\brollback\b|\benv\s+(?:rm|add)\b)", "production deploy or environment change"),
    (r"\bsupabase\s+(?:db\s+push|db\s+reset|migration\s+up)\b", "database migration against a project"),
    (r"\bgh\s+api\b[^|;&]*-X\s*DELETE\b|\bgh\s+(?:repo|release)\s+delete\b", "DELETE call to the GitHub API"),
    (r"\bgh\s+secret\s+set\b", "writing a repository secret"),
    (r"\b(?:resend|sendgrid|mailchimp)\b[^|;&]*\b(?:send|broadcast|campaign)\b", "sending email to people"),
]


def decision(cmd: str):
    allow_force = bool(os.environ.get("ESTATE_GUARD_ALLOW_FORCE"))
    for pat, why in DENY:
        if re.search(pat, cmd, re.I):
            if allow_force and "force-push" in why:
                return "ask", why + " (ESTATE_GUARD_ALLOW_FORCE is set)"
            return "deny", why
    for pat, why in ASK:
        if re.search(pat, cmd, re.I):
            return "ask", why
    return None, None


def main() -> None:
    if os.environ.get("ESTATE_GUARD_OFF"):
        return
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return
    if payload.get("tool_name") != "Bash":
        return
    cmd = (payload.get("tool_input") or {}).get("command") or ""
    if not isinstance(cmd, str) or not cmd.strip():
        return
    what, why = decision(cmd)
    if not what:
        return
    reason = (
        f"estate-guard: {why}. "
        + ("This is a hard stop; a human runs it, not an agent." if what == "deny" else "Confirm with the human before running this.")
    )
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": what, "permissionDecisionReason": reason}}))


if __name__ == "__main__":
    main()
