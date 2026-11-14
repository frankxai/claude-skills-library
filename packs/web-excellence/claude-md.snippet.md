## Web design gate

Website and web-design work goes through the `web-release-gate` skill first, before any UI code. It sequences the pack's skills in `.claude/skills/` and defines what done requires: audit findings and before and after screenshots at 375, 768 and 1440 px, never a self-assigned score. This repo's own `design.md` and `taste.md` outrank every skill in the pack.

A shader, canvas, glass panel, liquid-metal mark or 3D element goes through `gpu-surface` first. It decides whether the page earns one (one GPU surface per route, and the repo's taste file before any tutorial), then hands the build to `liquid-logo`, `shader-backdrop`, `liquid-glass` or `r3f-scene`. A look across the whole site is decided once in `material-system`, with the owner's approval. Finish with `node .claude/skills/gpu-surface/probe.mjs --url <route>`.

Delegate web builds to `worker-web-builder` and have `worker-visual-qa` judge them on a different model. `worker-web-steward` handles dependency upkeep.
