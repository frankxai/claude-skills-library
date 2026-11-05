# Borrowed from

What this plugin learned from, measured 21 October 2026 with
`gh repo view` (stars) and `bin/harvest-license.mjs` (licence). No text has been
copied into this plugin yet. These are the first `/starlight-revenue-team:harvest` candidates; each one
goes through the licence check, a baseline eval and a credit row before any of its
text lands here.

| Repo | Stars | Licence | Verdict | What we take |
|---|---:|---|---|---|
| obra/superpowers | 302,648 | MIT | adapt with credit | verification before completion, used in every command's evidence step |
| garrytan/gstack | 137,090 | MIT | adapt with credit | post-deploy canary and the founder review questions, for `/starlight-revenue-team:ship` |
| coreyhaines31/marketingskills | 55,701 | MIT | adapt with credit | conversion, copywriting, SEO and launch skills, first harvest for `/starlight-revenue-team:piece` and `/starlight-revenue-team:demand` |
| anthropics/claude-plugins-official | 43,431 | Apache-2.0 | adapt with credit | plugin and marketplace format |
| wshobson/agents | 41,294 | MIT | adapt with credit | agent file conventions and plugin grouping |
| VoltAgent/awesome-claude-code-subagents | 25,902 | MIT | adapt with credit | a catalogue to pick single seats from, never installed wholesale |
| EveryInc/compound-engineering-plugin | 25,629 | MIT | adapt with credit | plan, work, review, compound loop behind `/starlight-revenue-team:ship` |
| zhuyansen/awesome-claude-video-skills | 764 | NOASSERTION | copy no text | the quality bar for video skills, rewritten from principles |

`gh repo view --json licenseInfo` returned no licence for every repo above, while
the licence endpoint `repos/<owner>/<repo>/license` identified seven of eight. The
harvest script uses the licence endpoint for that reason.
