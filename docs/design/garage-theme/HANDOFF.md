# Garage theme — implementation handoff

Build the approved "Notes from the garage" theme into this Astro site. The design is
final; this doc is the spec. A working HTML prototype sits next to it and is the
visual source of truth.

## 1. Reference prototype

`docs/design/garage-theme/prototype/` (static, not part of the site build):

| File         | What it is                                                                      |
| ------------ | ------------------------------------------------------------------------------- |
| `index.html` | The approved homepage (variant "J2"). Page CSS, markup and interaction script.  |
| `base.css`   | Shared tokens, header/footer, section label styles.                             |
| `garage.js`  | Isometric drawing kit + project/post/build data (`window.KM`).                  |
| `plan.js`    | Orthographic plan drawing kit (`window.KMPlan`) used for the garage floor plan. |

Run it: `cd docs/design/garage-theme/prototype && python3 -m http.server 4321`, open
`http://127.0.0.1:4321/`. Hover the shop log rows, plan plates, keyed notes and cards to
see the linking behavior. Toggle Dark in the nav.

The prototype is reference code, not production code: it renders everything with
client-side JS and hard-codes sample data. Port the look and behavior, not the structure.

Delete `docs/design/garage-theme/` (or add it to `.prettierignore` and the ESLint
`ignores`) before running `npm run validate`, otherwise Prettier and ESLint will flag the
prototype files.

## 2. Page anatomy (homepage, top to bottom)

1. **Header** — `KELLEN MILLER` (mono, 600, uppercase, letter-spaced) left; nav right:
   `WRITING  PROJECTS  ABOUT` (mono uppercase 13px) + a pill `DARK`/`LIGHT` theme toggle.
   Current page link gets a 2px accent underline.
2. **Hero** — two columns (5fr / 7fr, stacks under 900px):
   - Left: stats line (`PROJECTS 06 · COMMITS, LAST 12 MO 221+ · POSTS 04`, mono 12px
     uppercase, values in ink), `<h1>` "Notes from the **garage**." (mono 500, uppercase,
     clamp(36px, 5.4vw, 76px), tight tracking; "garage" in accent), one-paragraph intro.
   - Right: **Shop log** — header row `SHOP LOG … NOTES + BUILDS · NEWEST FIRST`, then up to
     8 rows newest first, mixing:
     - **Notes** (blog posts): date · `NOTE` outline badge (accent) · bold title link · tag.
     - **Builds** (latest real commit per project): date · project number plate · commit
       summary · project name. Hovering a build row triggers the project focus (§5).
3. **The garage** section (label `THE GARAGE ┆┆┆┆ PLAN VIEW · 1:50`):
   - Left 7fr: top-down **floor plan** SVG (walls hatched, roller-door opening dashed,
     40-unit floor grid, dashed accent pit box, dimension lines `7.60 M` / `4.80 M`, grid
     bubbles A–C and 1–3, north arrow). Each project is drawn as its object; a small
     **number plate** with a short leader sits on each object. Under the plan: **Keyed
     notes** — header `KEYED NOTES … GARAGE — PLAN VIEW · 1:50`, two-column list of
     plate · OBJECT (uppercase) · `name · lang`.
   - Right 4fr: **Readout** panel (aria-live) showing the focused project: `#NN`, entry,
     object, spec, lang, commits/yr meter. Idle state: "Hover an entry" and dashes. A short
     helper line under it.
4. **Projects** section (label `PROJECTS ┆┆┆┆ 06 ENTRIES`): 3×2 grid (2 cols < 900px, 1 col
   < 560px) of cards, 1px gaps on a line-colored background. Each card:
   - Drawing area: isometric vignette of the project's object on a soft radial glow;
     number plate top-left, object name top-right (mono 11px uppercase faint); bottom-left
     caption `FIG. NN — <spec>` on a bg-colored chip; bottom-right tick ruler; small
     registration crosses mid-left/right.
   - Caption area (dashed top border): name (mono 600 17px), description, footer row
     `lang · dotted commit meter · N commits`.
   - Whole card links to the GitHub repo.
5. **Writing** section (label `WRITING ┆┆┆┆ 04 POSTS`): log list — `YYYY.MM.DD` · title
   (mono 500 17px) + description · tag right-aligned; dashed row dividers.
6. **Footer** — `© 2026 Kellen Miller` left; `GitHub  RSS` right.

Section labels: mono 12px uppercase faint, with a tick-mark rule filling the space between
the left and right text.

Post page (`BlogPost.astro`) is not prototyped in J2. Build it in the same language:
header, a meta line (`TAG · YYYY.MM.DD · N MIN`, accent tag), mono uppercase-free title
(mono 600, clamp 30–52px), description as a muted dek, ~680px prose column in Instrument
Sans 17.5px/1.72, mono code blocks on `--bg2` with a `[ file ]` label, accent-bordered
blockquotes, same footer. Optional: a hero figure slot for an isometric diagram.

## 3. Design tokens

Fonts (Google Fonts or self-hosted via Astro's `fonts` config — prefer the existing
`fontProviders` setup; drop Atkinson):

- `--mono`: JetBrains Mono 300–800 — headings, nav, labels, data, code.
- `--text`: Instrument Sans 400/500/600 — body copy, descriptions.

Light theme is the default (`<html data-theme="light">`); dark via toggle.

| Token         | Light     | Dark      | Use                            |
| ------------- | --------- | --------- | ------------------------------ |
| `--bg`        | `#eeede9` | `#0e0f10` | page                           |
| `--bg2`       | `#e4e3de` | `#141517` | code, inline code              |
| `--panel`     | `#f6f5f1` | `#121315` | readout panel                  |
| `--ink`       | `#151515` | `#ecebe7` | text, plates                   |
| `--mute`      | `#55565a` | `#9b9b97` | secondary text                 |
| `--faint`     | `#8b8c8f` | `#5e5f62` | labels, meta                   |
| `--line`      | `#d3d2cc` | `#25262a` | rules, borders                 |
| `--acc`       | `#7a3cf0` | `#9d6bff` | accent fills (purple)          |
| `--acc-ink`   | = `--acc` | = `--acc` | accent text                    |
| `--on-acc`    | `#fff`    | `#fff`    | text on accent fills           |
| `--grid-dot`  | `#d3d2cc` | `#1d1e21` | graph-paper dots, 22px grid    |
| `--card-glow` | `#f8f7f4` | `#17181a` | card drawing background center |
| `--card-on`   | `#e6e5df` | `#17181b` | focused card background        |
| `--il-line`   | `#1b1b1b` | `#cfcec8` | illustration linework          |
| `--il-top`    | `#fbfbf9` | `#2b2c30` | illustration top faces / floor |
| `--il-left`   | `#e2e1dc` | `#212225` | illustration left faces        |
| `--il-right`  | `#cfcec8` | `#18191b` | illustration right faces       |
| `--il-dark`   | `#bdbcb6` | `#0a0a0b` | shadows, openings              |

Body background: `radial-gradient(circle at 1px 1px, var(--grid-dot) 1px, transparent 1.3px)`
at `22px 22px`. Side gutter `--pad: clamp(18px, 4vw, 48px)`.

**Number plates**: rounded rect (radius 6, 46×32 in cards; 34×22 on the plan and in lists),
`--ink` fill with `--bg` text, mono 800. The plate of the project with the most commits
uses `--acc` fill with `--on-acc` text ("hot").

## 4. Data

Create one typed source of truth for projects (e.g. `src/data/projects.ts`). Values from
the prototype (`garage.js` → `KM.projects`, specs in `index.html`):

| n   | id / repo      | lang       | object                   | spec (figure caption)    |
| --- | -------------- | ---------- | ------------------------ | ------------------------ |
| 01  | celerity       | Rust       | Rotary engine on a stand | 13B twin rotor · CAN     |
| 02  | venae-machinae | TypeScript | Harness board            | harness + fluid · no CAD |
| 03  | deburr         | Go         | Bench grinder            | Go + TS · no models      |
| 04  | chief          | TypeScript | Pit radio                | discord · voice · sqlite |
| 05  | sup            | Python     | Tool chest               | yaml jobs · rich TUI     |
| 06  | skills         | Python     | Pegboard                 | ~/.agents/skills         |

Descriptions are in `KM.projects[].desc`. Only public repos; rx7, homeserver, alloy and
dotfiles are private and must stay off the site.

Build-time GitHub data (replace the hard-coded numbers):

- **Commits / yr** per project: commits by `kellen-miller` in the last 365 days
  (`GET /repos/kellen-miller/{repo}/commits?author=kellen-miller&since=…`, paginate; the
  prototype's `100` for chief is a page cap, show the real number).
- **Builds** for the shop log: latest commit per project whose subject is not `ci:`,
  `chore:`, `build:` or a merge commit; show a cleaned, sentence-case summary.
- Hero stats derive from the same data (project count, summed commits, post count).
- Use `GITHUB_TOKEN` when present (CI), fall back to committed snapshot values when the API
  is unavailable so local builds and tests are deterministic. Tests must not hit the network.

Posts come from the existing `blog` content collection. Add an optional `tag` field to the
schema (used in the log, writing list and post meta). The current sample posts are
placeholders; the prototype's post titles are also fake — do not ship them as content.

## 5. Interaction

- **Focus linking**: hovering/focusing any of — shop-log build row, plan plate, keyed note,
  project card — sets one focused project id. While focused: the object and its plate on
  the plan get class `on`, other objects/plates dim to ~18% opacity, the matching keyed
  note/card/log row highlight (card bg `--card-on`, title accent), the readout fills in.
  Leaving clears it. Clicking a plan plate scrolls its card into view.
- **Motion only on hover**: the focused project's object animates — grinder sparks flicker
  (deburr), radio LED blinks (chief), the engine's rotor turns (celerity; SMIL
  `animateTransform` started/stopped with `beginElement`/`endElement`). Nothing moves at
  rest. No motion at all under `prefers-reduced-motion: reduce` (check in JS for SMIL).
- **Theme toggle**: persists in `localStorage` (`km-theme`), wrapped in try/catch. Apply
  the saved theme in an inline `<head>` script before paint to avoid a flash.
- Keyboard: cards are links (focus-visible outline in accent); readout is `aria-live`.

## 6. Drawing — how to port

The illustrations are generated from world coordinates (u = left→right, v = back→front,
z = up). Port `garage.js` (isometric `Iso`, objects `obj.*`, `vignette`) and `plan.js`
(`plan`, `dim`, `bubble`, `north`, `tag`) so the SVG is **rendered at build time** in Astro
components (static markup in the HTML), not built in the browser. Keep only a small client
script for focus linking, motion and the theme toggle.

All colors come from CSS custom properties (`var(--il-*)`, `var(--acc)`), so both themes
work without re-rendering. Every project object must be wrapped in
`<g data-obj="{id}">` in every drawing so focus linking can find it.

Plan sheet in the prototype: `KMPlan.plan(art, 112, 104, 1.22)` with
`viewBox="28 18 604 460"`; plate offsets per project are in `index.html` (`tagAt`).

## 7. Suggested component split

Follow the user's rules in `~/.claude/CLAUDE.md`: no `utils`/`helpers`/`common` files —
put code where the domain concept lives; prefer direct, cohesive code over many tiny
single-use helpers; no inline lint suppressions.

- `src/layouts/BaseLayout.astro` — head, fonts, tokens, theme bootstrap, header, footer.
- `src/components/Header.astro`, `Footer.astro`, `ThemeToggle.astro`.
- `src/components/ShopLog.astro` — merges posts + builds.
- `src/components/garage/GaragePlan.astro` (+ keyed notes, readout).
- `src/components/garage/ProjectCard.astro` and the isometric drawing module they share
  (e.g. `src/components/garage/drawing.ts` for `Iso`, objects, plan).
- `src/data/projects.ts` (+ build-time GitHub fetch next to it).
- Update `src/pages/index.astro`, `src/pages/blog/index.astro` (writing log),
  `src/layouts/BlogPost.astro`, `src/pages/about.astro`, `src/pages/404.astro`,
  `src/consts.ts` (`SITE_DESCRIPTION`).
- Remove `src/styles/global.css` Bear Blog styles and the Atkinson fonts once replaced.

## 8. Tests and verification

- `tests/site.spec.ts` asserts the home `h1` is "Kellen Miller"; update it to the new
  heading and add coverage for: shop log renders notes and builds, garage plan has six
  `data-obj` groups, hovering a card sets the readout, theme toggle persists, and axe
  passes in both themes.
- Run `npm run validate` (Prettier, ESLint, `astro check`, build, Playwright) and make it
  pass. Check 400px width: no horizontal scroll, hero/garage stack, cards go to one column.

## 9. Repo workflow

- Branch from `main` (e.g. `feat/garage-theme`); push with
  `git push origin HEAD:refs/heads/feat/garage-theme`.
- Conventional Commits, subject ≤ 50 chars, imperative.
