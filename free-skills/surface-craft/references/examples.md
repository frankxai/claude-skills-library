# Worked example: one full pass

## Contents

1. The brief and source material
2. Before
3. The pass, step by step
4. After: the output

The product, people and numbers here are fictional. They exist to show the pass, not to be
quoted.

## 1. The brief and source material

**Product.** Shiftbook, a rota app for small cafés. Staff mark when they can work; the owner
presses one button and gets next week's rota; staff swap shifts in the app.

**Ask.** "Write the landing page. We're opening a spring beta and want sign-ups."

**Source material provided:**

- Founder demo log, 2026-10-14: rota for a 9-person café built in 48 seconds from saved
  availability.
- Beta notes: 9 cafés in Utrecht using it since 2026-10-01. Owner interviews: 6 of 9 say they
  used to spend "about three hours" a week on the rota in a spreadsheet.
- Integrations page (live): exports hours to Nmbrs and Loket payroll as CSV.
- Quote, with written permission: "I did Sunday's rota on the tram." Marieke de Vries, owner,
  Koffiebar Lombok.
- Pricing: free during the beta. Price not decided.
- Beta capacity: 20 more cafés, because the founder onboards each one by hand.
- Not supported yet: more than 15 staff, multiple locations on one account.

## 2. Before

The first draft the client had:

> # Revolutionize Your Café Scheduling — Effortlessly
>
> Shiftbook isn't just a rota app. It's your AI-powered scheduling partner. Unlock seamless
> shift management, empower your team, and elevate your café to the next level.
>
> ⚡ **Lightning Fast** · 🤝 **Team-Friendly** · 🔒 **Secure**
>
> Trusted by 500+ cafés worldwide. Join 2,000 owners on the waitlist! Only 48 hours left to
> claim your founding spot.
>
> [Get Started] [Learn More]

Visual: centred text over a purple-to-blue gradient, Inter throughout, three rounded cards with
coloured top rails and emoji.

## 3. The pass, step by step

### Step 1: outcome and audience

> Owners of independent cafés with 3 to 15 staff get next week's rota built from staff
> availability in about a minute, and join the waitlist for one of 20 spring beta places.

### Step 2: claim ledger (first version, against the before draft)

| # | Claim | Source | Status |
|---|---|---|---|
| 1 | "Trusted by 500+ cafés worldwide" | none (actual: 9 cafés in Utrecht) | cut |
| 2 | "Join 2,000 owners on the waitlist" | none | cut |
| 3 | "Only 48 hours left" | none, no deadline decided | cut |
| 4 | "Lightning fast" | demo log: 48 seconds for 9 staff | rewrite to the measured fact |
| 5 | "Secure" | no audit, no documentation | cut |
| 6 | "AI-powered" | the rota is built by a rules engine, not a model | cut |
| 7 | (new from source) builds a rota in under a minute | demo log 2026-10-14 | sourced |
| 8 | (new from source) 9 cafés in Utrecht since October | beta notes | sourced |
| 9 | (new from source) owners spent about 3 hours a week | owner interviews, 6 of 9 | sourced, quote as "about" |
| 10 | (new from source) exports hours to Nmbrs and Loket | integrations page | sourced |
| 11 | (new from source) quote from Marieke de Vries | written permission on file | sourced |
| 12 | (new from source) free during beta, 20 places, hand onboarding | founder | sourced |

Nothing was added that the source did not contain. Rows 7 to 12 are claims already in the
source material that the before draft ignored.

### Step 3: ten headlines, scored

| # | Headline | Spec | Ver | Buyer | Gates | Total |
|---|---|---|---|---|---|---|
| 1 | Revolutionize your café scheduling, effortlessly | 0 | 0 | 1 | FAIL (stock words) | cut |
| 2 | Next week's rota in under a minute | 2 | 2 | 1 | pass | 5 |
| 3 | It's not a rota app, it's a partner | 0 | 0 | 0 | FAIL (not-X-but-Y) | cut |
| 4 | Café rotas, reimagined: meet Shiftbook | 0 | 1 | 1 | FAIL (colon-reveal, stock word) | cut |
| 5 | The rota builds itself from who's free | 2 | 2 | 1 | pass | 5 |
| 6 | Rotas for cafés with 3 to 15 staff | 1 | 2 | 2 | pass | 5 |
| 7 | Stop rebuilding the rota in a spreadsheet every Sunday | 2 | 2 | 2 | FAIL (9 words) | cut |
| 8 | Stop doing the rota every Sunday night | 2 | 1 | 2 | pass | 5 |
| 9 | Your café's rota, built in under a minute | 2 | 2 | 2 | pass | 6 |
| 10 | Do Sunday's rota on the tram | 2 | 2 | 1 | pass | 5 |

Headline 8 scores 1 on verifiable because "Sunday night" is not in the source; the quote says
Sunday, not night. Headline 7 was the strongest idea and failed only on length, which is why
headline 8 exists.

**Kept:** 9 (6 points: names the buyer, carries the sourced time) and 2 (5 points: the shortest
line with the measured claim; ties with 5, 6, 8 and 10 broken on word count).

### Step 4: body copy

Applied `copy.md` block by block. Removed every superlative. Each number has a ledger row. The CTA
names the action and the next step.

### Step 5: visual direction

The before visual hit four anti-slop rows (purple-blue gradient, Inter by default, everything
centred, uniform cards with accent rails) plus emoji markers. See the direction card in section 4.

### Step 6: humanizer pass

Ran the humanizer skill with all patterns over the draft from step 4. Changes it forced:

- "Shiftbook takes care of the rota so you can focus on what matters" was cut ("focus on what
  matters" is filler; the line said nothing the subhead did not).
- "Simple, fast, and fair" was a three-item list of qualities with no sources. Replaced with one
  sourced sentence.
- Two em dashes replaced with full stops.
- Three body paragraphs were all two sentences long. One was merged, one cut to a single line.

Neither kept headline changed, so no re-scoring was needed.

### Step 7: the buyer who declined

Declined buyer: owner of a two-site café in Amsterdam who keeps the rota in Google Sheets.

| Their reason | Fix |
|---|---|
| "I have two sites. Does it do that?" | Added to "Who it is for": not yet for more than one location. Honest loss of a sign-up beats a churned beta user. |
| "What does it cost after the beta?" | Price is undecided. Said so, and promised 30 days' notice (founder confirmed). |
| "Why would I give you my email?" | CTA microcopy now says exactly what they get: one email when their place opens. |
| "Is my staff's data safe?" | No audit exists, so no security claim. Added an FAQ answer stating where data is stored and that it can be exported and deleted. Reported as an evidence gap. |

Unfixable with copy: no security documentation. Reported to the founder.

## 4. After: the output

### Final copy

> **Hero**
>
> # Your café's rota, built in under a minute
>
> Staff mark when they can work. You press one button and get next week's rota. Swaps happen in
> the app, not the group chat.
>
> [Join the beta waitlist]
> We email you once, when your place opens. 20 places, because we set up each café by hand.
>
> **Proof**
>
> In use at 9 cafés in Utrecht since October.
>
> "I did Sunday's rota on the tram." Marieke de Vries, owner, Koffiebar Lombok
>
> **How it works**
>
> 1. Add your staff and opening hours.
> 2. Staff mark their availability on their phones.
> 3. Press "Build rota". In our tests a 9-person café took 48 seconds.
> 4. Publish. Staff get the rota and can swap shifts with each other.
> 5. Export hours to Nmbrs or Loket at the end of the month.
>
> **Who it is for**
>
> Independent cafés with 3 to 15 staff on one site. Not yet for more than one location or more
> than 15 staff.
>
> **What it costs**
>
> Free during the beta. We decide pricing before the beta ends and give you 30 days' notice
> before anything is charged.
>
> **FAQ**
>
> *How long does setup take?* About 20 minutes on a call with the founder.
> *Can I leave?* Yes. Export your rotas and delete your account from settings.
> *Where is staff data stored?* On servers in the EU. You can export or delete it at any time.
> *Does it work with my payroll?* It exports hours as CSV for Nmbrs and Loket. Other payroll
> tools can import the same CSV.
>
> **CTA**
>
> [Join the beta waitlist]
> One email when your place opens. Nothing else.

(The FAQ answers on setup time and EU storage were confirmed by the founder during the pass and
added to the ledger as rows 8 and 9 below.)

### The two headlines

| Headline | Spec | Ver | Buyer | Gates | Total | Why it survived |
|---|---|---|---|---|---|---|
| Your café's rota, built in under a minute | 2 | 2 | 2 | pass | 6 | Names the buyer and carries the one measured claim |
| Next week's rota in under a minute | 2 | 2 | 1 | pass | 5 | Shortest line with the same claim; good for ads and the email subject |

### Direction card

```text
DIRECTION CARD: Shiftbook beta landing page

Reader and setting   café owner, on a phone, between services or on the way home
One-line feel        practical, warm, unhurried, local

Type
  Display            Fraunces, 600   | job: soft serif, reads like a café chalkboard menu, not a SaaS page
  Reading            Source Sans 3, 18px | job: open shapes stay legible on a phone in bright light
  Scale              16, 18, 24, 34, 48

Colour
  Neutrals           bg #F6F4F0  surface #FFFFFF  border #E2DDD5  muted #6B645B  text #24211D   (warm: food and people)
  Accent             #1F6F5C (deep green from the tiled counters in the beta cafés)  used for: the waitlist button only
  Contrast checked   accent on bg 5.5:1, white on accent 6.0:1, text on bg 14.6:1, muted on bg 5.3:1

Layout
  Grid               single column on phone; two columns from 900px, max width 1080px, left-aligned
  Hero               headline and button left; right side is a real phone screenshot of a built rota
  Density            balanced; generous line height for phone reading

Imagery              real screenshots from the beta; one photo of Koffiebar Lombok's counter (permission on file)
Motion               one: the rota grid filling in when "Build rota" is pressed, to explain step 3

Anti-slop check      purple-blue gradient: removed. Inter default: replaced, reason above.
                     Everything centred: removed, left-aligned. Cards with accent rails: replaced by a numbered list.
                     Emoji markers: removed. Cream and terracotta: not used (warm neutral, green accent).
```

### Claim ledger (final)

| # | Claim on the surface | Source | Status |
|---|---|---|---|
| 1 | Rota built in under a minute; 48 seconds for 9 staff | founder demo log, 2026-10-14 | sourced |
| 2 | 9 cafés in Utrecht since October | beta notes | sourced |
| 3 | Marieke de Vries quote | written permission on file | sourced |
| 4 | Exports hours to Nmbrs and Loket as CSV | integrations page, live | sourced |
| 5 | Free during the beta; 30 days' notice before charging | founder, confirmed during pass | sourced |
| 6 | 20 places; each café set up by hand | founder | sourced |
| 7 | 3 to 15 staff, one site; not yet multi-location | product notes | sourced |
| 8 | Setup about 20 minutes | founder, confirmed during pass | sourced |
| 9 | Staff data stored in the EU; export and delete in settings | founder, confirmed during pass | sourced |
| 10 | "Trusted by 500+ cafés worldwide" | none | cut |
| 11 | "Join 2,000 owners on the waitlist" | none | cut |
| 12 | "Only 48 hours left" | none | cut |
| 13 | "Secure" | none | cut, reported as evidence gap |
| 14 | "AI-powered" | inaccurate | cut |

**Humanizer:** ran, all patterns. **Unfixed declined-buyer reason:** no security documentation;
reported to the founder.

Note: the owner-interview figure ("about three hours a week") was left off the page. Six of nine
is a small sample and the figure is self-reported; it stays in the ledger notes for a later page
with a clearer method.
