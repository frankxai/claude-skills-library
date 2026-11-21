## GPU surfaces

A shader, canvas, glass panel, liquid-metal mark or 3D element goes through `gpu-surface` first. It decides whether the page earns one (one GPU surface per route, and the repo's taste file before any tutorial), then hands the build to `liquid-logo`, `shader-backdrop`, `liquid-glass` or `r3f-scene`. A look across the whole site is decided once in `material-system`, with the owner's approval. Finish with `node .claude/skills/gpu-surface/probe.mjs --url <route>`.

Delegate web builds to `worker-web-builder` and have `worker-visual-qa` judge them on a different model. `worker-web-steward` handles dependency upkeep.
