# Sources and provenance

Nothing from these projects is vendored. They are dependencies you install yourself. The pack's two skills and its CLI are original work.

| Project | Role | Licence | Checked | Version tested |
|---|---|---|---|---|
| [rtk-ai/rtk](https://github.com/rtk-ai/rtk) | Shell-output compression | Apache-2.0 | 2026-10-12 | 0.50.0 |
| [headroomlabs-ai/headroom](https://github.com/headroomlabs-ai/headroom) | Tool-result, log and history compression, MCP | Apache-2.0 | 2026-10-12 | 0.20.15 (latest upstream v0.40.0, untested) |
| [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | Terse output voice, memory-file compression, proxy | Apache-2.0 (3.0.0 and later) | 2026-10-12 | not installed |
| [ccusage/ccusage](https://github.com/ccusage/ccusage) | Session token and cost reporting | MIT (LICENSE file; GitHub shows "other") | 2026-10-12 | 20.0.20 |
| [mksglu/context-mode](https://github.com/mksglu/context-mode) | Sandboxed tool output (optional) | Elastic License 2.0 | 2026-10-12 | not installed |

## Ideas borrowed, with credit

- The rule that compression applies to what the model says and not to the user's prompt, and the list of cases where terse output must give way to plain prose, follow the published reasoning in caveman's `skills/caveman/SKILL.md`.
- The "one compressor per stage" stack is the pack's own framing.

## Trademark

"Caveman" is a trademark of Julius Brussee (see upstream `TRADEMARKS.md`). Apache-2.0 grants no trademark rights. This pack uses the name only to say it works with the upstream project.

## Not adopted, with reasons

- `cavemem` and `cavekit`: both frozen by their author as of August 2026. Estate memory authority stays with starlight-memory.
- `claude-mem`: overlaps starlight-memory. Read it as design reference only.
