# Devpost Submission — copy-paste fields

## Project title
Adapt — Advanced Dyslexia & ADHD Personal Tutor

## Tagline (35 chars)
Teach it back. Adapt finds the gap.

## Inspiration
549,000+ people in England are waiting for an ADHD assessment; only about 1 in 9 UK ADHD cases is ever diagnosed. 10% of the UK is dyslexic. Meanwhile the dominant study strategy — used by 84% of students — is rereading, and only 11% ever practise retrieval (Karpicke, Butler & Roediger, 2009). Every accessibility tool we found (Goblin Tools, Speechify, Read&Write, Immersive Reader) makes content easier to *consume*. None of them checks whether you *understood* — or tells you what's missing. Learning-by-teaching research has shown since the 1990s (Vanderbilt/Stanford's "Betty's Brain") that explaining a topic is one of the most powerful ways to learn it. We built the tool that lets any student do it alone, on any topic, at 2am.

## What it does
Adapt is a study companion for neurodivergent students. You pick a profile — Dyslexia-friendly, ADHD Focus, or Classic — and one profile object drives the entire experience: fonts (Lexend/OpenDyslexic), themes, spacing, chunk sizes, the AI's tone rules, and text-to-speech pacing. Reader mode restructures pasted homework into short self-contained chunks with 100% of the facts preserved, with adjustable emphasis bolding. Explain-it-differently offers the same content as an analogy, a narrative, or a step-by-step breakdown. The headline is Teach-it-Back: you teach the topic to Gem, a friendly confused AI peer who asks one specific question per turn and treats your errors as its own confusion. When you finish, a separate analysis engine scores your understanding 0–100 against the source text, shows your strengths, and pinpoints the exact gaps — down to the turn where you missed them — with peer-voiced hints and follow-up questions.

## How we built it
Single-page vanilla JS web app with a zero-dependency Node proxy. Every AI call goes through /api/* routes to Gemini (gemini-3.5-flash) with a strict structured-output responseSchema — output is contract-validated JSON, never parsed from prose. The core design is a two-phase split: a persona-locked prompt that keeps Gem a confused peer (max 3 sentences, always ends on a question, never lectures), and a completely separate analyser pass that produces the scored gap report (benchmark mode, trend, strengths, turn-indexed gaps, improved explanation). The API key stays server-side; every route has a response cache and canned fallbacks so a 429 or dead wifi never shows an error. The UI is built WCAG-minded: 48px targets, focus rings, aria-live regions, reduced-motion support. Demoed on localhost with a LAN QR code so judges can try it on their own phones.

## Challenges we ran into
Keeping Gem in character was the hardest prompt-engineering problem: an LLM desperately wants to be a helpful tutor, and a tutor kills the learning effect — the student must do the retrieval. Persona-locking it to a peer who processes the student's errors as its own confusion took many iterations. Second: making the score defensible rather than vibes — we split analysis into its own phase with a strict schema and explicit benchmark modes (reference_text vs self_consistency). Third: engineering for a demo environment where wifi and rate limits are hostile — per-route fallbacks and caching that render identically to live responses.

## Accomplishments that we're proud of
The gap report reliably finds a specific, real omission in a student's explanation and pins it to the turn where it happened — that's the moment every test user reacted to. One profile object genuinely reconfiguring the whole app (visuals, AI tone, pacing) rather than being a theme switcher. Zero dependencies end to end. And honesty as a feature: we refused to claim dyslexia-font efficacy, renamed "learning styles" to explanation modes, and cut sign language rather than demo vapourware.

## What we learned
Structured output (responseSchema) beats prompt-begged JSON every time — we never wrote a JSON repair function. Persona constraints belong in a separate phase from analysis: one model call can't be both a convincing confused peer and a rigorous grader. The learning-science literature is remarkably specific (teaching beats preparing-to-teach d = 0.56 vs 0.22, Fiorella & Mayer 2013) and designing directly from it is faster than guessing. And fallback engineering isn't polish — it's what makes a live demo possible.

## What's next for Adapt
A dyscalculia mode (number and word-problem transforms — ~6% of the UK). Gemini Live for real-time voice teach-back so Gem can interrupt like a real classmate. Class-teacher visibility of anonymised gap patterns. Sign language stays on the roadmap as open research — BSL grammar isn't signed English, and we'd rather partner with researchers than promise a feature.

## Built with
- javascript
- node.js
- html5
- css3
- gemini-api (gemini-3.5-flash, structured JSON output)
- web-speech-api (speech recognition + TTS)
- svg
- lexend / opendyslexic fonts
- claude-code (pair programmer — credited per MLH rules)
