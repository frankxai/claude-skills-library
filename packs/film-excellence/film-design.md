# film-design.md — the machine-readable film contract

> The film equivalent of `design.md`. This is the **template**; each film copies
> it and fills it. Tokens live here; judgment lives in `film-taste.md`.
> A film's own filled copy outranks this template and outranks every skill.

Same operating shape the web work already uses: `design.md` carries tokens,
`taste.md` carries refusals, a release gate sequences the specialists and
defines "done." Nobody has to learn a new contract — only a new medium.

---

```yaml
film:
  title: <string>
  runtime_target: <mm:ss>          # HGFF: min 3:00, recommended ≤5:00 — verify on the live rules page
  aspect: <2.39:1 | 1.85:1 | 16:9 | 4:3 | 1:1>
  frame_rate: <24 | 25>            # 24 unless there is a reason
  track: <series-episode | synopsis | freeform>

formal_rule:                        # Doctrine Law 1 — exactly one, stated in one sentence
  camera: <string>
  color: <string>
  sound: <string>
  where_it_hurt: [<shot id>, <shot id>]   # filled during production; two minimum

palette:
  base: [<hex>, <hex>, <hex>]       # ≤3. The film lives here.
  accent: <hex>
  forbidden_color:                  # optional, extremely strong when used
    hex: <hex>
    total_screen_time: <seconds>
    appears_at: [<timecode>]
  grade_notes: <string>             # never teal/orange, never the purple-cyan default

lens:
  primary: <mm>                     # one focal length carries the film
  secondary: <mm>
  rules:
    - <e.g. "no lens above 85mm before the turn">
  depth_of_field: <string>

light:
  key_quality: <hard | soft | mixed>
  sources_in_world: [<practical>, <practical>]   # name real sources; motivated light reads as real
  direction_law: <string>

texture:
  grain: <string>
  imperfections:                    # Doctrine Law 5 — three minimum
    - shot: <id>
      what: <string>
  hands:                            # three deliberate hand shots
    - shot: <id>
      task: <string>

sound:
  bed:
    - location: <string>
      description: <string>
  foley_priority: [<action>, <action>, <action>]
  music:
    in_point: <timecode>
    out_point: <timecode>
    instrumentation: <string>
  silence:
    at: <timecode>
    duration: <seconds>
    function: <string>

typography:
  title_card: <typeface, weight, tracking>
  placement: <string>
  rule: <e.g. "one card, at the end, four seconds, no music under it">

cast_locks:                         # verbatim strings for character-reference generation
  - name: <string>
    character_id: <platform id, filled at stage 7>
    description: <the exact string, never paraphrased>
    asymmetry: <string>
```

---

## Notes on the fields that get skipped

**`formal_rule.where_it_hurt`** — if you finish production and this list is
empty, the rule was decorative. A real constraint costs you a shot you wanted.

**`forbidden_color`** — the strongest cheap move available. Pick a saturated
color, ban it from the entire film, then spend it once. Four seconds of a color
the audience has not seen for three minutes lands harder than any effect.

**`sound.silence`** — planned, timecoded, and given a *function*. Silence that
happens because nothing was designed is not silence, it's absence.

**`cast_locks.description`** — copied verbatim into every reference generation.
Paraphrasing this string is the most common cause of face drift and it is
entirely self-inflicted.

---

Built on SIP.
