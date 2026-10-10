# ECC port report

Date: 2026-10-10. Chair: Grok. Upstream: [affaan-m/ECC](https://github.com/affaan-m/ECC) `4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2` (MIT, copyright 2026 Affaan Mustafa).

## Decision

| Move | Where | What |
| --- | --- | --- |
| Depend | `frankxai/claude-code-config` `skills/ecc-upstream`, `agents/ecc`, `rules/ecc`, `contexts/ecc`, `commands/ecc` | Vendored MIT subset. Estate overrides win. |
| Absorb | `absorbed/harness/` in this repo | Only skills re-expressed through `node scripts/absorb.mjs`. |
| Watch | This report | The rest of ECC. Not registered as taken. |
| Refuse | `free-skills/` | Verbatim copies were written, then deleted. Absorption is not registration. |

AgentShield was not run. A local regex scan ran. Two hits were read by hand and kept in the vendor pack only:

- `hookify-rules` shows `rm -rf /` as an example of a regex that is too specific.
- `tdd-workflow` says to reject `curl | sh`. That is a prohibition.

`skill-comply` was already in this library and was not overwritten.

## Not installed

Full ECC profile, plugin hook bootstrap, tmux, continuous-learning observer, Higgsfield, a second orchestrator, blanket `.env` deny, and language or healthcare skill packs.

## Live machine

The same vendor folders were copied into `~/.claude` without replacing existing hooks or skills. Deny rules cover reads and edits under `~/.ssh` and `~/.aws`, plus `ssh` and `scp` in Bash and PowerShell. Every `curl` is still allowed. Two fail-open hooks were added beside the hooks already there.
