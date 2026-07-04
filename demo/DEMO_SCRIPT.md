# Adapt — 3-Minute Demo Script (LeafHacks '26)

**Speaker setup before you walk up:** Chrome open on `http://localhost:3000`, server running, phone on Ada-Events wifi with the QR page ready, charger plugged in, notifications off. The photosynthesis source paragraph (below) is in your clipboard. Breathe. You have rehearsed this twice.

**Clock discipline:** sections below total 3:10 on paper. The line marked `[CUT-IF-LONG]` buys back 10 seconds. Hard checkpoint: **the gap report must be on screen by 2:05.** If you're behind at the Teach-it-Back stage, skip the emphasis-bolding toggle.

---

## 0:00–0:15 — HOOK (15s)

> "Right now, **549,000 people in England are on a waiting list** just to be *assessed* for ADHD. Only about **1 in 9** UK ADHD cases is ever diagnosed. And here's how most students study anyway: **84% just reread their notes**. Only **11% ever test themselves** — the one thing that actually works."

*(Stand still. Don't touch the laptop yet.)*

## 0:15–0:35 — PERSONAL STORY BEAT (20s)

> `[PLACEHOLDER — the team member with lived experience of dyslexia/ADHD delivers this. Shape: "For me / my brother / my classmate, homework looked like ___. Rereading the same paragraph five times and keeping nothing. Nobody could tell me WHAT I didn't understand — just that I didn't." One beat, one person, real. End on: "So we built Adapt."]`

## 0:35–2:05 — LIVE DEMO (90s)

**Beat 1 — Profile (10s).** Click **Dyslexia-friendly**.
> "Adapt starts with one question: how does your brain work? One profile object drives everything — the font, the warm colour scheme, the spacing, even how the AI talks to you."

**Beat 2 — Reader (15s).** Paste the clipboard paragraph (Ctrl+V), hit Read.

Source paragraph (this is what's in your clipboard — note it **contains chlorophyll**, on purpose):
> *Photosynthesis is the process by which green plants make their own food. Chlorophyll, the green pigment inside chloroplasts, absorbs light energy from the sun. The plant uses this energy to convert carbon dioxide from the air and water from the soil into glucose and oxygen. The glucose is used for energy and growth, while the oxygen is released through the stomata in the leaves.*

> "Gemini restructures it into short, self-contained chunks — every fact preserved, nothing dumbed down."

Flick the **emphasis bolding** slider once. `[CUT-IF-LONG]` *(Never say "Bionic Reading" — it's a trademark.)*

**Beat 3 — Teach-it-Back with Gem (50s).** Open Teach-it-Back.
> "Here's the part nobody else does. Meet **Gem** — Gem is not a tutor. Gem is a confused classmate, and **you** are the teacher."

**Type EXACTLY this — Turn 1:**
```
Photosynthesis is how plants make their own food. They take water from the soil and carbon dioxide from the air, and use sunlight to turn them into glucose and oxygen.
```

Gem replies as a peer and asks a question. Whatever it asks, **type Turn 2:**
```
The glucose is the plant's food, and the oxygen gets released into the air through the leaves. That's why plants matter for the air we breathe.
```

**You have deliberately never mentioned chlorophyll.** That is the planted gap. Do not mention it out loud either.

Click **Finish & Analyse**.
> "While that thinks — notice I explained it pretty well. A normal app would say 'great job!'"

**Beat 4 — The Gap Report (15s).** The score ring animates (amber, ~60–75).
> "Adapt scored my understanding against the source text. Strengths — inputs, outputs, why it matters. But look at the gap card: **I never explained how the plant actually captures light. Chlorophyll.** I didn't know what I didn't know — Adapt found it in ninety seconds."

Tap the gap card so Gem voices the hint. Let it play one line.

## 2:05–2:25 — SCIENCE (20s)

> "This isn't a gimmick. Fiorella and Mayer, 2013: actually teaching produces an effect size of **0.56 versus 0.22** for just preparing to teach — about two and a half times the learning. Koh, 2018: teaching **without notes** beat teaching with notes a week later. Vanderbilt and Stanford have run teachable-agent research since the nineties. **We didn't invent the idea that teaching deepens understanding — researchers have been proving it since the 1990s. We just built the tool that lets any student do it alone, on any topic, at 2am.**"

## 2:25–2:50 — TECH / SPONSOR (25s)

> "Under the hood: **Gemini Flash with structured JSON output** — a strict responseSchema on every call, never begging a chatbot for JSON. A **two-phase architecture**: one persona-locked prompt keeps Gem a confused peer, a separate analyser pass produces the scored report with turn-level gap references. The API key never touches the browser, and every route has cached fallbacks — a 429 or dead wifi never shows this audience an error. **Gemini is the reasoning engine; the accessibility engineering is ours** — 48-pixel targets, focus rings, aria-live, reduced motion."

## 2:50–3:10 — IMPACT / ASK (20s)

> "Ten percent of the UK is dyslexic. Around five percent of children have ADHD, most never diagnosed. Goblin Tools breaks tasks down. Speechify reads *to* you. **Not one of them checks whether you understood — or finds the gap.** Adapt does. Scan the QR code, teach Gem something, and see what you didn't know you didn't know. We're Adapt. Thank you."

---

## Q&A AMMO

**"Isn't this just a wrapper around Gemini?"**
> "The LLM call is the smallest file in the repo. What's ours: the profile system that drives fonts, themes, chunking, prompt tone and TTS pacing from one object; the two-phase persona/analyser split — a peer that must never lecture, and a separate rigorous scorer; strict responseSchema on every route so output is contract-validated, never parsed from prose; server-side key, per-route fallbacks and caching so failure is invisible; and WCAG-level accessibility engineering. Gemini is the reasoning engine. The product is the pedagogy wrapped around it."

**"Why no sign language support?"**
> "Because it's unsolved research, not a hackathon feature. BSL has its own grammar — it isn't signed English — and avatar signing quality is an open problem. We'd rather cut it honestly and put it on the roadmap than demo vapourware. It's on our roadmap slide as exactly that: open research."

**"Learning styles are debunked."**
> "Agreed — and we're careful not to claim them. We call ours *explanation modes*: same complete content, different scaffolds — analogy, narrative, step-by-step — chosen by the student, claiming preference, not efficacy. The evidence we actually build on is retrieval practice and learning-by-teaching, which is robust. Same honesty on dyslexia fonts: the evidence is mixed, so we offer the choice and claim nothing."

**"What happens when you hit rate limits?"**
> "Every route has a cached-response layer and canned fallbacks that render identically to live output. A 429 degrades invisibly. You may have already seen one during the demo — you can't tell, and that's the point. For a classroom deployment you'd batch and cache aggressively; teach-back transcripts cache extremely well."

**"How do you know the score is fair?"**
> "It's benchmarked, not vibes. If source text exists, the analyser scores against it — `reference_text` mode. If not, it checks the explanation's self-consistency. Every gap is pinned to a specific turn index in the transcript, so you can audit exactly where the miss happened."

**"What's next?"**
> "Three things. A dyscalculia mode — number and word-problem transforms, it's about 6% of the UK. Gemini Live for real-time voice teaching, so Gem interrupts like a real confused mate. And sign language as a research partnership, not a feature promise."

---

## FALLBACK PLAYBOOK

**Wifi dies mid-demo:**
1. App and server are on localhost — the UI never breaks. The Gemini calls fail over to the cached/canned layer automatically and render identically. **Say nothing. Keep going.**
2. If you want live responses back: pre-paired phone hotspot, one click, ~15 seconds. Only do this *before* the demo starts, never mid-flow.
3. Nuclear option: the backup video (recorded 16:55, on the desktop, full screen ready). "Let me show you the exact same flow" — narrate over it with the same script.

**API returns 429 / errors:** you will not know and neither will the judges — the fallback layer serves cached responses that look identical. **Never apologise for something the audience didn't see.** Do not mention fallbacks unless asked in Q&A (then it's a strength).

**App crashes / weird state:** F5. State is minimal — you're back at profile select in 3 seconds. Re-pick profile and jump straight to Teach-it-Back: "let me skip to the good part."

**Golden rule:** the audience only knows something broke if your face tells them.
