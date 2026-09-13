# DOMAIN — Platform Blueprint

*A 3D world that is literally rendered from an HTML document. You learn HTML, CSS and JavaScript by shaping space with real code.*

**Working title:** DOMAIN (DOM + domain — the world you shape). Alternatives: *Cascade*, *Weaver*, *The Renderer*, *Markup*.

**Status:** Design blueprint, pre-build.
**Spine mechanic:** World-is-the-DOM.
**Scope:** Full platform.

---

## 1. One-paragraph pitch

DOMAIN is a browser-based learning platform where the 3D game world is generated directly from a real HTML document, styled by real CSS and animated by real JavaScript. Nesting becomes spatial containment. `flex-direction: column` genuinely stacks the platforms you are standing on. `position: absolute` detaches a bridge and leaves it floating. `overflow: hidden` clips the region and you fall out of the world at its edge. The learner is never manipulating a metaphor for CSS — they are writing the same CSS they would write for a website, and the render target happens to be a playable space instead of a flat page. Every skill transfers on day one. Each chapter is framed as a fable whose moral is the programming principle, and an in-world AI tutor that can read the learner's actual code, DOM and past mistakes answers doubts on a hint ladder rather than handing over solutions.

---

## 2. Why this doesn't exist yet

| Platform | What it does well | The gap |
|---|---|---|
| The Odin Project | Rigorous curriculum, real projects, strong community | Text-heavy, high dropout, no feedback loop until you build the whole project |
| Scrimba | Interactive screencasts you can pause and edit inside | Still fundamentally "watch then mimic"; no failure states, no reason to care |
| freeCodeCamp | Huge free curriculum, certification | Fill-in-the-blank; learners pass tests without understanding |
| Flexbox Froggy / Grid Garden | Genuinely fun, memorable | One property set each, ~25 levels, then it ends. The frog is a metaphor — nothing transfers |
| Screeps | Real programming as a game, deep | Server-side JS only; nothing about DOM, CSS, or the browser |
| CSSBattle | Sharpens CSS intuition | Golf, not pedagogy. Rewards hacks over good practice |
| Codecademy / Boot.dev | Structured, gamified progress bars | Gamification is bolted on (XP, streaks) rather than being the learning itself |

**The unoccupied space:** nobody has made the browser's own rendering model the game world. Froggy's frog moves *because of* `justify-content`, but the frog is fiction. In DOMAIN there is no fiction layer between the code and the world — the world **is** the render.

**Design consequence:** this only works if we never lie. See §12, Inviolable Rules.

---

## 3. Core premise: the world is the document

Every level region is a real HTML document with a real stylesheet. The renderer walks that document and produces 3D geometry. There is no separate "level file" — the level *is* the markup.

```
level.html  ──┐
level.css   ──┼──► Parser ──► Layout (real CSS engine semantics) ──► Scene graph ──► R3F render
level.js    ──┘                                                          │
                                                                          └──► Physics colliders
```

The learner edits `level.css` (and later `level.html` and `level.js`) in a panel beside the viewport. On every valid change the world re-renders live and the player character is re-settled onto the new geometry. Breaking your own level is expected and is itself a lesson.

---

## 4. The mapping (the heart of the product)

This table is the specification. Anything not on this table does not exist in the game.

### 4.1 HTML → structure of space

| Markup | World meaning |
|---|---|
| Element | A solid object, room, or surface |
| Nesting | Spatial containment — a child exists *inside* its parent's volume |
| Sibling order | Order in the layout flow, left-to-right or top-to-bottom |
| `<section>`, `<article>`, `<nav>`, `<main>` | Named, navigable regions. The map only shows semantic regions; a world made of `<div>`s has no map |
| `<a href>` | A literal portal to another region |
| `<button>`, `<input>`, `<form>` | Interactive machinery — levers, dials, gates |
| `alt` text, `aria-label` | The only way NPC guides can perceive an object. Unlabelled objects are invisible to them |
| `id` / `class` | The "true name" of a thing. Required to address it from CSS or JS |
| Void elements (`<img>`, `<hr>`) | Objects that cannot contain anything |

### 4.2 CSS → the physics of space

| Property | World meaning |
|---|---|
| `width` / `height` | Literal dimensions of the surface |
| `padding` | Inner walkable margin inside a room, inset from its walls |
| `border` | The wall itself, with thickness. `border: none` means you can walk off the edge |
| `margin` | Forced empty gap between objects — an unbridgeable void |
| `box-sizing` | Whether padding eats into your platform or grows it. Causes real, visible falls |
| `display: block` | Full-width slab, stacked |
| `display: inline` | Flows in a line, ignores height — a thin unusable ledge. Teaches *why* inline is wrong here |
| `display: flex` | The parent arranges its children as a moving conveyor of platforms |
| `flex-direction` | Axis of the platform chain: horizontal walkway vs vertical climb |
| `justify-content` / `align-items` | Where the platforms sit along and across the axis — directly determines reachability |
| `gap` | Jump distance between platforms. Tunable difficulty as a *side effect of correctness* |
| `flex-grow` / `shrink` / `basis` | Platforms that expand or contract as the region resizes |
| `display: grid` | A structured floor plan. `grid-template-areas` is a literal blueprint |
| `grid-column` / `grid-row` span | Objects that occupy multiple cells — bridges across the plan |
| `position: static` | Stays in flow |
| `position: relative` | Nudged from its slot, but its hole in the flow remains — a visible ghost gap |
| `position: absolute` | Detached, floats free of the flow, anchored to nearest positioned ancestor |
| `position: fixed` | Locked to the camera. A HUD object, or a platform that follows you |
| `position: sticky` | Sticks at a scroll boundary — an elevator that parks at a floor |
| `z-index` + stacking context | Which of two overlapping bridges you can actually stand on |
| `overflow: hidden` | Hard clip. The world ends at that boundary. You fall |
| `overflow: scroll` | The region extends beyond its frame and must be traversed to be seen |
| `transform: translate/rotate/scale` | Literal transformation of the object |
| `transform-origin` | The pivot a rotating bridge swings around |
| `transition` | Smooth movement between two states. Timing is the window you jump through |
| `animation` / `@keyframes` | Patrolling platforms, cycling hazards, rhythm sections |
| `opacity: 0` vs `visibility: hidden` vs `display: none` | Invisible-but-solid, invisible-but-solid, and gone entirely. The difference is a *puzzle*, not a footnote |
| `pointer-events: none` | Objects you pass straight through |
| `@media` queries | The world changes shape when the region's frame is resized. Responsive design as a physical event |
| CSS custom properties | Global levers that reshape many objects at once |
| `calc()` | Derived dimensions |
| `:hover`, `:focus`, `:active` | Proximity and interaction states |
| `::before` / `::after` | Conjured objects with no markup of their own |
| Specificity & cascade | Competing rules. Visible in the inspector as which rule "won" the object |
| `!important` | Works, but permanently marks the object with a scar and is penalised in level scoring |

### 4.3 JavaScript → the verbs

| Concept | World meaning |
|---|---|
| `querySelector` / `getElementById` | Telekinesis — reaching out and grabbing a named object |
| `classList.add/remove/toggle` | Changing an object's nature at runtime |
| `style` mutation | Direct, brute-force shaping |
| `createElement` + `append` | Conjuring new matter into the world |
| `remove()` | Unmaking |
| `addEventListener` | Pressure plates, tripwires, levers |
| Event bubbling / capture | A signal travelling up through nested rooms. Teaches delegation physically |
| `preventDefault` / `stopPropagation` | Blocking a signal mid-flight |
| Variables & scope | What a region knows about itself |
| Closures | What a character carries out of a room after the room is gone |
| Arrays | Inventory and ordered sequences |
| Objects | Entities with properties |
| Functions | Reusable spells |
| Loops | Generating repeated structures — staircases, colonnades |
| Conditionals | Gates that open on a state |
| `setTimeout` / `setInterval` | Delayed and repeating world events |
| Promises / `async`-`await` | Time manipulation. Awaiting is literally waiting in-world |
| `fetch` | Summoning matter from outside the world |
| `try/catch` | Warding against collapse |
| Modules | Sealed regions with explicit doors (exports) |

---

## 5. The fable layer

Each chapter opens with a short illustrated fable (60–90 seconds, read or listened to) whose moral is the chapter's principle. The story is the mnemonic, not decoration. The learner should recall the fable at 2am while debugging something real.

| Ch. | Fable | Teaches |
|---|---|---|
| 0 | **The Empty Room** | What a document is; elements, nesting, the tree |
| 1 | **The Village With No Names** | Semantic HTML. Everything is a `<div>`; a blind guide NPC cannot navigate. You fix it by naming things properly. Accessibility taught as empathy, not compliance |
| 2 | **The Boxes Within Boxes** | Box model, sizing, spacing, borders, `box-sizing` |
| 3 | **The Loudest Voice** | Specificity, the cascade, inheritance, why `!important` is a scar |
| 4 | **The River That Chose Its Banks** | Normal flow, `display`, block vs inline, why layout fights you |
| 5 | **The Conveyor of Ants** | Flexbox, end to end |
| 6 | **The Architect's Blueprint** | Grid, template areas, two-dimensional thinking |
| 7 | **The Floating Tower** | Positioning, stacking contexts, `z-index` |
| 8 | **The World That Would Not Fit** | Responsive design, media queries, fluid units, mobile-first |
| 9 | **The Clockwork Garden** | Transitions, transforms, keyframes, motion design and restraint |
| 10 | **The First Word** | JS fundamentals: values, types, variables, operators, control flow |
| 11 | **The Hands That Reach** | DOM selection and mutation |
| 12 | **The Listening Stones** | Events, bubbling, delegation |
| 13 | **The Thing You Carried Out of the Room** | Scope, closures, `this` |
| 14 | **The Shape of a Thing** | Objects, arrays, methods, iteration, immutability |
| 15 | **The Two Clocks** | The event loop, sync vs async, callbacks → promises → `async/await` |
| 16 | **The Messenger From Beyond** | `fetch`, APIs, JSON, error states, loading states |
| 17 | **The Collapse** | Debugging, DevTools, reading stack traces, the Rewind (see §7.5) |
| 18 | **The Many Hands** | Git, modules, project structure, deployment |
| 19 | **The World You Leave Behind** | Capstone. Build and ship a real site |

**Curriculum alignment:** the ordering deliberately tracks The Odin Project's Foundations path, with Scrimba's "edit inside the lesson" immediacy applied to every single step. Where Odin says "read MDN on flexbox then build a card layout", DOMAIN says "here is a broken conveyor, here is MDN in the side panel, the level is the card layout."

---

## 6. Lesson loop

Every level follows the same five-beat loop. This is the product's rhythm and should never vary.

1. **Arrive.** You are dropped into a region. Something is visibly wrong or incomplete. The goal is spatial and obvious without being told — reach the door, connect the bridge, make the room habitable.
2. **Inspect.** The code panel opens. An in-world inspector lets you point at any object and see which element it is and which rules are applied to it, mirroring DevTools exactly.
3. **Hypothesise and edit.** You change code. The world re-renders live, within ~100ms.
4. **Test physically.** You walk it. You either make the jump or you don't. Success is not a green checkmark from a hidden test — it is a body reaching a door.
5. **Consolidate.** A 20-second debrief: what property you used, the general rule, one real-world site where this exact pattern appears, and the fable's line repeated.

**On success criteria:** the primary win condition is always physical (reach the goal). A secondary rubric scores *quality* — did you use flexbox as intended or did you brute-force it with absolute positioning and magic numbers? Both let you pass. Only one gives you a gold seal. This mirrors real work, where bad code also "works."

---

## 7. Core systems

### 7.1 Renderer

Walks the parsed document and produces a scene graph. Key requirement: **layout must be computed by the browser's real engine, not by us.** We render an off-screen, hidden, real DOM tree from the learner's markup, read back `getBoundingClientRect()` and computed styles for every node, and map those boxes into 3D. This guarantees the physics of the world are the actual CSS engine's behaviour, including all its edge cases, and it means we can never accidentally teach a false rule.

- 2D layout box → 3D slab. `x → x`, `y → -y` (screen y is inverted), depth from stacking context / `z-index`.
- `transform` matrices are read from computed style and applied directly.
- Animations are tracked by sampling computed style per frame, so keyframes and transitions are truly live.
- Camera modes: third-person traversal, orbit inspect, and a "flatten" toggle that morphs the 3D world back into the literal 2D web page it is. **The flatten toggle is essential** — it is the moment the learner sees the world was always a web page.

### 7.2 Editor

CodeMirror 6. Three tabs: HTML, CSS, JS. Features:

- Live re-render debounced at ~120ms.
- Inline MDN documentation on hover for any property.
- A "point at object → jump to its rule" bridge between viewport and editor, both directions.
- Locked regions: in early levels, most of the file is read-only and only the relevant lines are editable, widening as the learner progresses. By chapter 10 the whole file is open.
- No autocomplete of whole answers in early chapters. Muscle memory matters.

### 7.3 Sandbox

Learner JS runs in a Web Worker with a proxied, restricted DOM API surface.

- No network access except a whitelisted mock API used in chapter 16.
- Execution budget: hard timeout, instruction counter to kill infinite loops, memory cap.
- All DOM mutations are sent as a patch stream to the main thread, applied to the hidden real DOM, then re-read for layout. This keeps the worker cheap and the main thread authoritative.
- Errors are caught and surfaced in-world as a visible "collapse" event rather than a silent console line.

### 7.4 Inspector

An in-world DevTools clone. Point at any object, see:
- the element and its ancestors (breadcrumb, matching DevTools)
- the box model diagram overlaid on the actual 3D object
- the cascade: every rule that targeted this element, in specificity order, with overridden ones struck through

This is deliberately a 1:1 skill transfer to Chrome DevTools. The learner should be able to open real DevTools afterwards and recognise everything.

### 7.5 The Rewind

A scrubbable timeline over the last N seconds of world state and code execution.

- Records: every DOM mutation, every style recomputation, every JS statement executed with its local scope snapshot, every event fired.
- Scrubbing backwards replays the world visually *and* highlights the exact line executing at that tick, with a live variable panel.
- Primary use: you fell through the floor — scrub back to the frame where the floor's `height` became `0` and see which rule did it.
- Secondary use: the chapter 17 debugging curriculum is built entirely on this.

Implementation note: statement-level recording via an instrumenting transform (Babel plugin or equivalent) on learner JS inside the worker. Record to a ring buffer, cap at a few thousand steps.

### 7.6 The Tutor (AI)

An NPC that walks the world with the learner. Not a chat sidebar.

**Context sent per request:**
- current level id, objective, and expected concept
- the learner's full current HTML/CSS/JS
- a diff against the level's starting state
- the computed layout of the failing object(s)
- how long they have been stuck, and how many edits since last progress
- their historical error profile (which concepts they have repeatedly fumbled)
- the last N Rewind events if a collapse occurred

**Hint ladder.** The tutor never opens with the answer. It escalates only as the learner remains stuck:

1. **Notice** — "Look at the gap between the third and fourth platform. What decides that?"
2. **Question** — "You set `justify-content`. Which axis does that act on here, given your `flex-direction`?"
3. **Narrow** — "The problem is in the rule on `.walkway`, lines 12–15."
4. **Re-teach** — a 45-second re-explanation of the concept from a different angle than the fable used.
5. **Reveal** — the working line, with an explanation, and the level is marked as assisted. The concept is automatically queued for a later spaced-repetition callback (§8).

**Hard constraints on the tutor:** it must never invent CSS behaviour, never paste a full solution before rung 5, and must state plainly when the learner's approach is valid but non-idiomatic rather than calling it wrong.

**Free-form doubts.** The learner can ask anything at any time ("why is this called the box model?", "when would I actually use grid over flex?"). The tutor answers directly for conceptual questions and uses the ladder only for the current blocker. This is the doubt-solving pillar of the product.

### 7.7 Export to reality

At the end of each chapter, the region the learner built exports as a genuine standalone folder: `index.html`, `style.css`, `script.js`. It opens in a browser as a normal, working web page — because it always was one. Options to download, push to a connected GitHub repo, or one-click deploy.

This single feature kills the "I only learned the game" objection permanently, and it gives the learner portfolio artefacts from week one.

### 7.8 The Commons (shared world)

Finished chapter regions become visitable landmarks in a persistent hub world.

- Walk through other learners' solutions to the same level and see they solved it differently.
- Leave and receive annotations on specific lines, anchored in 3D space next to the object they concern.
- A curated gallery of exceptional builds.
- Reviewing others' code earns progression. Code review is a learned skill and nobody teaches it to beginners.

### 7.9 Sandbox Mode

An unbounded blank region. Full file access, no objective. Build whatever. This is where the learner discovers they can just... make things. Sandbox builds can be published to the Commons.

---

## 8. Progression and mastery

- **No XP treadmill.** Progression is unlocking regions of a map, which is spatial and meaningful.
- **Mastery model.** Each concept has a confidence score per learner, decaying over time. Below threshold, the concept reappears woven into a later level rather than as a flashcard.
- **Callback levels.** Chapter 12 will quietly require the chapter 5 flexbox skill. If confidence has decayed, the tutor proactively offers a refresher before the learner flounders.
- **Assisted flag.** Any level completed at hint rung 5 is flagged and guarantees a callback.
- **Streaks are optional and off by default.** Guilt is not a pedagogy.

---

## 9. Technical architecture

### 9.1 Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | SSR for marketing/content, API routes, good DX |
| 3D | React Three Fiber + drei | Declarative Three.js maps naturally onto a DOM-derived scene graph |
| Physics | Rapier (`@react-three/rapier`) | WASM, fast, deterministic enough, good character controller |
| Editor | CodeMirror 6 | Lighter than Monaco, better mobile story, easier to restrict regions |
| Sandbox | Web Worker + Comlink + instrumenting Babel transform | Isolation, and the transform enables the Rewind |
| State | Zustand | Minimal, works well outside React render tree (needed for the game loop) |
| Styling (app UI) | Tailwind | Speed |
| Backend | Next API routes + Postgres (Supabase) | Auth, progress, Commons, RLS |
| AI | Claude API, streamed | Tutor, code review, doubt answering |
| Realtime | Yjs + WebSocket (phase 4 only) | Commons annotations, co-op |
| Analytics | PostHog | Funnel and drop-off per level — critical for curriculum iteration |
| Hosting | Vercel + Supabase | Free tiers carry an MVP a long way |

### 9.2 Data flow per edit

```
keystroke
  → debounce 120ms
  → parse + validate (fail soft, keep last good render)
  → write to hidden offscreen DOM (real browser layout)
  → read back computed styles + rects for every node
  → diff against previous frame
  → patch R3F scene graph (reuse meshes, don't rebuild)
  → rebuild only changed physics colliders
  → re-settle player onto nearest valid surface
  → run objective evaluator
  → push frame to Rewind ring buffer
```

Performance target: 60fps traversal, under 150ms from keystroke to visible world change, on a mid-range laptop.

### 9.3 Data model (sketch)

```
users            id, handle, created_at, settings
progress         user_id, level_id, status, assisted, quality_score, attempts, completed_at
concept_mastery  user_id, concept_key, confidence, last_seen_at
submissions      id, user_id, level_id, html, css, js, published, created_at
annotations      id, submission_id, author_id, line_ref, element_ref, body
tutor_sessions   id, user_id, level_id, rung_reached, transcript, tokens
levels           id, chapter, slug, objective, concepts[], starter_files, rubric
```

### 9.4 Security

- Learner JS never touches the main thread directly.
- CSP locked down; no `eval` in app code.
- Published Commons submissions are sanitised and rendered only inside the same worker sandbox, never as raw HTML in another user's page. Treat every submission as hostile.
- Rate-limit tutor calls per user; cap tokens per level.

---

## 10. Accessibility

The product teaches accessibility in chapter 1, so it must be exemplary itself.

- Full keyboard traversal of the 3D world; no mouse-only mechanics.
- A **2D Mode** that is a complete alternative presentation: the level as a real, flat, navigable web page with the same objectives. Not a lesser fallback — a first-class equal path. This also serves low-end devices and people who get motion sick.
- `prefers-reduced-motion` respected throughout.
- Screen-reader-navigable editor and inspector.
- Captions and transcripts for all fables.
- No colour-only signalling anywhere.

---

## 11. Screens

1. **World Map** — chapters as regions, progress visible spatially
2. **Level View** — viewport (60%) + editor (40%), collapsible, with inspector drawer and tutor summon
3. **Rewind View** — timeline scrubber, code with execution pointer, variable panel
4. **Debrief** — post-level consolidation, quality rubric, real-world example
5. **Commons** — hub world, gallery, annotation feed
6. **Sandbox** — blank region, full editor
7. **Profile** — concept mastery heatmap, exported projects, review contributions

---

## 12. Inviolable rules

These exist because the entire premise dies if any one is broken.

1. **Never invent a CSS behaviour.** If the browser does not do it, the world does not do it.
2. **Never fudge a mapping to make a level more fun.** Redesign the level instead.
3. **The code is always real and always exportable.** No proprietary syntax, no game-only properties, ever.
4. **Physical success beats test success.** The objective is reaching a place, not satisfying a hidden assertion.
5. **Bad-but-working solutions must pass.** Score them lower; do not block them. Reality works this way.
6. **The tutor does not give answers before rung 5.**
7. **Flatten mode must always work**, at every level, so the learner can always see the web page underneath.

---

## 13. Build phases

**Phase 0 — Proving the renderer (2–3 weeks).**
Hidden DOM → computed layout readback → R3F slabs → Rapier colliders → walkable character. One hardcoded document. If flexbox changes do not visibly rearrange walkable platforms at the end of this phase, stop and rethink the whole project. This is the single highest-risk assumption and it must be tested first.

**Phase 1 — Vertical slice (4–6 weeks).**
Chapters 2 and 5 only (box model, flexbox). Eight levels. Editor with locked regions, live re-render, inspector, debrief, flatten toggle. No accounts, no AI, local storage only. Put it in front of ten real beginners and watch where they stall.

**Phase 2 — The tutor and persistence (4 weeks).**
Auth, Postgres, progress, concept mastery. Claude-powered tutor with the full hint ladder. Free-form doubt answering.

**Phase 3 — Full CSS curriculum (8–10 weeks).**
Chapters 0–9. Fables written and produced. Export-to-reality shipped. Quality rubric scoring.

**Phase 4 — JavaScript (10–12 weeks).**
Worker sandbox, instrumented execution, the Rewind, chapters 10–17.

**Phase 5 — Social (6 weeks).**
Commons, annotations, peer review, Sandbox publishing, chapters 18–19.

**Phase 6 — Hardening.**
2D Mode parity, full accessibility pass, mobile, performance, analytics-driven curriculum revision.

---

## 14. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Layout readback is too slow for live editing | Critical | Prove in Phase 0. Cache aggressively, diff instead of rebuilding, cap node count per region |
| 3D adds cognitive load and obscures the concept | High | Flatten toggle always available; 2D Mode as an equal path; keep regions small and readable |
| The novelty wears off and it becomes a chore | High | The fables and the Commons carry mid-game motivation; measure retention at levels 10, 25, 50 |
| Scope is enormous for a small team | High | Phases are independently shippable. Phase 1 alone is a legitimate product |
| Learners game the physical objective without learning | Medium | Quality rubric, callback levels, Commons peer review |
| AI tutor hallucinates CSS behaviour | Medium | Ground every response in the level's concept metadata and MDN excerpts; tight system prompt; log and review |
| Sandbox escape from learner JS | Medium | Worker isolation, proxied API, treat all submissions as hostile |
| Some concepts have no natural spatial mapping | Medium | Do not force them. Teach those in the debrief and in flat mode. Honesty over consistency |

---

## 15. Success metrics

- **Completion of Chapter 5** (flexbox) by a cohort, versus the same cohort's historical dropout on equivalent text curricula
- **Transfer test:** can a learner who finished chapter 9 build an unrelated card layout in a plain CodePen with no game scaffolding? This is the metric that matters most
- Time-to-first-export
- Hint rung distribution per level — a level where most learners hit rung 4+ is a badly designed level, not a hard one
- Return rate at day 7 and day 30
- Commons participation rate

---

## 16. Open questions

1. How large can a region be before layout readback misses the performance budget? Determines level design constraints.
2. Should the player character be represented in the DOM (as an element) or exist outside it? Tempting to make it an element, but it would perturb layout. Probably a separate overlay, but worth prototyping both.
3. Does scroll-based traversal (`overflow: scroll` regions) feel good or awful in 3D?
4. How do we teach Grid spatially without it collapsing into "a floor with tiles"? Grid may need a different camera mode entirely.
5. Is the fable narration voiced, illustrated, or both? Cost vs impact.
6. Should the Commons be public-internet or cohort-scoped at launch? Moderation burden.

---

## 17. Next action

Build Phase 0. Nothing else in this document matters until a `flex-direction` change visibly rearranges platforms the player can walk on.
