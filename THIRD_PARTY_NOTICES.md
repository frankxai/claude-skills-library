# Third-party and contributor notices

The root MIT license applies to everything in this repository that is an original contribution by Frank Riemer and contributors: the skills under `free-skills/`, the packs under `packs/`, the scripts, and the documentation. There are no first-party proprietary skills in this repository. Four Anthropic reference skills under `free-skills/anthropic/` (`docx`, `pdf`, `pptx`, `xlsx`) carry Anthropic's own terms in their `LICENSE.txt`, which are not MIT; read that file before redistributing them. (An earlier LICENSE file carried a trailer reserving "premium skills outside free-skills"; it was removed on 2026-10-09 because nothing it described exists here, and the non-standard text stopped GitHub from classifying the repository as MIT.) Individual skills, examples, references, or bundled assets derived from another project remain governed by their original copyright and license notices.

Do not remove nested LICENSE or attribution files. Adding a skill to this catalog does not transfer its copyright to Frank Riemer or the Claude Skills Library.

## Absorbed artifacts

Work absorbed from another project is recorded in [`ABSORBED.md`](ABSORBED.md) with its source repository,
exact commit, SPDX license, and a statement of what changed in re-expression. Each absorbed skill carries a
`PROVENANCE.json` beside it.

Absorption runs through the four gates in [`ABSORPTION.md`](ABSORPTION.md) — license, provenance, distinctness,
attestation — enforced by `node scripts/absorb.mjs`, which refuses rather than warns. Copyleft (GPL/AGPL/LGPL),
non-commercial (`-NC`), and unlicensed sources are refused for inclusion here; depend on them instead.
