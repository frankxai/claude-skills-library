# Product ladder: shapes, marketplaces, packaging

Digitally distributable means a stranger can buy, download or install it with nobody from
your side in the room, and you pay nothing per extra copy. Pick the shape by what the buyer's
job needs, not by what is easiest to make.

## 1. Product shapes

| Shape | What the buyer gets | Fits which rung | Reference bar to beat |
|---|---|---|---|
| Agent skill or skill pack | a folder their coding agent loads; procedure plus references plus evals | free, entry | the best-maintained public skill collections this month |
| MCP server or plugin | tools their agent can call; installable with one command | free, core | the official reference servers and the supplier's own free server |
| Prompt library | patterns with examples and evals, installable as a pack | free, entry | the top prompt collections buyers already use |
| Template | site, Notion, Framer, spreadsheet or document the buyer's agent can use unassisted | entry, core | the top seller in the same category on its marketplace this month |
| Boilerplate or starter | a repo with docs, tests and a deploy path | core | the most-starred starter in the same stack |
| Guide or ebook | EPUB plus PDF plus a web chapter; a free chapter as the slice | entry, core | the current bestseller on the same shelf |
| Course | self-paced, no cohort dependency, the buyer's agent can follow it | core | the two courses the buyer would otherwise take |
| Playbook | outcome-complete method with worked examples, checklists and receipts | core | the consultancy deliverable it replaces |
| Membership | the room, updates, rituals, perks | continuity | the two communities the buyer is already in |
| Cohort or all-access | time-boxed depth or everything at once | premium | the paid program the buyer would otherwise join |

Rules for every shape: one README, one call to action, a version number, an install or open
path a stranger can follow, and a gift that is a slice of it.

## 2. Marketplaces and rails

Fees, payout terms and policies change; read the current pricing and acceptable-use pages
before choosing, and record the date you read them. What is stable enough to plan on:

| Rail | Good for | Watch for |
|---|---|---|
| GitHub (public repo) | skills, MCP servers, prompt libraries, starters; the demand engine, free | not a till; pair it with a merchant of record |
| Skill and plugin directories (skills.sh leaderboard, claude-plugins.dev, LobeHub, Smithery, GitHub awesome lists) | discovery for agent-native products | install counts are the only honest metric; listings alone sell nothing |
| npm (trusted publishing) | MCP servers and CLIs | version on the registry must equal version in the repo |
| Polar | merchant of record for software, licence keys, private-repo and Discord access as benefits | acceptable-use policy prohibits marketplaces and selling "community access" as the product; a room ships as a membership perk (checked 2026-11-02) |
| Gumroad | ebooks, templates, prompt packs, courses; easiest start | software development is the largest category by revenue on one analysis of ~146,000 products (InsightRaider, vendor data, directional) |
| Whop | memberships, courses, communities with built-in community tooling | review its rules for your category before building on it |
| Lemon Squeezy or Stripe | direct checkout, tax handling varies by product | you own more of the stack and more of the compliance |
| Etsy | templates, planners, printables, art | discovery is category-driven; listing quality decides |
| Notion Marketplace | Notion templates | category and preview images decide |
| Amazon KDP | books; EPUB plus print | pair with a site chapter and a direct edition |
| Streaming and art rails | music and visuals | rights checked at generation time |

## 3. Price bands people actually see (directional, read 2026-11-03)

Vendor guides and listings cluster prompt packs at roughly 2 to 19 dollars, templates at
9 to 79, courses anywhere from tens to thousands depending on outcome and support. None of
this is your price. Your price comes from the value equation and from the band buyers chose
on your own waitlist. Until you hold that evidence, every price on your page is a guess and
the surface is a waitlist, not a checkout.

## 4. Packaging checklist by shape

**Skill or skill pack**
- SKILL.md with name and a description that says what and when, in the third person
- references loaded on demand, scripts for deterministic steps, evals beside it
- install line that works from a clean machine; validate with the repo's validator
- one README for the pack with the one call to action

**MCP server or plugin**
- one-command install; stdio and streamable HTTP; tools documented with examples
- version on the registry equals version in the repo; a doctor or health command
- licensing only through hosted HTTP plus OAuth, never by hiding code

**Template or starter**
- opens or deploys in under five minutes by a stranger following the README
- example content that is true, no lorem ipsum, no fake testimonials
- the preview images show the actual artefact

**Guide, ebook, playbook**
- a table of contents that reads as an argument, not a list of topics
- every claim maps to a source or a worked example; cut the rest
- the free chapter is a complete unit, not an introduction
- EPUB passes a checker; print and web editions share one source

**Course**
- each module ends in an artefact the learner made; the buyer's agent can follow the steps
- no cohort dependency; the room is optional and sold separately as a perk

**Membership**
- a named operator, a dated cadence, and the standard capture before launch; no room without
  all three
- perks are things that exist today, listed with what they do not include

## 5. Publish state is measured, never claimed

A product is published when a stranger can install or buy it today: a live listing, a
working install command, a registry version. Everything else is a draft, whatever the README
says. Record how you checked (the command, the URL, the date) in the brief.
