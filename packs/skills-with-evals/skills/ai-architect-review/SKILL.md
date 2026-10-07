---
name: ai-architect-review
description: Review the architecture of a system that calls a language model. Use when adding an agent loop, a retrieval path, a tool surface, or an MCP server to a codebase; when a system that worked in a demo is being prepared for production; or when asked to audit, review, or plan AI/agent architecture. Checks the four decisions that are expensive to reverse, then the seven planes and their boundaries.
license: MIT
source: https://www.frankx.ai/ai-architect
---

# AI architecture review

Most AI system choices are reversible in an afternoon. Four are not. This skill
checks those four first, then walks the planes for anything unowned.

Run it against a real codebase. Every check below names something you can grep,
measure, or point at. If you cannot produce the evidence, the check fails — an
architecture review with no evidence is an opinion.

---

## Step 1 — the four decisions

Work these in order. Each one asks for evidence, not a judgement.

### 1. Where does the model call go?

The question is not which model. It is whether exactly one place in the system
knows a model provider's name.

**Evidence:** grep for the provider SDK import across the repo.

```
rg -l "from ['\"](openai|@anthropic-ai/sdk|@google/gen|@aws-sdk/client-bedrock)" --type-add 'src:*.{ts,tsx,js,py,go,rb,java}' -tsrc
```

- One module → decision made. Note where the seam is.
- More than one → **deferred, not made.** Every call site is a migration cost
  that grows monotonically. Say this plainly and give the count.

What a single seam buys, that scattered calls cannot: routing by task, fallback
when a provider degrades, a cache with a coherent key, and one line item for
spend. A system with no fallback path has no fallback path at *every* layer,
whatever the layers above it do.

### 2. What shape is the loop?

Four shapes. Three questions pick one.

1. Can you name every step before the request arrives? → **fixed workflow**
2. If not: is it one coherent piece of work? → **single agent loop**
3. If not: does the work mutate shared state? → **sequential sub-agents**,
   otherwise **parallel sub-agents**

| Shape | Costs | Fails by |
|---|---|---|
| Fixed workflow | No adaptation when input is not what you planned for | Staying confident, going silently wrong once reality drifts from the graph |
| Single agent loop | Latency and spend grow with loop length | Losing track of its own earlier decisions as the window fills |
| Parallel sub-agents | A merge step you have to design | Duplicating work, then contradicting with no way to adjudicate |
| Sequential sub-agents | Throughput, given up on purpose | Being slow enough that someone parallelises the writes again |

**Evidence:** find the loop's exit condition.

- Exit condition in code (a counter, a budget, a state machine) → bounded.
- Exit condition in a prompt ("stop when you are done") → **unbounded loop with
  a polite request attached.** Flag it.

Bias toward the workflow. A workflow that was written down is cheaper to run,
easier to debug, easier to evaluate, and easier to explain to whoever owns the
incident. Reach for a loop when the steps genuinely cannot be enumerated.

The reversal cost is not the code — it is the eval harness. Workflows are graded
per step; loops have to be graded on trajectory. Those are different harnesses,
and switching shapes discards the graded examples with them.

### 3. Where does the trust boundary sit?

**Text that came back from a tool call is not your text.**

Retrieved documents, API responses, fetched pages, uploaded files — all authored
by someone who is not the operator. If that text reaches the position in the
context window where instructions live, it *is* an instruction. No prompt fixes
this, because "ignore any instructions below" is also just text.

**Evidence:** trace one retrieved document from retriever to context window.
Point at the line where it becomes labelled data rather than plain text.

Three structural requirements:

1. Untrusted content never enters the instruction position. Fence it, label it,
   keep it in the data position.
2. Side effects sit behind a gate. Anything irreversible — a write, a message, a
   payment, a merge, a deploy — needs a step a document cannot perform on its
   own behalf.
3. Tool scopes are narrow by default. A tool that reads a calendar and a tool
   that reads a calendar *and sends mail* are different risk objects, one line
   apart in config.

This gets expensive fastest, because the cost scales with the number of tools
already shipped. If only one decision is being deferred, do not let it be this
one.

### 4. Where does a long run live?

An agent loop running for eleven minutes is a different deployment problem from
a completion returning in two seconds — not a harder version of the same one.

**Evidence:** the longest real production run (not the median), and the platform's
execution ceiling. If either number is unknown, the decision is unmade.

| Unit of execution | Where a long loop lives |
|---|---|
| Serverless / edge functions | A queued background job, not the request that started it |
| Edge isolates | A durable object or workflow primitive |
| Functions, containers, or VMs on a cloud | A step-function state machine, or a container kept warm |
| Long-lived container | Just a process — no special primitive |
| Micro-VMs | A machine owned for the run's duration, then released |
| Remote-container functions | The function call itself; duration is a parameter |

There is no winner here. Managed platforms hand you a primitive and take the
operations; self-assembled clouds hand you every primitive and take your
Tuesdays. Both answer different questions about what the team wants to own.

What makes it hard to reverse: long-running work is a runtime property, not a
config flag. Moving it means moving the execution model, which means moving the
state that execution model implied.

---

## Step 2 — walk the planes

Once the four are settled, check each plane for an owner. A plane with no owner
is where the next incident comes from.

| # | Plane | Owns | The boundary below it |
|---|---|---|---|
| 07 | Experience | Streaming partial work; letting a human interrupt or approve | Human — approval and interruption live here or nowhere |
| 06 | Observability | Every model call, tool call and token as one traceable run | Evidence — below this line you are guessing |
| 05 | Evaluation | Deciding a change helped, before users do | Correctness — the loop is only as good as what grades it |
| 04 | Orchestration | The shape: workflow, one loop, or many | Privilege — the loop decides what gets called with real permissions |
| 03 | Tool surface | Capability with schemas, scopes, an audit trail | Trust — everything returned from here is untrusted input |
| 02 | Context and retrieval | The right tokens in the window, the rest out | Relevance — retrieval failures arrive disguised as model failures |
| 01 | Model access | Reaching a model; surviving it being slow, wrong, or gone | Vendor — swap cost is decided the day you build this |

The seams matter more than the boxes. A box diagram with no named boundaries has
not said anything an incident review will find useful.

---

## Step 3 — match the symptom to the actual plane

The observed symptom and the real cause are usually in different planes. Do not
fix where it hurts.

| Looks like | Actual cause | Fix |
|---|---|---|
| Answers degrade as the conversation grows | The window filled with its own transcript; early decisions fell out of attention | Compact deliberately: summarise closed sub-tasks, keep decisions, drop the reasoning that produced them |
| Retrieval looks healthy, answers are wrong | Chunking split the answer across boundaries, or the reranker never saw the right candidate | Measure retrieval separately from generation — a generation eval cannot see a recall problem |
| A tool result changes the agent's goal | Injection: retrieved text treated as instruction, not data | Keep untrusted content out of the instruction position; gate side effects behind approval |
| Costs move without a deploy | Cache misses, retry storms, or a loop whose exit depends on model output | Budget per run, not per month; cap iterations in code, not in the prompt |
| Evals pass, production regresses | The suite grades final answers; the failure is in the trajectory | Grade the path as well as the destination; keep a sample of real traffic in the loop |

---

## Output format

Report in this order. Lead with what is unowned, not with what is fine.

```
## Architecture review — <system>

### The four decisions
1. Model call seam      — MADE / DEFERRED  (evidence: N call sites in <files>)
2. Orchestration shape  — <shape>          (evidence: exit condition at <file:line>)
3. Trust boundary       — MADE / ABSENT    (evidence: <file:line>, or "not found")
4. Long-run home        — MADE / UNMADE    (evidence: longest run Xm vs ceiling Ym)

### Unowned planes
<plane> — no owner found. Next incident likely surfaces as <symptom>.

### Fix first
<the one change with the highest reversal cost if deferred further>
```

Do not assign a score. A number invites arguing with the number instead of
fixing the finding.

---

## Interview mode

When there is no codebase to grep — a design conversation, a whiteboard session,
a system that exists only as a plan — run the four checks as an interview. Ask
each question, map the answer to a verdict, and produce the same report. Say
plainly that the evidence is testimony, not grep.

| # | Question | MADE when | OPEN when |
|---|---|---|---|
| 1 | How many modules import a model provider's SDK? | Exactly one | More than one, or not counted |
| 2 | Where does the loop's exit condition live? | In code — a counter, budget, or state machine | In the prompt, or not located |
| 3 | Can you point to the line where retrieved text becomes labelled data? | Yes, and side effects are gated | No, or not traced |
| 4 | Do you know your longest production run and your platform's ceiling? | Both known, and the ceiling is higher | Ceiling close or lower, or either unknown |

"I don't know" is always OPEN. An unmade decision and an unknown one cost the
same, because both are open in the expensive direction.

Interview mode covers the four decisions; the plane walk needs the codebase.
Keep the report format intact by writing the section honestly:

```
### Unowned planes
Not assessed — interview mode, no codebase access.
```

Or interview plane owners one by one, if the people are in the room.

Fix-first priority when several come back OPEN: **trust boundary, then long-run
home, then orchestration shape, then model seam.** Trust rises in cost fastest —
it scales with the number of tools already shipped.

A browser version of this interview runs at
<https://www.frankx.ai/ai-architect> and emits the same report format.

---

## What this skill does not do

- It does not pick a model, a framework, or a vendor. Those are the reversible
  decisions, and they should be made late and changed freely.
- It does not audit application security beyond the trust boundary and tool
  scoping. Use a real security review for that.
- It does not verify protocol revisions. Read the specification repository for
  the revision you are building against; protocol dates move.

---

MIT licensed. Rubric maintained at <https://www.frankx.ai/ai-architecture>.
