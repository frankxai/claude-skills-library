#!/usr/bin/env python3
"""Stop hook — do not let a UI change end unaudited.

This is the closing half of the loop. The PreToolUse gate recorded which UI
files were touched; this checks, at the moment the turn would end, whether the
audit actually happened. If it did not, it blocks the stop once and says what is
missing. The agent then runs the audit and stops again — the second stop is
always allowed.

Blocks AT MOST ONCE per session, guarded three ways (`stop_hook_active`, a
persisted flag, and an explicit opt-out). A hook that can loop is worse than no
hook.

Opt out entirely with WEB_GATE_NO_STOP=1.
"""
import json
import os
import re
import sys
import tempfile

# Evidence that the audit actually RAN.
#
# These markers must be things only a real run produces. Matching on the skill
# *name* does not work: the PreToolUse reminder names the skills it is asking
# for, that text lands in the transcript via additionalContext, and the check
# then passes on the strength of our own nagging. That bug shipped in the first
# version of this hook and made the whole loop a no-op — see
# tests/test_hooks.py::test_reminder_cannot_satisfy_evidence, which exists to
# stop it coming back.
#
# So: match the guidelines URL (present only once WebFetch has pulled it) and
# the runner's own output, never a skill name.
EVIDENCE = (
    "web-interface-guidelines/main/command.md",
    "raw.githubusercontent.com/vercel-labs/web-interface-guidelines",
)
VISUAL_EVIDENCE = (
    ".visual-proof/",          # the output directory capture.mjs writes into
    "shot(s) for",             # capture.mjs success line
    "cannot capture:",         # capture.mjs honest-failure line — reporting counts
)


def state_path(session_id: str) -> str:
    # session_id comes from the harness; sanitize before it becomes a filename.
    safe = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[:64] or "nosession"
    return os.path.join(tempfile.gettempdir(), f"web-gate-{safe}.json")


def transcript_mentions(path: str, needles) -> bool:
    if not path or not os.path.exists(path):
        return False
    try:
        # Transcripts get long; only the tail matters for "did it run".
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            blob = fh.read()[-2_000_000:]
    except OSError:
        return False
    low = blob.lower()
    return any(n in low for n in needles)


def main() -> int:
    if os.environ.get("WEB_GATE_NO_STOP") == "1":
        return 0
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    # Already continued once because of a stop hook — never chain.
    if payload.get("stop_hook_active"):
        return 0

    session_id = payload.get("session_id", "")
    sp = state_path(session_id)
    if not os.path.exists(sp):
        return 0
    try:
        state = json.load(open(sp))
    except Exception:
        return 0

    touched = state.get("touched") or []
    if not touched or state.get("blocked"):
        return 0

    transcript = payload.get("transcript_path", "")
    audited = transcript_mentions(transcript, EVIDENCE)
    proved = transcript_mentions(transcript, VISUAL_EVIDENCE)
    if audited:
        return 0

    state["blocked"] = True
    try:
        fd = os.open(sp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as fh:
            json.dump(state, fh)
    except OSError:
        pass

    shown = touched[:8]
    more = f" (+{len(touched) - 8} more)" if len(touched) > 8 else ""
    missing = ["`web-design-guidelines` audit on the changed files"]
    if not proved:
        missing.append("`visual-proof` capture at 375 / 768 / 1440 (or an explicit statement that capture was impossible here, and why)")

    reason = (
        "web-release-gate: this turn changed UI files but the gate did not close.\n\n"
        f"Touched: {', '.join(shown)}{more}\n\n"
        "Still missing:\n"
        + "\n".join(f"  - {m}" for m in missing)
        + "\n\nRun what is missing now, then report the receipt:\n"
        "  Audit:  N findings, N fixed, N waived (with reason)\n"
        "  Visual: before/after at 375/768/1440, light+dark — or why not captured\n\n"
        "If the change is genuinely not visual (a fetch call, a type, a copy fix), say that "
        "in one line and stop. This check fires once per session and will not fire again."
    )

    print(json.dumps({"decision": "block", "reason": reason}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
