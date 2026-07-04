# Submission Checklist — LeafHacks '26 (deadline 17:45 on Devpost)

Work backwards from 17:45. Every slot has slack built in. If anything slips, cut rehearsal, never the submission.

## Before 16:55 — pre-flight (do once, any time today)
- [ ] `.gitignore` contains `.env` — and confirm the key was never committed: `git log --all --oneline -- .env` must show nothing.
- [ ] README screenshots: take the four TODO screenshots if there's time; if not, delete the TODO lines rather than shipping placeholders.
- [ ] Devpost account logged in, project draft created, team members (Wamiq, Kumial, Shaheer, Matin) all added.

## 16:55 — record the backup video (~4 min)
- [ ] GNOME: press **Ctrl+Alt+Shift+R** (built-in screen recorder, saves to `~/Videos/Screencasts`). On X11, ffmpeg alternative:
  ```
  ffmpeg -f x11grab -framerate 30 -i :0.0 -f pulse -i default -c:v libx264 -preset ultrafast ~/adapt/demo/backup-demo.mkv
  ```
- [ ] Capture the exact DEMO_SCRIPT click-path, no narration needed (you'll talk over it live): profile pick → paste paragraph → reader chunks → emphasis toggle → Teach-it-Back both typed turns → Finish & Analyse → score ring → tap the chlorophyll gap card → hint plays. Under 2 minutes.
- [ ] Watch it back once at 2× speed. Put it on the desktop, full-screen player tested.

## 17:00 — FREEZE
- [ ] No more code changes. None. A 17:30 "quick fix" is how demos die.

## 17:05 — push + verify public
- [ ] `git add -A && git commit && git push`.
- [ ] Open the repo URL in an **incognito/logged-out window**: repo loads, README renders, AI-credit section visible (MLH requirement), no `.env` in the file list.

## 17:10 — submit Devpost
- [ ] Paste every field from `demo/DEVPOST.md`: title, tagline, all long-form sections, built-with list.
- [ ] Attach: repo URL, backup video (upload or unlisted YouTube link), screenshots.
- [ ] Tick the **Best Use of Gemini API** prize category.
- [ ] Hit submit — not "save draft". Submit.

## 17:20 — verify it went through
- [ ] Log out or use incognito, reload the Devpost project page: status shows **submitted**, all fields present, links clickable.
- [ ] Screenshot the confirmation page. (17:45 disputes are won with screenshots.)

## 17:25+ — rehearse twice, charger in
- [ ] Full run-through against a timer, out loud, twice. Target 2:50 so stage nerves land you at 3:00.
- [ ] Second run: have a teammate play judge and fire two questions from the Q&A ammo section.
- [ ] Laptop on charger the entire time and during judging.

---

## Table-demo hygiene (from now until judging ends)

| Item | State |
|---|---|
| Chrome | Open on `http://localhost:3000`, only tab, bookmarks bar hidden |
| Server | `node server.js` running; if it's been up hours, restart once at 17:25 |
| QR code | Visible on the table/screen, points at the laptop's LAN address |
| Phone | On **Ada-Events** wifi (same LAN as laptop), QR pre-tested from it |
| API key | Lives only in `.env` on this laptop — nothing else relies on it, it's in no repo, no browser, no teammate's machine |
| Notifications | Do Not Disturb on laptop **and** phone |
| Power | Charger plugged in; screen sleep/lock disabled; brightness max |
| Fallbacks | Kill wifi once at the table and confirm the canned-response flow renders clean, then reconnect |
| Backup video | On desktop, tested, one double-click from playing |
