# DOMAIN — Phase 0

A working proof of the mechanic described in `domain-platform-blueprint.md`: a
3D game world rendered directly from a real, hidden HTML document. Per the
blueprint's own §13/§17: nothing else about the platform matters until a
`flex-direction` change visibly rearranges platforms the player can walk on.
This is that proof.

## What's implemented

- **The hidden-DOM renderer** (`components/HiddenStage.tsx`, `lib/layout.ts`) —
  the learner's HTML/CSS is written into a real, attached (but visually
  hidden) iframe. The browser's own layout engine lays it out; we read back
  `getBoundingClientRect()`/`getComputedStyle()` for every element. Nothing
  about CSS is reimplemented or approximated.
- **The 2D → 3D mapping** — each element becomes a slab (`components/Platform.tsx`):
  leaf elements are solid, collidable platforms; elements with children are
  translucent room backdrops. `x → x`, `y → -y`, depth from nesting/`z-index`.
- **Live editing** — a two-tab (HTML/CSS) CodeMirror 6 panel
  (`components/CodePanel.tsx`) debounced at ~120ms; every edit re-measures
  the hidden document and re-renders the scene.
- **A real character controller** (`components/Player.tsx`) — Rapier's
  `KinematicCharacterController` (autostep, slope handling, ground
  snapping), not a hand-rolled raycast. WASD/arrows to move, space to jump.
- **Flatten mode** — toggles the same hidden iframe to visible in place of
  the 3D canvas: literally the underlying web page, per Inviolable Rule #7.
- **A goal/objective check** — reaching the level's `.goal` platform is
  checked directly against the same measured world-object data everything
  else uses (see the comment in `Player.tsx` for why this isn't a Rapier
  sensor collider), and shows a debrief banner with the chapter's fable.
- **One level**: Chapter 5, "The Conveyor of Ants" (`lib/levels.ts`) — a
  flexbox walkway with uneven platform heights, so `align-items`/
  `justify-content`/`gap` edits visibly change what's reachable.

## What's not (Phase 1+ per the blueprint)

Accounts, persistence, concept mastery, the AI tutor, the Rewind, the
in-world DevTools inspector, export-to-reality, the Commons, JS
execution/sandboxing, locked editor regions, 2D Mode, and the rest of the
CSS/JS curriculum (chapters 0–4, 6–19). This build is deliberately scoped to
just proving the render pipeline and the lesson loop's mechanical core.

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then **Play Phase 0**
(or go straight to `/play`). Try editing `flex-direction: row` to `column`
in the CSS panel and watch the walkway become a tower — then hit **Flatten**
to see that it was a web page the whole time.

For a production build: `npm run build && npm run start`.

## Stack

Next.js 16 (App Router, Turbopack) · React Three Fiber + drei ·
`@react-three/rapier` (Rapier physics) · CodeMirror 6 · Zustand · Tailwind.
See §9.1 of the blueprint for the full target stack (this build uses the
subset Phase 0 needs).

## Known rough edges

- The viewport is a fixed 900×520px stage (not responsive) so the
  px → world-unit mapping stays exact — see `lib/constants.ts`.
- Jump/gravity tuning is generous rather than precisely simulated; it's
  tuned so the default level's gaps are comfortably, not exactly, clearable.
- No accessibility pass yet (§10 of the blueprint: full keyboard traversal,
  2D Mode, reduced-motion) beyond keyboard-only controls.
