# Adapt — Advanced Dyslexia & ADHD Personal Tutor

Adapt is a study tool for neurodivergent students, built at LeafHacks '26. You pick a profile — Dyslexia-friendly, ADHD Focus, or Classic — and one profile object drives everything: fonts, themes, spacing, chunk sizes, the AI's tone, and text-to-speech pacing. Paste your homework and Adapt restructures it into short, readable chunks with every fact preserved. Then comes the headline: **Teach-it-Back**. You teach the topic to Gem, a friendly, confused AI peer — and when you're done, Adapt scores your understanding, shows your strengths, and pinpoints the exact gaps you didn't know you had.

> We didn't invent the idea that teaching deepens understanding — researchers have been proving that since the 1990s. We just built the tool that lets any student do it alone, on any topic, at 2am.

## The science

- **Students study wrong by default.** 84% reread notes as a study strategy; 55% rank it first; only 11% ever practise retrieval — the strategy that actually works (Karpicke, Butler & Roediger, 2009, *Memory* 17(4)).
- **Teaching beats preparing to teach ~2.5×.** Actually explaining material produced d = 0.56 vs d = 0.22 for merely preparing to teach (Fiorella & Mayer, 2013, *Contemporary Educational Psychology* 38(4)).
- **Teaching without notes wins.** Forced retrieval while teaching beat teaching with notes on a one-week-delayed comprehension test (Koh, Lee & Lim, 2018, *Applied Cognitive Psychology* 32(3)). Adapt's teach-back is notes-free by design — and the teachable-agent lineage goes back to Vanderbilt/Stanford's "Betty's Brain" programme in the late 1990s.

## Features

- **Profile spine** — one object per student drives fonts (Lexend / OpenDyslexic toggle), warm-ivory vs dark themes, spacing, chunk sizes, Gemini system-prompt tone rules (dyslexia: short sentences; ADHD: active verbs, momentum), and TTS pacing.
- **Reader mode** — paste homework, get short self-contained chunks via Gemini structured JSON, preserving 100% of the facts. Adjustable emphasis bolding, font and contrast toggles.
- **Explain-it-differently** — the same content as a standard analogy, a narrative, or a step-by-step breakdown. Explanation *modes*, chosen by the student — not "learning styles".
- **Teach-it-Back with Gem** — Gem is a confused peer, never a tutor: max 3 sentences per turn, always ends with one specific question, treats your mistakes as its own confusion. Typed input first-class; Web Speech voice input and TTS as a bonus.
- **The gap report** — a separate analysis pass returns strict JSON: an understanding score (0–100) with a benchmark mode (`reference_text` or `self_consistency`), trend, strengths, gaps pinned to specific turns with peer-voiced hints, three follow-up questions, and an improved model explanation. Rendered as a score ring, strengths pills, and tappable gap cards.
- **Fails gracefully** — per-route canned fallbacks and response caching mean a 429 or dead wifi never shows an error.
- **Accessibility as engineering** — 48px touch targets, visible focus rings, `aria-live` announcements, `prefers-reduced-motion` respected.

## Architecture

```
┌──────────────┐        ┌────────────────────┐        ┌────────────────┐
│   Browser     │  fetch │  Node proxy         │  HTTPS │  Gemini API     │
│  vanilla JS   │───────►│  server.js          │───────►│  gemini-3.5-    │
│  single page  │ /api/* │  zero dependencies  │        │  flash          │
└──────────────┘        │  • key server-side  │        │  structured     │
        ▲               │  • responseSchema   │        │  JSON output    │
        │               │  • response cache   │        └────────────────┘
   LAN QR code          │  • fallbacks/ dir   │
   (phone demo)         └────────────────────┘
```

The API key lives in `.env` on the server and never reaches the browser. Every `/api/*` route validates against a strict responseSchema and falls back to cached or canned responses in `fallbacks/` on any failure.

## Run it

```bash
git clone https://github.com/adapt-team/adapt && cd adapt
echo "GEMINI_API_KEY=your-key-here" > .env
node server.js    # → http://localhost:3000
```

No build step, no dependencies. Node 18+.

**Demo mode:** with no key (or no network), Adapt serves the canned fallback responses — the full flow works offline for demos and marking.

## Screenshots

- `TODO: profile selection (dyslexia-friendly theme)`
- `TODO: reader mode with emphasis bolding`
- `TODO: Teach-it-Back conversation with Gem`
- `TODO: gap report — score ring, strengths, gap cards`

## AI credit

Built during LeafHacks '26 with Claude Code (Anthropic) as pair programmer; all Gemini API calls, product design and prompts by the Adapt team: Wamiq, Kumial, Shaheer, Matin.

## Honest limitations

- **Dyslexia fonts:** the evidence for dyslexia-specific typefaces is mixed. We offer the choice (Lexend / OpenDyslexic) and claim preference, not efficacy.
- **"Explanation modes", not learning styles:** learning-styles theory is contested; our modes are optional scaffolds over identical complete content, not a matching claim.
- **The score is a benchmark, not a diagnosis:** `reference_text` mode scores against source material; `self_consistency` mode checks internal coherence. Neither is a clinical instrument.
- **Sign language:** unsolved research (BSL grammar ≠ signed English; avatar quality is an open problem). It's on the roadmap as research, not a promised feature.

## Roadmap

1. **Dyscalculia mode** — number and word-problem transforms (~6% of the UK, BDA).
2. **Gemini Live voice** — real-time spoken teach-back, so Gem can interrupt like a real confused classmate.
3. **Sign language** — open research; we'd pursue this as a partnership, not a feature checkbox.
