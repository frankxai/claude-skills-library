# Expansion map

This catalog is the public storefront. It should grow like an awesome list that also ships installable skills, not like a second product.

## Lanes

| Lane | Repo | Job |
|---|---|---|
| Full catalog | `frankxai/claude-skills-library` | Every validated `SKILL.md`, runtime adapters, catalog generator |
| Architect cut | `frankxai/skills` | MCP, orchestration, routing, evals. `npx skills add frankxai/skills` |
| Creator cut | `frankxai/creator-skills` | Video, music, image, brand voice |
| Substrate | `frankxai/Starlight-Intelligence-System` | Memory, attestation, governance |
| Portable packs | `frankxai/starlight-agent-skills` | Domain packs that consume the substrate |
| Index | `frankxai/awesome-agent-operating-systems` | Curated outside list, not a skills dump |

## Next public gaps

1. Mark the nine draft skills-library PRs ready or close them. The frontmatter repair (`#39`) and broken-link repair (`#30`) should land before new skills.
2. Publish the eval harness the README already promises, or delete the promise. A catalog that claims proof and ships none trains the wrong expectation.
3. Add this mark to the README header and to the GitHub social preview. Keep the hero banner for the wide slot.
4. Mirror the category table into `awesome-agent-operating-systems` as one row, not a copied catalog.

## Merge rule used here

Docs, tests, CI, and same-major patch bumps merge when required checks are green. Drafts, contract changes, auth, payments, and major-version groups wait. Squash. Pin the head SHA. Do not push `main` directly.
