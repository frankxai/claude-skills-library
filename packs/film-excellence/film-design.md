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
  # Declare BOTH. A festival measures the delivered file, which includes the
  # end card — so runtime_target is picture + card, never picture alone.
  runtime_target: <mm:ss>          # total delivered runtime, card included
  runtime_picture: <mm:ss>         # last beat out-point, card excluded
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
  # speech_free = nobody talking; room tone and foley continue. This is the
  # 20% budget. total_silence = no signal at all — a separate, rarer event.
  # Store PER BEAT and derive every total. A summary figure with no per-item
  # data behind it has nothing keeping it honest — see DOCTRINE.md § The
  # derived-figure rule, which exists because both reference builds shipped
  # this bug in six different forms before anyone caught it.
  speech_free:
    budget_seconds: <20% of runtime_picture>    # the floor
    actual_seconds: <sum of beat_seconds>       # derive; never type by hand
    beats: [<beat numbers>]
    beat_seconds: { <beat>: <seconds>, … }      # the authoritative record
    whole_beats: [<beats with no dialogue at all>]
    partial_beats: [<beats that also carry dialogue>]
    first_spoken_word_at: <timecode>
    longest_span: <seconds>
    longest_span_function: <string>
  # total_silence is a SUBSET of speech-free, not a sibling: a signal-free
  # moment obviously has no speech in it, so it already counts toward the
  # budget above. Record it here to describe it, not to add it again.
  # Set to null if the film never goes signal-free — most shouldn't.
  total_silence:                    # optional. If used, once only.
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

**`runtime_target` vs `runtime_picture`** — the beat sheet ends at the last
beat's out-point, then a title card adds three or four seconds nobody counts.
Declare both and let the difference be visible. A film whose stated runtime is
its picture length is quietly wrong by the length of its own card, and the
number that matters is the one a festival measures off the delivered file.

**`formal_rule.where_it_hurt`** — if you finish production and this list is
empty, the rule was decorative. A real constraint costs you a shot you wanted.

**`forbidden_color`** — the strongest cheap move available. Pick a saturated
color, ban it from the entire film, then spend it once. Four seconds of a color
the audience has not seen for three minutes lands harder than any effect.

**`sound.speech_free` / `sound.total_silence`** — planned, timecoded, and given
a *function*. Silence that happens because nothing was designed is not silence,
it's absence. Keep the two apart: the first is a scene where nobody talks, the
second is the track going to nothing, and confusing them produces either a
dropout where you wanted restraint or a wall of tone where you wanted the floor
to fall away.

**`cast_locks.description`** — copied verbatim into every reference generation.
Paraphrasing this string is the most common cause of face drift and it is
entirely self-inflicted.

---

Built on SIP.
