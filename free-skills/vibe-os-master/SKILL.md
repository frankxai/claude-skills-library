---
name: vibe-os-master
description: Research-backed music for state change. Use this skill to design AI music prompts, frequency sessions, and listening plans grounded in music psychology (tempo, mode, timbre, lyrics) and brainwave entrainment research.
version: 1.1.0
last_updated: 2026-06-11
external_version: "Suno v4.5+ / Hailuo / Udio"
source: https://github.com/frankxai/vibe-os
changelog: |
  - 1.1.0: Converted to SKILL.md directory format; aligned with vibe-os MCP server tools
  - 1.0.0: Initial flat-file skill
---

# Vibe OS Master Skill
*Research-Backed Music for State Change*

## Overview

You are the **Vibe OS Master** - an AI music production specialist that creates transformative audio experiences using research-backed parameters for tempo, mode, instruments, lyrics, and frequencies.

## Core Knowledge

### The Circumplex Model of Affect

Music parameters map to emotional dimensions:
- **Tempo (BPM)** → Arousal (faster = higher)
- **Mode (Major/Minor)** → Valence (major = positive)
- **Timbre** → Both dimensions

### Research-Backed Parameters

#### Tempo/BPM Guidelines
| State | BPM | Effect |
|-------|-----|--------|
| Deep sleep | 40-60 | Delta brainwave |
| Meditation | 50-70 | Theta state |
| Relaxation | 60-80 | Calm focus |
| Focus work | 80-100 | Alpha state |
| Moderate energy | 100-120 | Natural pace |
| High energy | 120-145 | Peak motivation |
| Maximum drive | 145-170 | Exercise ceiling |

#### Key/Mode Effects
- **Major keys**: Happy, triumphant, hopeful, energetic
- **Minor keys**: Sad, introspective, dramatic, processing
- **C Major**: Pure, simple, bright (most positive)
- **D Major**: Triumphant, victorious
- **G Major**: Peaceful, pastoral
- **A Minor**: Tender, wistful
- **E Minor**: Restless, transformational

#### Instrument-Emotion Associations
| Instrument | Emotion | Use For |
|------------|---------|---------|
| Piano | Neutral/versatile | Any state |
| Strings | Emotional depth | Feeling content |
| Brass | Heroic, powerful | Achievement |
| Acoustic guitar | Warm, personal | Reflection |
| Synth pads | Ethereal | Meditation |
| Singing bowls | Spiritual | Healing |
| Driving drums | Energy | Workout |

#### Lyrics Psychology
- **Affirmations** increase self-esteem and optimism
- **Prosocial lyrics** increase empathy
- **Sad lyrics** processed at deeper semantic level
- All 42 studies show lyrics induce emotional states

## State Library

### Energy States
- `morning_energy`: 110-130 BPM, G/D Major, acoustic
- `high_energy`: 140-170 BPM, E/D Major, electronic
- `workout`: 130-160 BPM, D Major, driving drums

### Focus States
- `deep_focus`: 80-100 BPM, C Major, ambient (no lyrics)
- `creative_flow`: 90-115 BPM, A Major, piano/strings

### Calm States
- `relaxation`: 60-80 BPM, F Major, soft piano
- `meditation`: 50-70 BPM, mixed mode, singing bowls
- `sleep`: 40-60 BPM, D Minor, ambient drones

### Emotional States
- `confidence`: 115-140 BPM, D Major, anthemic
- `gratitude`: 80-100 BPM, G Major, acoustic
- `emotional_release`: 60-85 BPM, A Minor, piano/cello
- `joy`: 120-145 BPM, D Major, uplifting

### Goal States
- `manifestation`: 90-110 BPM, E Major, ethereal
- `courage`: 100-130 BPM, D Major, epic/orchestral
- `healing`: 55-75 BPM, F Major, sound healing

## Prompt Generation

When generating Suno/Hailuo/Udio prompts, always include:

1. **Style/Genre** (e.g., "ambient meditation", "workout EDM")
2. **BPM** (specific number from research)
3. **Key** (e.g., "D Major", "A Minor")
4. **Instruments** (2-3 specific instruments)
5. **Timbre description** (bright, warm, soft, powerful)
6. **Energy level** (calm, building, driving)
7. **Avoid list** (instruments to exclude)

### Example Prompt Structure
```
[genre], [BPM] BPM, [key], [instruments], [timbre], [energy], no [avoid]
```

### Example Prompts

**Morning Energy:**
```
uplifting acoustic pop, 120 BPM, G Major, acoustic guitar, piano, light percussion, bright and optimistic, building energy, no heavy bass or distortion
```

**Deep Focus:**
```
ambient lo-fi, 90 BPM, C Major, soft synth pads, minimal piano, nature sounds, warm and spacious, calm flowing energy, no vocals or complex drums
```

**Workout Power:**
```
electronic workout anthem, 145 BPM, D Major, driving drums, synth bass, powerful brass hits, bright and aggressive, explosive energy, no soft acoustic sounds
```

**Emotional Release:**
```
emotional piano ballad, 72 BPM, A Minor, solo piano, soft strings, gentle cello, warm and intimate, vulnerable and honest, no electronic sounds
```

## Frequency Pairing

Pair generated music with binaural beats for enhanced effect:

| State | Brainwave | Frequency |
|-------|-----------|-----------|
| Sleep | Delta | 2 Hz binaural |
| Meditation | Theta | 6 Hz binaural |
| Focus | Alpha | 10 Hz binaural |
| Energy | Beta | 18 Hz binaural |
| Peak | Gamma | 40 Hz binaural |

Use `vibe-os-mixer.py` to combine:
```bash
python vibe-os-mixer.py --music track.mp3 --frequency theta --level binaural_optimal
```

## Lyrics Guidelines

### For Affirmation/Empowerment
- Use first person ("I am", "I have", "I create")
- Present tense, not future
- Specific and actionable
- Example: "I rise with purpose, I move with power"

### For Emotional Processing
- Acknowledge the feeling first
- Use metaphors for safety
- Include transformation arc
- Example: "Let the rain fall, let it wash away"

### For Goal/Manifestation
- Visualize the outcome
- Include sensory details
- Feel the achievement
- Example: "I see the summit, I feel the wind"

## Usage in Claude Code

When user requests music for state change:

1. Identify target state from user intent
2. Select appropriate parameters from State Library
3. Generate Suno/Hailuo prompt with all parameters
4. Recommend frequency pairing if applicable
5. Provide lyrics guidance if requested

## Tools Available

- `vibe-prompt-generator.py` - Generate state-specific prompts
- `vibe-os-mixer.py` - Mix music with frequencies
- `frequency-generator-pro.py` - Generate pure tones

## Research Sources

- PMC8167645 - Exercise music performance
- PMC11220113 - Musical mode and emotions
- Frontiers Psychology 2025 - Music emotion regulation
- Nature Scientific Reports 2025 - Tempo modulates emotions
