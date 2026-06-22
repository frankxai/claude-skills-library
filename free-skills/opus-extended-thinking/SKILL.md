---
name: opus-extended-thinking
description: Use Claude's extended/adaptive thinking for deep reasoning, complex analysis, and multi-step synthesis — both the prompt patterns that elicit deliberation and the current thinking API (adaptive thinking + the effort parameter). Use when a problem needs thorough deliberation before answering, or when configuring thinking on a Claude request.
version: 2.0.0
last_updated: 2026-06-22
external_version: "Current Claude family — Fable 5, Opus 4.8, Sonnet 4.6, Haiku 4.5 (June 2026)"
changelog: |
  - 2.0.0: Update to the current model family and the adaptive-thinking + effort API (budget_tokens is removed on current models). Patterns are model-agnostic.
  - 1.0.0: Initial skill for Opus 4.5 extended thinking patterns
---

# Extended & Adaptive Thinking

This skill covers Claude's ability to reason deeply before responding — both the **prompt patterns**
that elicit genuine deliberation (model-agnostic, below) and the **current thinking API** (how to
turn it on and tune its depth). It applies to the current Claude family: **Fable 5** (most capable),
**Opus 4.8** (default), **Sonnet 4.6**, and **Haiku 4.5**.

> Model IDs and API details move fast. This skill is dated; always confirm against
> **[platform.claude.com](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)**.

---

## How thinking works today (the API)

The modern control is **adaptive thinking** plus the **`effort`** parameter — *not* a fixed token
budget. The older `thinking: {type: "enabled", budget_tokens: N}` is **deprecated on Opus 4.6 and
removed (returns a 400) on Opus 4.7, Opus 4.8, and Fable 5** — do not use it on current models.

```python
# Current pattern (Opus 4.8 / 4.7 / 4.6, Sonnet 4.6)
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=16000,
    thinking={"type": "adaptive", "display": "summarized"},  # default display is "omitted"
    output_config={"effort": "high"},  # low | medium | high | xhigh | max
    messages=[{"role": "user", "content": "Solve this step by step..."}],
)
```

- **`effort`** controls depth and overall token spend. Use `xhigh` for coding/agentic work and a
  minimum of `high` for most intelligence-sensitive tasks; drop to `medium`/`low` for routine work.
  `max` is for the hardest, latency-insensitive cases (`max`/`xhigh` are Opus-tier + Fable 5, not Haiku).
- **`display`** defaults to `"omitted"` on Fable 5 / Opus 4.8 / 4.7 (thinking still happens and is
  billed; the text is just empty). Set `"summarized"` to surface a readable summary to users.
- **Fable 5**: thinking is **always on** — omit the `thinking` parameter entirely (an explicit
  `{type: "disabled"}` 400s), and the raw chain of thought is never returned (only summaries).
- Stream any request with a large `max_tokens` (>~16K) to avoid HTTP timeouts.

Everything below is about *eliciting* good deliberation through prompting — it works regardless of
which model or effort level you choose.

---

## Understanding deliberate reasoning

### What it is
Adaptive/extended thinking lets the model:
- Deliberate longer before producing output
- Consider multiple perspectives and approaches
- Self-critique and refine reasoning
- Handle complex multi-step problems
- Produce more thoughtful, less reactive responses

### When it engages
With adaptive thinking on, the model decides *when and how much* to think — typically when:
- Problems require multi-step reasoning
- Questions have nuance or ambiguity
- Tasks require weighing tradeoffs
- Complex analysis or synthesis is needed
- Creative work benefits from deliberation

---

## Prompt Patterns for Deep Thinking

### Pattern 1: Explicit Deliberation Request
```
Before answering, take time to:
1. Consider the problem from multiple angles
2. Identify potential pitfalls or edge cases
3. Weigh different approaches
4. Then provide your best response

Question: [Your complex question]
```

### Pattern 2: Multi-Perspective Analysis
```
I need a thorough analysis of [topic].

Please consider:
- The technical perspective
- The business/practical perspective
- The user/human perspective
- Potential risks and downsides
- Long-term implications

Take your time to reason through each before synthesizing.
```

### Pattern 3: Step-by-Step Reasoning
```
Walk me through your reasoning on this problem step by step.
Don't jump to conclusions - show your work.

Problem: [Complex problem]

For each step, explain:
- What you're considering
- Why you're making that choice
- What alternatives you rejected and why
```

### Pattern 4: Devil's Advocate
```
I'm planning to [action/decision].

Before you help me execute this:
1. Steelman the opposing view - what's the best argument against?
2. What am I potentially missing or underweighting?
3. What would make this fail?
4. Only then, if it still seems right, help me proceed.
```

### Pattern 5: Synthesis Request
```
I have [number] different sources/perspectives on [topic]:
[List them]

Please synthesize these into a coherent understanding that:
- Identifies where they agree
- Explains where they conflict and why
- Weighs the evidence/arguments
- Provides your reasoned conclusion
```

---

## Task Types That Benefit Most

### 1. Strategic Planning
```
Prompt pattern:
"Help me think through [strategic decision].
Consider: current state, desired outcome, constraints,
multiple paths, risks of each, second-order effects.
Don't rush to a recommendation - reason through thoroughly first."
```

### 2. Code Architecture Decisions
```
Prompt pattern:
"I'm deciding between [Option A] and [Option B] for [system].
Before recommending, analyze:
- Scalability implications
- Maintenance burden
- Team capability fit
- Migration complexity
- What we might regret in 2 years"
```

### 3. Creative Development
```
Prompt pattern:
"I want to create [creative work] about [theme].
Before writing, explore:
- Different narrative approaches
- Tonal variations
- Structural options
- What makes this theme resonate
Then develop the direction that feels most promising."
```

### 4. Problem Diagnosis
```
Prompt pattern:
"[System/situation] is exhibiting [problem].
Don't jump to the obvious cause.
Consider:
- What are all possible causes?
- What evidence supports/refutes each?
- What's the most likely root cause?
- What would I need to verify to be sure?"
```

### 5. Research Synthesis
```
Prompt pattern:
"Help me understand [complex topic].
I need you to:
- Break down the key concepts
- Explain how they relate
- Identify what's well-established vs debated
- Note what's commonly misunderstood
- Synthesize into a coherent mental model"
```

---

## Anti-Patterns to Avoid

### ❌ Rushing to Action
```
Bad: "Write me a function that does X"
Better: "I need a function that does X. Before coding,
        let's consider: edge cases, error handling,
        interface design, testing approach."
```

### ❌ Accepting First Answer
```
Bad: "What's the best database for my app?"
Better: "What database should I use for [specific requirements]?
        Consider multiple options, tradeoffs between them,
        and what factors should weight most heavily."
```

### ❌ Binary Thinking
```
Bad: "Should I do A or B?"
Better: "I'm choosing between A and B, but I'm open to
        alternatives I haven't considered. What's the
        best path forward given [context]?"
```

### ❌ Ignoring Uncertainty
```
Bad: "Tell me the answer to [complex question]"
Better: "Help me understand [complex question].
        Be explicit about what's certain vs uncertain,
        and what evidence supports different views."
```

---

## Extended Thinking Triggers

Use these phrases to encourage deeper deliberation:

**Analytical Triggers:**
- "Think through this carefully..."
- "Consider all angles before responding..."
- "What are the non-obvious implications?"
- "What am I likely missing?"
- "Reason through step by step..."

**Critical Triggers:**
- "What could go wrong with this approach?"
- "Steelman the opposing view..."
- "What's the strongest argument against?"
- "What assumptions am I making?"
- "Where might this reasoning break down?"

**Synthesis Triggers:**
- "How do these pieces fit together?"
- "What's the underlying pattern?"
- "Synthesize into a coherent view..."
- "What's the essence of this?"
- "How would you explain this to an expert?"

---

## Output Quality Indicators

Signs extended thinking is working well:
- Response acknowledges complexity and tradeoffs
- Multiple perspectives are genuinely considered
- Reasoning is visible, not just conclusions
- Uncertainty is explicitly addressed
- Edge cases and risks are surfaced proactively
- Recommendations are nuanced, not absolute

Signs it might need more prompting:
- Quick, surface-level response
- Only one perspective considered
- Confident without showing reasoning
- Missing obvious complexities
- Generic advice without context fit

---

## Combining with Other Patterns

### Extended Thinking + Agentic Execution
```
"First, think through the best approach to [task].
Consider alternatives and tradeoffs.
Once you have a clear plan, execute it autonomously,
but note any decision points where you chose between options."
```

### Extended Thinking + Iterative Refinement
```
"Draft an initial approach to [problem].
Then critique your own draft - what could be better?
Revise based on your critique.
Show me both the final version and key improvements you made."
```

### Extended Thinking + User Collaboration
```
"Analyze [situation] and identify the key decision points.
For each decision, explain the tradeoffs.
Before proceeding, I'll tell you my priorities,
then you can recommend the path that fits best."
```

---

## When NOT to Use Extended Thinking

Some tasks benefit from quick, direct responses:
- Simple factual questions
- Straightforward code snippets
- Clear instructions with no ambiguity
- Tasks where speed matters more than depth
- Follow-up execution after thinking is done

For these, don't add complexity. Just ask directly.

---

## Model notes (current family)

- **Fable 5** — Anthropic's most capable model for the hardest reasoning and long-horizon agentic
  work; thinking is always on. Reserve for genuinely demanding tasks (it is priced above Opus tier).
- **Opus 4.8** — the default for strong reasoning and agentic work; adaptive thinking + `effort`.
- **Sonnet 4.6** — best balance of speed and intelligence; supports adaptive thinking.
- **Haiku 4.5** — fastest/cheapest for simple, latency-sensitive tasks (no `xhigh`/`max` effort).

All current models excel at sustained reasoning chains, self-correction when given space, nuanced
"it depends" answers, and multi-factor synthesis — raise `effort` before adding prose scaffolding
when you need more rigor.

---

## Integration with FrankX System

Use extended thinking for:
- **Starlight Council decisions** - Strategic synthesis across domains
- **Architecture planning** - System design for Arcanea, FrankX projects
- **Content strategy** - Weighing positioning, audience, platform fit
- **Creative development** - Book outlines, course structures, music direction
- **Technical decisions** - Framework choices, MCP design, agent orchestration

---

*Extended thinking is about quality of cognition, not length of output. The best responses come from genuine deliberation - use these patterns to unlock that capability.*
