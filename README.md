# DOMAIN

**Learn to build the web by playing inside it.**

DOMAIN is a 3D platformer where every level is a real web page. The page is laid out by the browser, measured, and raised into a floating world: each element becomes a block you can walk on. Every level starts broken. You learn one idea, fix the HTML, CSS or JavaScript, and walk across what you built.

As you finish lessons, you also build a real website: the **Anthill Bakery**. It starts as a blank page and ends as a styled, laid-out, interactive site.

## The course

120 lessons in four chapters, taught from zero:

| Chapter | Lessons | What you learn |
| --- | --- | --- |
| 1 · HTML | 20 | Elements, attributes and nesting; semantic sections, headings, lists, links, images, forms, validation, tables, the `<head>`, accessibility |
| 2 · CSS | 38 | Selectors and the cascade, specificity, the box model, units, `calc`/`clamp`, colour, positioning, `z-index`, overflow, Grid basics, backgrounds, typography, custom properties, transitions |
| 3 · Flexbox | 12 | Container vs item, both axes, wrap, every alignment property, grow/shrink/basis, the `min-width: auto` gotcha, real layout patterns, and when to use Grid |
| 4 · JavaScript | 50 | Variables and types, control flow, functions, scope, closures and `this`, arrays and objects, JSON, the DOM, events and delegation, promises, `async`/`await`, `fetch`, loading and error states, modules, storage, debugging, classes, `Map`/`Set`, regex and dates |

Every lesson has a plain-language explanation, an annotated example, step-by-step instructions, a reference card, a five-step hint ladder, a debrief and a quiz.

## How it works

- **The world is the document.** Your code runs in a hidden, same-origin iframe. The browser lays it out, and `getBoundingClientRect()` / `getComputedStyle()` turn each element into a platform. CSS is never re-implemented: if the browser renders it, the world matches it.
- **Your code decides the geometry.** Levels are designed around the character's measured reach (about 200px across, 100px up), so a broken page is clearly impossible to cross and a fixed one is clearly easy. The code decides whether you get across, not your timing.
- **JavaScript runs for real.** Code runs in the level's page, with guards against infinite loops, friendly error messages, a console panel, and a few safe stand-ins:
  - `import`/`export` between module files provided by the level;
  - a pretend server for `fetch`, with real status codes and delays;
  - sandboxed `localStorage` and `sessionStorage`.
- **Web page view.** Press **F** to swap the 3D world for the flat page it's built from.

## Playing

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and choose **Start dreaming**, or go straight to `/play`.

| Key | Action |
| --- | --- |
| A / D or ← / → | Move |
| Space | Jump |
| V | Switch between 3D and side view |
| F | Show the flat web page |
| R | Respawn at the start |
| M | World map |
| B | The website you're building |
| Ctrl/⌘ + Enter | Run JavaScript |

Right-drag to look around, scroll to zoom, and click any block to inspect it like DevTools.

> **Review mode:** all lessons are currently unlocked. To restore in-order unlocking, set `UNLOCK_ALL_LEVELS` to `false` in `lib/store.ts`.

## Project layout

```
app/                    Next.js routes: the landing page and /play
components/
  HiddenStage.tsx       the iframe page the world is measured from
  Scene3D.tsx           the 3D world (React Three Fiber)
  Player.tsx            character, camera and controls
  CodePanel.tsx         Learn / HTML / CSS / JS tabs (CodeMirror 6)
  Overlays.tsx          lesson intro, debrief, quiz, map, chapter complete
  SiteBuild.tsx         "your website grew", My Site, landing showcase
  TitleScreen.tsx       landing page (with DreamSky.tsx)
  WorldMap.tsx          the course map
lib/
  levels.ts             chapters, plus the HTML, CSS and Flexbox lessons
  jsLevels/             the 50 JavaScript lessons and their world kit
  jsRun.ts              JavaScript runner: loop guards, modules, fetch, storage
  physics.ts            the box-based platformer controller and its reach
  layout.ts, stage.ts   turning measured elements into world objects
  site.ts, siteJs.ts    the Anthill Bakery site, one piece per lesson
  store.ts              game state and saved progress (Zustand)
```

## Adding a lesson

A lesson is one object in `lib/levels.ts` (or `lib/jsLevels/` for JavaScript). It has:

- **Content:** `lesson`, `example`, `steps`, `reference`, five `hints`, a `debrief` and a `quiz`.
- **The starting files:** `html`, `css` and optional `js`. One of them is what the learner edits.
- **A `rubric`** that decides whether the solution earns the gold seal.
- **Optional extras** for JavaScript lessons: `modules`, `api` and `storage`.

Design the broken state to be well beyond the character's reach and the fixed state well within it. Then add the lesson's piece of the website to `lib/site.ts` or `lib/siteJs.ts`.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · React Three Fiber, drei and postprocessing · CodeMirror 6 · Zustand · Tailwind CSS 4 · acorn (JavaScript parsing) · TypeScript

```bash
npm run build   # production build
npm run lint    # ESLint
```

## License

© 2026 Shreyas. All rights reserved. See [LICENSE](LICENSE).
