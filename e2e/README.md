# Production e2e for the Cloudflare agent fleet

Four commands, all verified against the live estate on 2026-11-07.

```text
node --test e2e/demand-capture.e2e.test.mjs
node e2e/fleet-e2e.mjs --md-out C:/Users/frank/starlight/queen/reports/fleet-e2e-<date>.md
node e2e/fix-signal-merge.mjs --verify
node e2e/fix-migrations.mjs              # dry run; --apply needs a control-plane lane
```

## What each one proves

`demand-capture.e2e.test.mjs` drives the **real, unmodified** production sources
`packages/demand-capture/src/handler.ts`, `store.ts` and `report.mjs`. A local HTTP
server speaks the small Redis-REST subset those files use (`hget`, `hset`, `hgetall`,
`incr`, `get`), so no KV credentials and no network leave the machine. It proves a
join writes a `DemandSignal`, `report.mjs` reads the price band back, a repeat
submission does not double-count, invalid email and missing consent are refused,
two different price bands rank correctly, and a KV outage is an honest error.
Result: **6 pass, 0 fail, 0 skipped**.

`fleet-e2e.mjs` calls the **deployed** endpoints. All five Workers answer health,
`initialize`, `tools/list` and a real `tools/call`. A tool call only passes when the
response carries a `result` payload, never when it is a JSON-RPC error. The gateway
proves its metrics are internally derived (`free + gated === toolCount === tools/list
length`), its free-tool path, its `401 -32001` licence refusal, `202` empty
notifications, `404 -32601` unknown methods and `400 -32700` malformed JSON. The
branded portal serves its HTML to a browser Accept header and keeps its OAuth gate.
Result: **29/29 hard checks pass, verdict FLEET E2E PASS**.

The receipt also carries `productionReadiness: HOLD` with a reason. Exit 0 means the
deployed fleet answered every hard check. It does not mean the estate is ready to
sell. Seven known gaps are printed with an owner and a severity; three are P0.

`fix-signal-merge.mjs` proves the P1 fix found by the funnel test. `--verify` stages
the patched `store.ts` in a temp ESM dir, runs two submissions for one email against
a local KV, and asserts the step-1 answers survive step 2. Result: **VERIFY PASS**.
`--apply` is refused from this worktree because `packages/demand-capture/` is in the
estate control plane and `verify-lane.mjs` blocks the write.

`fix-migrations.mjs` reports the five `wrangler.toml` files still carrying the
`[[migrations]]` stanza that wrangler 4.158.0 rejects. The stanza removal is
line-based and LF/CRLF safe. Dry run writes nothing.

## Browser check (BrowserOS neo, 2026-11-07)

A real browser rendered `https://mcp.starlightintelligence.ai/` and
`https://frankx.ai/waitlist` (which redirects to `www.frankx.ai/waitlist`). Both pages
had zero console errors or warnings. The waitlist form's two textboxes and Join
button accepted focus and a fill without submitting anything. Screenshots inspected:
the portal is a clean Cloudflare-default page, the waitlist is a dark branded page
with a working form card. Neither was changed. This is a rendering and interaction
check, not a mobile-device or reduced-motion audit.

## P1 finding, proven fixable

`saveSignal` in `packages/demand-capture/src/store.ts` does an `hset` keyed by
email. A repeat submission replaces the whole row, so earlier answers (`urgency`,
`pain`, `role`, `priceBand`) are lost. The two-step doctrine (TRUTH.md 5c.4) says
step 1 is email alone and step 2 adds the answers later; overwriting breaks it.

The fix in `fix-signal-merge.mjs` reads the existing row, overlays only the fields
the new submission actually supplied, and writes the merged signal. `--verify`
proves it. Apply from a control-plane lane, then re-run the funnel suite.

## Known gaps (owner and severity in the receipt)

- P0, three dead doors: `starlightintelligence.ai/signal` (404), `/api/waitlist`
  (404), `realityarchitect.ai/waitlist` (308). Point at the working waitlist.
- P1, bespoke live door: `frankx.ai/waitlist` has no `productId`, consent control or
  price question and does not write a `DemandSignal` (TRUTH.md 5c.3).
- P1, five `[[migrations]]` configs. See `fix-migrations.mjs`.
- P1, `sentinel/` has no `package.json` and is absent from `directory.json` and
  `BUNDLE_ACCESS`, so `test/family-contract.mjs` reports 1 failure.
- P1, the `saveSignal` overwrite above. See `fix-signal-merge.mjs`.
