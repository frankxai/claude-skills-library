---
name: firecrawl-alexandria
description: Retrieves typed, sourced records from Firecrawl Alexandria, a catalogue of paid data providers (company firmographics and funding, financial statements and filings, people, package registries, app stores, government spending, real estate, podcasts, YC profiles and more), through a discover, inspect, execute loop that reports the credit cost of every call. Use when the ask is structured data about an entity rather than reading a page, when the user mentions Alexandria, Firecrawl data providers, firecrawl find-tools, or provider capabilities, or when building an SDK or HTTP integration against api.firecrawl.dev v2 search and scrape with an alexandria body.
---

# Firecrawl Alexandria

Alexandria puts third-party data providers behind one Firecrawl key. Each provider publishes
capabilities with a contract (inputs, response shape) and a credit price. Discovery is free;
execution charges the listed price. This skill is the loop that keeps those charges deliberate.

## When to use this

Use it when the answer is a record, not a page: a company's funding and headcount, a ticker's
segments, a package's dependents, an app's ratings, a federal award, a YC founder list. Discovery
costs nothing, so check Alexandria whenever the ask is "data about X".

Do not use it to read a web page (built-in `WebFetch`, or `firecrawl_scrape` with `url` only when
a page blocks normal fetches), for general web search (`WebSearch`), for library docs (Context7),
or for code, papers, and law — those are separate Firecrawl indexes
(`firecrawl_developer_search`, `firecrawl_research_*`, `firecrawl_gov_search`), not Alexandria.

## Three rules

1. **Discover before you retrieve.** No execution without a discovery result in the same task.
2. **Call only what discovery returned.** Provider, capability, and option names come from the
   contract. Never guess an address or an option from memory.
3. **Report every call's cost.** Read `creditsCost` from each result and tell the user, including
   the free ones. Prices come from discovery at call time; never quote a price from memory.

## Connections, in order of preference

| Surface | Discover | Inspect | Execute |
|---|---|---|---|
| MCP (already connected? use it) | `firecrawl_search` with `sources: ["alexandria"]` | `firecrawl_find_tools` | `firecrawl_scrape` with an `alexandria` body |
| CLI (`npm install -g firecrawl-cli`, then `firecrawl login`) | `firecrawl search "<need>" --sources alexandria` | `firecrawl find-tools --providers <id> --level tools --expand options,response` | `firecrawl scrape <provider>/<capability> --options '<json>'` |
| SDK / HTTP | `POST /v2/search` | `findTools` / `find_tools` | `POST /v2/scrape` |

Prefer an existing MCP or CLI connection over installing anything. The key lives in
`FIRECRAWL_API_KEY`; never write it into code, config, or a commit.

## The loop

1. **Discover.** Search Alexandria only, so the call stays free:
   `firecrawl_search { query: "<what you are trying to do>", sources: ["alexandria"], toolDetail: "summary" }`.
   Each hit carries `provider`, `capability`, `creditsCost`, `perRecord`, a description saying
   when to use it, and a `next` request for its full contract. Adding `"web"` to `sources`
   bills the web results.
2. **Choose.** Pick the cheapest capability whose description fits the identifier you hold.
   Descriptions say which input each provider resolves best (a domain beats a bare name for
   enrichment). Check for a 0-credit directory or list capability that resolves identifiers
   before a priced lookup. When `perRecord` is true the price multiplies by records returned,
   so set the page size or limit before calling.
3. **Inspect.** Call `firecrawl_find_tools` with the exact `next` arguments discovery returned:
   `{ level: "tools", providers: ["<provider>"], capabilities: ["<capability>"], expand: [...] }`.
   The capability ID goes without its provider prefix, alongside a `providers` selector. Passing
   `"provider/capability"` alone returns `invalid_option` (400). Read `options` (required fields,
   patterns) and `response` (where the records sit, whether it paginates).
4. **Execute.** `firecrawl_scrape { alexandria: { provider, capability, options } }` with options
   exactly as the contract names them. A batch takes up to 10 capabilities as an array.
5. **Check and report.** Each entry in `data.alexandria[]` carries its own `creditsCost` and may
   carry an `error` even when the outer call succeeded. Use only entries without errors. Close
   with a cost line per call.

## Provider terms

Some providers need their terms accepted by an org admin before first use. The error is
`THIRD_PARTY_DATA_TERMS_REQUIRED` with an action URL. It refuses the whole request before
anything runs, so one gated provider in a batch blocks every capability in that batch.

- Fetch the agreement on its own call, never inside a provider batch:
  `firecrawl_scrape { alexandria: { provider: "firecrawl", capability: "terms/show", options: { provider: "<id>" } } }`.
  It is free and returns the document, version, and acceptance status.
- Show the user the terms and the dashboard link (`https://www.firecrawl.dev/app/alexandria/<provider>`,
  or `https://www.firecrawl.dev/app/settings?tab=data-sources`). Acceptance happens there, by an
  admin. Never accept on the user's behalf and never infer acceptance from a request to fetch data.
- After the user confirms acceptance, retry with the identical payload and the `requestId` the error
  gave. If the same error returns, stop.
- Run ungated providers separately so a gated one does not block them.

## Failure handling

- **402**: the account is out of credits. Tell the user; do not retry.
- **Per-entry `error`**: report which capability failed and why; do not substitute an undiscovered one.
- **Empty records**: say so. An empty result is an answer, not a reason to try a pricier provider
  without asking.

## Cost report

End any task that touched Alexandria with one line per call:

```text
discover  firecrawl_search (alexandria)                    0 credits
inspect   firecrawl_find_tools ycombinator-com             0 credits
execute   ycombinator-com/companies/company slug=acme      <creditsCost from the result>
total                                                      <sum>
```

## SDK and HTTP

Discover (free with Alexandria-only sources):

```bash
curl https://api.firecrawl.dev/v2/search \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "<what you are trying to do>", "sources": ["alexandria"]}'
```

Execute (billed at the capability's price). Send an `x-request-id` so a retry is idempotent:

```bash
curl https://api.firecrawl.dev/v2/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-request-id: $(uuidgen)" \
  -d '{"alexandria": {"provider": "<provider>", "capability": "<capability>", "options": {}}}'
```

With the Firecrawl SDK (`@mendable/firecrawl-js`, `firecrawl-py`):

```js
const found = await firecrawl.search("<need>", { sources: ["alexandria"] });
const contract = await firecrawl.findTools({ providers: ["<provider>"] });
const result = await firecrawl.scrape({
  alexandria: { provider: "<provider>", capability: "<capability>", options: { /* per contract */ } },
});
const entry = result.alexandria[0];
if (entry.error) throw new Error(`${entry.provider}/${entry.capability}: ${entry.error.message}`);
console.log(entry.creditsCost, entry.data);
```

A raw HTTP response wraps the SDK result in `data`. The `next` object on any discovery item is
itself a valid `alexandria` body, so `firecrawl.scrape({ alexandria: item.next })` walks the catalogue.

## Feedback

Firecrawl accepts feedback on a provider within 20 minutes of the team's last Alexandria call
(`firecrawl alexandria feedback`). Send it when a contract was wrong or a record was bad, not by
default.

Docs: https://docs.firecrawl.dev/features/alexandria
