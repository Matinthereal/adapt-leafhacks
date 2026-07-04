# Adapt — LIVE Pitch Script (3 minutes, spoken on stage)
*You + the real app on screen. No video needed. Every line is what you actually say; every `[DO]` is what you click. Rehearse twice — out loud, on the real laptop.*

**One-liner if a judge only hears one sentence:** *"Every study app explains things to you — Adapt flips it: you teach the AI, and it finds the exact thing you didn't know you'd missed."*

---

## Before you open your mouth (30-sec setup — do this at the table)
- [ ] App open on **`http://localhost:3000`** in **Chrome**, full screen, profile **not yet picked** (onboarding showing).
- [ ] A second tab already on the **Reader** with the photosynthesis paragraph pasted (so you can flip fast).
- [ ] Wifi on, but it doesn't matter — the app has cached fallbacks, so **the demo works even if the internet dies**.
- [ ] Phone out with the **QR code** (`demo/qr.png`) ready to hand a judge.
- [ ] Volume up if you'll show the voice/read-aloud.

---

## THE SCRIPT

### ① Hook — 0:00–0:20  *(look at them, not the screen)*
> **"Quick question — how do you revise? …Yeah. You read it again. Everyone does. 84% of students re-read, and only 11% ever actually test themselves — and re-reading barely works.**
> **Now imagine you're dyslexic, like 1 in 10 people are. Or you're one of the half a million people in England waiting right now for an ADHD assessment. That wall of text? It was never built for you."**

`[DO]` Nothing yet — just you talking. Hold eye contact. Let the 549,000 land.

### ② The flip — 0:20–0:40
> **"So we built Adapt. And the big idea is one flip: every other study tool explains things *to* you. Adapt makes *you* teach *it*. But first — it meets you where you are."**

`[DO]` Click **ADHD Focus** on the profile picker. *Pause a beat* as the whole app re-themes.
> **"Watch — one click, and the entire app changes. Font, colour, spacing, pacing… and quietly, how our AI talks to you. That's not a filter — it's one profile object driving the interface *and* the AI's prompt. That part's our engineering."**

`[DO]` Quick click **Dyslexia** to show it warm to ivory + Lexend, then carry on.

### ③ Reader — 0:40–1:00
> **"First, reading. Paste anything dense…"**

`[DO]` Go to **Reader**, paste the photosynthesis paragraph, hit **Make it readable**.
> **"…and every fact is kept — it's just re-chunked into something that actually breathes. Gemini does the reasoning; we shape it for the profile. There's a dyslexia font, high-contrast, the lot."**

`[DO]` Tap the **Dys font** or **Contrast** toggle once — then move on. Don't linger.

### ④ THE HERO — Teach it Back — 1:00–2:10  *(slow down, this is the whole pitch)*
> **"But here's the one that wins us the room. Meet Gem — a classmate who knows absolutely nothing. And I'm going to teach it photosynthesis. Watch what I leave out."**

`[DO]` Go to **Teach it back**, topic **"Photosynthesis"**, **Start**. Type (or say) **turn 1**:
> *"Photosynthesis is how plants make their own food — they take in sunlight, water and carbon dioxide, and use the energy from the sun to make food and give off oxygen."*

`[DO]` Send. Gem replies with a question. Read Gem's question **out loud** to the judges.
> **"See — it doesn't lecture. It asks. One sharp question. So I answer, a bit vaguely…"**

`[DO]` Type **turn 2** — the fuzzy one, on purpose:
> *"Umm… the green stuff in the leaves? The bit that makes them look green?"*

`[DO]` Send, then hit **See what we mapped out**. Let the **score ring animate**.
> **"And there it is. I never once said the word *chlorophyll* — so it found the exact gap I didn't know I'd left. With a hint, a follow-up question, and a cleaner rewrite. Re-reading would never have caught that. Teaching it did — in about ten seconds."**

`[DO]` Tap the **chlorophyll gap card** to reveal Gem's hint. Hand a judge the **QR code** now.
> **"Scan that — try it on your own phone while I finish."**

### ⑤ Science + tech — 2:10–2:40
> **"And this isn't a gimmick. Teaching something is one of the most evidence-backed ways to learn — actually teaching it more than *doubles* what you keep versus just studying it. Researchers have proven that since the 1990s. We just built the tool that lets any student do it, alone, at 2am.**
> **Under the hood: Gemini returns a strict, schema-enforced JSON gap analysis — not begged from a prompt, enforced. Gemini is the reasoning engine — the accessibility engineering is ours."**

### ⑥ Close — 2:40–3:00
> **"Adapt. You don't read it again — you teach it once. Built for every mind, especially the ones that learn differently.**
> **…and yeah. It was chlorophyll."**  *(smile, done)*

---

## IF THE LIVE DEMO BREAKS (say this, keep smiling)
- **API/wifi dies:** keep clicking — *"and because judges' wifi is judges' wifi, everything you're seeing is running on cached responses right now, so it never breaks on stage."* (It genuinely is cached — you're telling the truth.)
- **Voice mic won't start:** *"voice is a bonus — I'll just type it,"* and type. Never fight the mic on stage.
- **Totally frozen:** talk over a still screen — you know the script; the words carry it. Refresh only as a last resort.

## Q&A — fast, confident answers
- **"Isn't this just a Gemini wrapper?"** → *"No — the profile object drives both the UI and the prompt, and the gap analysis is a two-phase pipeline against a strict schema. Gemini reasons; the accessibility system is ours."*
- **"Why not sign language?"** → *"Full signing avatars are an unsolved research problem — we scoped honestly to what we could ship brilliantly."*
- **"Aren't learning styles debunked?"** → *"Yes — that's why we call them explanation *modes*, not learning styles. Same facts, different shape."*
- **"What's next?"** → *"Dyscalculia support, live voice tutoring, and a spelling-recognition mode."*
- **"Does the font actually help dyslexia?"** → *"Evidence is mixed, so we don't claim a cure — we give the *choice*. That's the accessible thing to do."*

## Delivery notes
- Speak to the **judges**, glance at the screen. The app is your slide, not your script.
- **Rehearse the chlorophyll beat twice** — the pause before Gem's question is where the room leans in.
- Hand over the QR **during** the demo, not after — judges trying it themselves = instant Usefulness + UX points.
- Total is ~450 spoken words ≈ 3:00 at a calm pace. If you're running long, cut the Reader beat (③) first — never cut Teach-it-Back.

## 30-second elevator version (backup, if they only give you 30s)
> *"Adapt is a study app for people who learn differently. It re-themes to your brain — dyslexia, ADHD — and then does something no one else does: instead of explaining to you, it makes you teach a curious AI, and it finds the exact thing you got wrong. Teaching is one of the most proven ways to learn, and we made it something any student can do alone. Built on Gemini — the accessibility engineering is ours."*
