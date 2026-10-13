# Pixeldorp

Context and instructions for coding agents working on this repo. (`CLAUDE.md` imports this file.)

A mobile-first web app in **Dutch** that helps kids in **groep 3** (age ~6) practise reading and math. Short practice rounds earn bricks and stars. The kid spends them in a small **pixel-art village builder**. For the kid it is mostly about the game; parents see the learning progress.

The first user is the owner's son **Marim** (groep 3, school year 2026–2027). The app is built to be generic: several kids per device, each starting at their own level.

## Status

- One self-contained file: `index.html` (HTML + CSS + vanilla JS, no build step, no dependencies besides Google Fonts).
- Built in two iterations in a Claude chat session (Oct 2026), then handed off to this repo (`sventies/Pixel-dorp`).
- Not yet tested by the kid. Next step from the owner: try rounds with Marim and adjust difficulty and UX.

Run it: open `index.html` in a browser, or serve the folder (`npx serve .` / `python3 -m http.server`). The microphone (parent recordings) needs a secure context: `https://` or `localhost`.

Test: `node tools/check-generators.js` runs every exercise generator for every level and checks answers and options. Run it after every change to the curriculum or generators.

## Hosting

GitHub Pages, deployed from the `main` branch, folder `/` (repo Settings → Pages → Source: "Deploy from a branch"). The URL is https://sventies.github.io/Pixel-dorp/. Pages serves https, so the microphone works there. `.nojekyll` turns off Jekyll processing so files are served as-is.

- Keep the app static and at the repo root: anything pushed to `main` goes live within a minute or two.
- Use relative paths only (the site lives under `/Pixel-dorp/`, not `/`).
- localStorage and IndexedDB are per origin. All projects on `sventies.github.io` share one origin, so keep the `pixeldorp`-prefixed storage keys. Moving to another domain later starts with empty progress and recordings (see the export/import idea below).

## Owner's decisions (keep these unless told otherwise)

1. **Language:** the app is in Dutch, both kid-facing and parent-facing text. Everything else is in English: conversations with the owner, code comments, commit messages and documentation. The owner is Dutch and may sometimes give context in Dutch; reply and document in English anyway.
2. **Curriculum:** follows the school methods on the chart in `docs/curriculum-groep3.png` (text version: `docs/curriculum-groep3.md`):
   - Reading: **Veilig leren lezen (VLL), kim-versie**. Units are *kernen*: Start, Kern 1–11, Afsluiting. Goal by the end of groep 3: AVI E3.
   - Math: **De wereld in getallen (WIG) 5.1**. Units are *blokken*: Blok 1–9.
   - Reading and math topics may be changed if that teaches better.
3. **Reward game:** "Build a world". Place pixel tiles (grass, water, houses, animals…) on a 10×12 grid.
4. **Reward pace:** about 5 minutes of learning (8 exercises by default) gives 2 minutes of building. Both are settable per kid.
5. **Start level:** generic. The parent picks each kid's kern and blok at setup. No hard-coded start.
6. **Audio (2nd iteration, important):**
   - **No spoken guidance.** No read-aloud instructions, praise or greetings. The app guides visually.
   - The **only** speech is the word in the exercise **"Welk woord hoor je?"** (hear a word, pick it out of three).
   - Parents can **record each word themselves**. Recordings are stored on the device (IndexedDB) and shared by all kids on that device. Setup guides the parent through this. Without a recording, the **computer voice (speechSynthesis, nl-NL)** says the word.
   - Short beep effects (right, wrong, place block) stay, with an on/off switch in the parent area.
7. Progress should be visible for reading, writing and math, but the kid-facing motivation is game kudos built up over time.

## Architecture (all in `index.html`)

The `<script>` is in sections marked `/* ---------- name ---------- */`:

| Section | What it does |
|---|---|
| helpers | `$`, `R(a,b)` random int, `pick`, `shuffle`, `esc`, `wpick` (weighted pick), `today`, `fmtTime` |
| storage | `localStorage['pixeldorp.v1']` → `DB = {kids:[], cur, voice, sfx}`. `save()`/`load()` wrapped in try/catch |
| speech + sound | `tts(word)` computer voice; IndexedDB `pixeldorp-audio` / store `clips` (key = word, value = Blob); `CLIPS` map word → objectURL; `playWord(w)` plays the recording, else falls back to TTS; `beep()`/`SFX` square-wave effects |
| pixel sprites | `PAL` palette letters → colours; 8×8 sprites as string rows; `TILES` = buildable items (`t:'g'` ground layer, `t:'o'` object layer, `need` = stars to unlock, `cost` = bricks, `water:1` only on water, `anim:1` bobs, `frames` animated ground); `iconURL()` renders a sprite to a data URL |
| world | 10×12 grid, `world = {g:[ground ids], o:[object ids|null]}`, drawn on an 80×96 canvas scaled with `image-rendering: pixelated`; a global 450 ms `FRAME` tick animates water and animals |
| curriculum: reading | `L_LEVELS` (13 levels with new graphemes per kern); `GLIST` multi-letter graphemes; `splitG(word)` splits a word into graphemes; `WORDSRC` word list `word+emoji` (prefix `*` = multi-syllable, forced to level ≥ 7); each word's level = highest level of its graphemes; `NOPIC` = words without a picture (ik, is, kim…) |
| curriculum: math | `R_BLOK` (9 blokken: description + list of generator keys); `MAXN` number range per blok; `SKILL` = Dutch labels for every exercise key (parent stats) |
| exercise builders | `mk()` builds a multiple-choice exercise; `LG.*` reading generators; `genL(level)`; `RG.*` math generators; `genR(blok)`. About 35% of exercises are review from a random lower level |
| kid model | `newKid()` with fields: `id, name, avatar, lees (0-12), reken (0-8), perRound, playMin, stars, bricks, credit (seconds of play time), world, stats{key:{ok,tot}}, lvl{'L3':{ok,tot}, 'R2':…}, sessions[], streak, lastDay` |
| navigation | `show(screenId)`; screens are `<section class="screen" id="s-…">` |
| screens | welcome, kids (picker), home, ex (exercise), done, build, gate (parent math gate), parent, edit (kid settings + stats), guide (recording intro after adding a kid), rec (recording words) |
| events | one delegated `click` listener switching on `data-act` |

### Exercise types

**Reading:**

| Key | What the kid does | Visual hint after a wrong answer |
|---|---|---|
| `beginklank` | Picture plus one dash per grapheme, first one an orange `?`; pick the first sound | Rest of the word fills in (`?aan`) |
| `letterplaatje` | Big letter `m…`; pick the picture that starts with it | Words appear under the pictures |
| `woordplaatje` | Read the word; pick the picture | None |
| `hoorwoord` | Hear the word (auto-plays, big speaker button to replay); pick the written word | None |
| `spellen` | Picture; build the word from grapheme tiles. This is the "writing" practice | 2nd wrong tap: the right tile glows. 4th: the answer is shown |
| `zin` | Picture; pick the matching sentence (from Kern 7) | None |

Level mix in `genL`: Start = sounds, letters and listening; Kern 1–2 add word reading and spelling; Kern 7+ shifts to spelling and sentences.

**Math:** `flits` (ten-frame, see without counting), `tellen`, `buur` (number before/after), `splits` / `splits10` / `splitsAll` (splitshuis), `klokHeel` / `klokHalf` / `uurLater`, `plus12`, `verdwijn` (subtract with crossed-out items), `geld` (coins and notes €10/€20), `tiental` (tens rods + units), `plus5`, `plus10`, `tienSom`, `getallenlijn` (number line 0–100), `plusmin10`, `kleineSom` (via the small sum, with hint), `vierSommen`.

Every exercise screen has a progress-pip bar, an icon plus short prompt text (`PICON`), and a visual. If the kid hasn't tapped after 9 s, the answer buttons bounce ("nudge"). Two wrong answers reveal the correct one.

### Rewards

- First try correct: +2 bricks, +1 star. Second try: +1 brick. Perfect round: +3 bonus bricks.
- **Stars** are cumulative and unlock `TILES` (flower 0 → unicorn 400). **Bricks** are spent when building; the eraser (`gum`, first button in the palette) refunds them.
- Tapping a cell with a ground tile (e.g. grass) also clears the object on it, with a refund. Dragging ground tiles leaves objects in place, so painting grass doesn't wipe out houses by accident.
- Each finished round adds `playMin` minutes of building time, capped at 3 rounds' worth. The timer counts down only while building and pauses when the tab is hidden.
- Daily streak is tracked.

### Parent area

- Behind a multiplication gate (a×b with 4–9).
- Manage kids: name, avatar, kern, blok, exercises per round, play minutes.
- Reset a kid ("Voortgang wissen", tap twice to confirm): clears stars, bricks, play time, world, stats, sessions and streak, keeps name, avatar, levels and round settings (`resetKid()`). Word recordings are per device and stay.
- Stats: % first-try correct per skill, recent rounds.
- **Level-up suggestion:** shown when the current level has ≥ 20 attempts and ≥ 85% first-try correct.
- **Words recording:** per-kern counts (n/m) and a recording flow, one word at a time. Record auto-stops after 3 s, then plays back; options for re-record, delete, next, and word chips to jump. Computer-voice picker and test button. Sound-effects toggle.

## Constraints and gotchas

- **Microphone:** uses `getUserMedia` + `MediaRecorder`. The claude.ai Artifact version (https://claude.ai/artifact/AUgzDVsBFhD4unpXcpweXX) blocks the mic, so the code falls back to `<input type="file" accept="audio/*" capture>` (pick a recording per word). Self-hosted on https or localhost, the mic works directly. Each recording opens a fresh `getUserMedia` stream and stops it afterwards: on iOS Safari a stream kept open across recordings goes silent once a clip has played back (the 2nd recording came out empty). A fresh stream needs a moment before sound comes through, so the record screen shows "Even wachten" until the recorder has started plus 400 ms, then switches to the red Stop button and the 3 s bar. Noise suppression and echo cancellation are off because they swallowed the short "k" at the start of words. There is no trimming of recordings.
- **Speech:** the computer voice says letter *names* ("em"), not letter *sounds* ("mmm"). That's why TTS is never used for single letters. Real phoneme audio would need recorded clips.
- **Storage:** progress is in localStorage and recordings in IndexedDB, per device and browser. There is no sync or backup, and clearing site data wipes everything.
- **Emoji pictures:** rendering differs per OS, and a few newer emoji (🪟 🪀) may not exist on older devices.
- **Kid-facing UI:** must work for a non-reader. Use big tap targets, pictures and icons over text, and no reliance on audio instructions.
- The standalone `index.html` already has `<!doctype>`, a viewport meta and safe-area padding. (The Artifact version omits them because claude.ai adds its own skeleton.)

## Open items and assumptions to verify

- **Kern 4 and Kern 6 letters are guesses.** The chart says "vraag de juf welke". Currently Kern 4 = w, o, a, u and Kern 6 = g, ui, f, ei, j, au, ch. Kern 7 = ng, nk, sch and Kern 8 = c, x, y are also assumptions. Kern 9–11 add no new graphemes (longer words and sentences).
- Clocks: "half 3" means 2:30, as in Dutch.
- The word list (~108 words) is small, and the early levels are thin. Start + Kern 1 has only 8 picture words (vis, kip, aap, kaas, raam, vaas, kaars, kers).
- Difficulty and pace are untested with a real kid.

## Ideas for next steps (not yet agreed)

- Test with Marim and tune difficulty, round length and reward balance.
- More words per kern, especially Start to Kern 3. Use the real VLL word lists if the owner can provide them.
- Recorded letter *sounds* for a "which sound do you hear" exercise.
- Build-world goals and quests (e.g. "build a farm: 3 animals and a fence"), naming the village, day/night.
- Export/import of progress and recordings (backup or move to a new phone).
- Turn it into an installable PWA (manifest + service worker, offline). Later maybe a native app (the project description mentions "web app / native mobile app").
- Split `index.html` into modules once it grows. Add a small test harness for generators (start from `tools/check-generators.js`).
- An adaptive mode that moves a kid up or down automatically instead of only suggesting it.

## Files

- `index.html`: the whole app.
- `docs/curriculum-groep3.png`: the year overview (VLL kernen and WIG blokken per month) the curriculum is based on.
- `docs/curriculum-groep3.md`: text transcription of that chart. Read this instead of the image.
- `tools/check-generators.js`: generator smoke test.
- `README.md`: short human-facing intro.
- `CLAUDE.md`: points to this file.
- `.nojekyll`: tells GitHub Pages to skip Jekyll.
