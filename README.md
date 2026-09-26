# EchoVerse: The World That Remembers You

A small browser-based narrative game where every choice you make becomes a memory — and the village of Emberfall never forgets it.

## Game Concept

You arrive in Emberfall as a stranger. Five characters live there, each with their own trust in you, starting neutral. Every meaningful action you take — helping, stealing, protecting, learning, investigating, or simply talking — is recorded as a **memory** attached to that character. Memories change trust, trust changes dialogue, and word of what you've done can spread to other villagers even if they weren't there to see it. After six meaningful actions, Emberfall renders its verdict on who you turned out to be.

The core loop:

```
Player Action → Memory → Relationship Change → World Reaction → Future Gameplay
```

## The Villagers

| Name | Role | Available actions |
|---|---|---|
| Mira | Gardener | Talk, Help, Steal, Investigate |
| Rowan | Blacksmith | Talk, Help, Steal, Protect |
| Nia | Scholar | Talk, Learn, Investigate, Help |
| Kael | Village Guard | Talk, Protect, Investigate, Help |
| The Elder | Leader of Emberfall | Talk, Help, Investigate, Learn |

There is also a global **Explore** action, not tied to any one villager, which reveals a piece of Emberfall's lore each time you use it.

## How the Memory System Works

Each NPC is stored as a small object:

```js
{
  name: "Mira",
  trust: 50,
  fear: 0,
  memories: []
}
```

When you act on an NPC, their `trust` and `fear` values shift by fixed amounts for that action (e.g. Help: `trust +15`, Steal: `trust -20, fear +6`), and a first-person memory line is pushed into their `memories` array (e.g. *"Mira remembers the stranger stealing from them."*). That line is also written to the game-wide Memory Log so you can see everything the village has recorded about you, oldest to newest.

Dialogue is never random — `getDialogueLine(npc)` reads the NPC's current `trust`/`fear` and returns one of four fixed tiers of dialogue, so what a character says to you is a direct function of what you've done to them.

**Help** and **Steal** additionally trigger `spreadGossip()`: each of the *other* four NPCs has a chance to "hear" about the event, gain their own memory line about it (*"Kael heard that the stranger stole from Rowan."*), and adjust their trust slightly — so a single action can ripple across the whole village, not just the person it happened to.

After six meaningful actions, `triggerEnding()` averages trust across all five NPCs and shows one of three endings:

- **The Trusted Stranger** — average trust ≥ 62
- **The Unfinished Echo** — average trust between 39–61
- **The Name People Whisper** — average trust ≤ 38

The ending screen also surfaces the most recent memory each NPC holds of you, so the ending feels earned rather than just a number.

## Technology Used

- **HTML** — single-page structure (`index.html`)
- **CSS** — dark, cinematic, fully responsive layout with no frameworks (`style.css`)
- **Vanilla JavaScript** — all game logic, state, and rendering, no libraries (`script.js`)

No build step, no server, no database, no API keys, no login. It runs entirely in the browser.

## Files

```
index.html    — page structure and layout
style.css     — dark cinematic visual design, responsive/mobile rules
script.js     — NPC data, memory system, dialogue logic, endings
README.md     — this file
```

## Running Locally

1. Download or clone the project folder so `index.html`, `style.css`, and `script.js` are together in one directory.
2. Double-click `index.html`, or right-click → **Open with** → your browser.

No terminal, no `npm install`, no local server required — though if your browser blocks local file access for any reason, you can also serve it with any static server, e.g. `python3 -m http.server` from inside the folder, then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Add `index.html`, `style.css`, and `script.js` to the root of the repository (or to a `/docs` folder — your choice, see step 4).
3. Commit and push:
   ```
   git init
   git add index.html style.css script.js README.md
   git commit -m "EchoVerse: initial release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
4. On GitHub, go to **Settings → Pages**. Under **Build and deployment**, set **Source** to "Deploy from a branch," pick the `main` branch, and select either `/ (root)` or `/docs`, matching where you placed the files.
5. Save. GitHub will publish the site at:
   ```
   https://<your-username>.github.io/<your-repo>/
   ```
6. Wait a minute or two for the first deployment, then open the link — the game should load and be fully playable with no further setup.

## AI-Assisted Development Approach

This project was built in stages, using AI prompting at each step:

1. **Game concept generation** — defining the core mechanic (action → memory → relationship → world reaction → ending) and the small-village setting.
2. **Game architecture** — deciding on a plain data model per NPC (`trust`, `fear`, `memories`), a central game-state object, and a single-page, three-panel layout (village / dialogue / memory log).
3. **Gameplay implementation** — wiring village NPC cards, action buttons, and the six-action game loop that leads to an ending.
4. **Memory-system implementation** — the per-NPC memory array, the memory phrase templates, the gossip-spread function, and the trust-based dialogue tiers.
5. **UI/UX improvement** — dark cinematic theme, trust bars, memory toasts, responsive grid layout for mobile.
6. **Bug fixing** — clamping trust/fear to valid ranges, guarding against actions after game-over, verifying every button maps to a real handler.
7. **Testing** — manually walking through all three ending paths (helping-heavy, stealing-heavy, mixed) and confirming the memory log and ending summary reflect the choices made.
8. **Final polish** — toast notifications, lore reveals on Explore, ending modal with per-NPC memory highlights.

## Suggested Prompts for a Competition Write-Up

These are representative of the prompt-engineering process behind this build, useful for a project PDF:

- "Design a narrative game mechanic where NPCs remember specific player actions and change their dialogue accordingly — describe the data structure."
- "Given this NPC memory system, write the trust-based dialogue tiers so that what an NPC says is a direct function of their trust and fear values."
- "Add a gossip mechanic so that helping or stealing from one NPC has a chance to affect other NPCs who weren't present."
- "Review this game loop for bugs: unclamped trust values, dead buttons, and endings that can't be reached."
- "Redesign the UI to feel like a dark, cinematic narrative game rather than a form-based demo, using only CSS."

## Notes

- All visuals are emoji, CSS, and typography — no external images, fonts, or copyrighted assets.
- The game works fully offline once the three files are loaded; it makes no network requests.
- Click **New World** at any time to reset all NPCs, memories, and progress.
