---
name: brand-voice
description: "Apply and enforce brand voice across all content creation. Manages voice attributes, tone adaptation by channel, style rules, and terminology. Use when writing content, reviewing drafts, or defining brand voice for a new project. Loads voice config from CREATOR.md or creator-memory/voice.md."
---

# Brand Voice

Write in a consistent voice — not just tone, but the specific fingerprint of how a creator communicates.

## Voice vs. Tone

**Voice** is fixed. It's the personality — what the brand always sounds like.
**Tone** is variable. It's the emotional inflection applied to the voice based on context.

A creator's voice stays consistent across channels. Tone adapts: more formal on LinkedIn, punchier on X, warmer in email.

## Voice Loading

Before writing, check for voice config in this order:
1. `CREATOR.md` — voice section (quick ref, covers 90% of cases)
2. `creator-memory/voice.md` — full documentation with examples
3. If neither exists: ask user to describe their voice, or offer to initialize

## The 5 Voice Components

A complete voice profile covers:

### 1. Voice Attributes (3-5 maximum)
Each attribute defined as:
- **We are**: what it means in practice
- **We are not**: the misinterpretation to avoid
- **Sounds like**: example sentence
- **Never sounds like**: anti-example

Example for "Cool Authority":
- **We are**: confident, precise, lets the work speak
- **We are not**: arrogant, dismissive, or name-dropping
- **Sounds like**: "[Specific result]. Here's what that teaches you about [topic]."
- **Never sounds like**: "As a top AI architect, I know better than most that..."

### 2. Audience Definition
- Who the primary audience is
- What they already know (don't over-explain)
- What they want from this creator
- How they expect to be addressed (peer, student, collaborator)

### 3. Content Pillars
3-5 core themes the creator consistently covers. Every piece of content should belong to one. Defined with topic focus, audience, and core argument.

### 4. Tone Adaptation Rules
How the voice shifts by context while staying recognizably consistent.

| Channel | Tone shift | Example |
|---------|-----------|---------|
| Long-form blog | Educational, complete, evidence-based | Full arguments, examples, conclusions |
| LinkedIn | Professional, thought-provoking, personal | First-person insight, business framing |
| X/Twitter | Direct, punchy, opinionated | Short sentences, bold claims |
| Email | Personal, warm, action-oriented | "You" framing, clear next step |
| Video | Conversational, energetic | Shorter sentences, visual language |

### 5. Terminology Rules
Preferred and avoided terms. Examples:
- "creators" not "influencers"
- "ships" not "launches" (for product releases)
- "AI music" not "generated music"
- Never: spiritual language, guru tone, lazy CTAs ("drop a comment below")

## Applying Voice to Content

When writing, run this checklist:
1. Read the voice attributes from CREATOR.md
2. Draft the opener — rewrite until it sounds like the creator
3. Check for anti-patterns (things this creator never says)
4. Verify tone matches the channel rules
5. Check terminology — any flagged words used?

**Red flags requiring revision:**
- Opener starts with "I" (usually weak, unless intentional personal story)
- More than one "!" in a piece
- "Amazing", "awesome", "incredible" (generic, not precise)
- "In today's fast-paced world..." (stock opener, never use)
- Passive voice where active works better
- Hedging: "I think", "maybe", "possibly" (unless intentional)

## Loading Voice Config

Check for voice documentation in this priority order:
1. `CREATOR.md` in the current project (hot cache — covers 90% of requests)
2. `creator-memory/voice.md` in the current project (full documentation)
3. Project `CLAUDE.md` — look for a "Brand Positioning" or "Voice" section
4. If none found: ask the user to describe their voice, or run `/creator-sprint`

See `references/voice-frameworks.md` for the full voice documentation template and attribute definition system.
