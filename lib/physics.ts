import type { WorldObject } from "./layout";

/**
 * A small platformer controller for a world made only of axis-aligned
 * boxes — which is exactly what a laid-out web page is.
 *
 * It moves the body on one axis at a time and resolves against the same
 * measured boxes the world is drawn from, so there is no separate physics
 * copy that can fall out of sync with the layout. (An earlier version used a
 * general-purpose physics engine's capsule controller; its rounded body
 * caught on box corners, froze mid-air on ledges, and lost jumps made while
 * pressed against a step.)
 *
 * All units are world units (60 CSS px = 1). y grows upward; `y` is the
 * body's feet.
 */

export const BODY = {
  halfWidth: 0.26,
  height: 1.15,
};

export const MOVE = {
  speed: 4.4,
  groundAccel: 46,
  airAccel: 22,
  gravity: 21,
  jumpSpeed: 8.8, // apex ≈ 1.84u ≈ 110px
  jumpCutSpeed: 4.2, // releasing jump early caps upward speed → a smaller hop
  maxFall: 18,
  coyoteTime: 0.1, // you can still jump just after walking off an edge
  jumpBuffer: 0.12, // a press just before landing still counts
  stepUp: 0.17, // tiny lips (~10px) are walked over, not jumped
  cornerNudge: 0.16, // clip a ceiling corner by less than this and you slide past it
};

const EPS = 1e-4;

export type Solid = {
  key: string;
  l: number;
  r: number;
  bottom: number;
  top: number;
  isGoal: boolean;
  isStart: boolean;
};

export function solidsFrom(objects: WorldObject[]): Solid[] {
  return objects
    .filter((o) => o.isLeaf && o.visible)
    .map((o) => ({
      key: o.key,
      l: o.position[0] - o.size[0] / 2,
      r: o.position[0] + o.size[0] / 2,
      bottom: o.position[1] - o.size[1] / 2,
      top: o.position[1] + o.size[1] / 2,
      isGoal: o.classList.includes("goal"),
      isStart: o.classList.includes("start"),
    }));
}

export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  groundKey: string | null;
  coyote: number;
  jumpBuffer: number;
  facing: 1 | -1;
};

export type Input = { move: -1 | 0 | 1; jumpPressed: boolean; jumpHeld: boolean };

export type StepEvents = { jumped: boolean; landed: boolean; bonked: boolean };

export function newBody(x: number, y: number): Body {
  return { x, y, vx: 0, vy: 0, grounded: true, groundKey: null, coyote: MOVE.coyoteTime, jumpBuffer: 0, facing: 1 };
}

function overlaps(x: number, y: number, s: Solid) {
  return (
    x + BODY.halfWidth > s.l + EPS &&
    x - BODY.halfWidth < s.r - EPS &&
    y + BODY.height > s.bottom + EPS &&
    y < s.top - EPS
  );
}

function freeAt(x: number, y: number, solids: Solid[]) {
  return !solids.some((s) => overlaps(x, y, s));
}

function groundUnder(b: Body, solids: Solid[]) {
  for (const s of solids) {
    if (b.x + BODY.halfWidth > s.l + EPS && b.x - BODY.halfWidth < s.r - EPS && Math.abs(b.y - s.top) <= 0.02) {
      return s;
    }
  }
  return null;
}

/** Advance one fixed sub-step. Mutates `b`. */
export function step(b: Body, input: Input, solids: Solid[], dt: number): StepEvents {
  const events: StepEvents = { jumped: false, landed: false, bonked: false };
  const wasGrounded = b.grounded;

  // Horizontal velocity.
  const target = input.move * MOVE.speed;
  const accel = (b.grounded ? MOVE.groundAccel : MOVE.airAccel) * dt;
  b.vx += Math.max(-accel, Math.min(accel, target - b.vx));
  if (input.move !== 0) b.facing = input.move;

  // Jump: buffered presses, coyote time, variable height.
  b.jumpBuffer = input.jumpPressed ? MOVE.jumpBuffer : Math.max(0, b.jumpBuffer - dt);
  b.coyote = b.grounded ? MOVE.coyoteTime : Math.max(0, b.coyote - dt);
  if (b.jumpBuffer > 0 && b.coyote > 0) {
    b.vy = MOVE.jumpSpeed;
    b.jumpBuffer = 0;
    b.coyote = 0;
    b.grounded = false;
    events.jumped = true;
  }
  if (!input.jumpHeld && b.vy > MOVE.jumpCutSpeed) b.vy = MOVE.jumpCutSpeed;

  b.vy = Math.max(-MOVE.maxFall, b.vy - MOVE.gravity * dt);

  // --- X axis ---
  b.x += b.vx * dt;
  for (const s of solids) {
    if (!overlaps(b.x, b.y, s)) continue;
    const lip = s.top - b.y;
    if (wasGrounded && lip > 0 && lip <= MOVE.stepUp && freeAt(b.x, s.top, solids)) {
      b.y = s.top;
      continue;
    }
    if (b.vx > 0) b.x = s.l - BODY.halfWidth - EPS;
    else if (b.vx < 0) b.x = s.r + BODY.halfWidth + EPS;
    else b.x = b.x < (s.l + s.r) / 2 ? s.l - BODY.halfWidth - EPS : s.r + BODY.halfWidth + EPS;
    b.vx = 0;
  }

  // --- Y axis ---
  b.y += b.vy * dt;
  b.grounded = false;
  b.groundKey = null;
  for (const s of solids) {
    if (!overlaps(b.x, b.y, s)) continue;
    if (b.vy <= 0) {
      b.y = s.top;
      b.vy = 0;
      b.grounded = true;
      b.groundKey = s.key;
    } else {
      // Rising into a ceiling: if only the very edge of the head clips a
      // corner, slide around it instead of stopping dead.
      const pushLeft = b.x + BODY.halfWidth - s.l; // amount to move left to clear
      const pushRight = s.r - (b.x - BODY.halfWidth); // amount to move right to clear
      if (pushLeft <= MOVE.cornerNudge && freeAt(b.x - pushLeft - EPS, b.y, solids)) {
        b.x -= pushLeft + EPS;
      } else if (pushRight <= MOVE.cornerNudge && freeAt(b.x + pushRight + EPS, b.y, solids)) {
        b.x += pushRight + EPS;
      } else {
        b.y = s.bottom - BODY.height - EPS;
        b.vy = 0;
        events.bonked = true;
      }
    }
  }

  if (!b.grounded && b.vy <= 0) {
    const g = groundUnder(b, solids);
    if (g) {
      b.grounded = true;
      b.groundKey = g.key;
      b.vy = 0;
    }
  }
  if (b.grounded && !wasGrounded) events.landed = true;
  return events;
}

/**
 * The world just changed under the body (a CSS edit). Decide where it
 * should be now: still on a platform (possibly one that moved a little),
 * or back at the start.
 */
export function resettle(b: Body, solids: Solid[]): "stay" | "moved" | "to-start" {
  const embedded = solids.find((s) => overlaps(b.x, b.y, s));
  if (embedded) {
    if (embedded.top - b.y <= 1.0 && freeAt(b.x, embedded.top, solids)) {
      b.y = embedded.top;
      b.vy = 0;
      return "moved";
    }
    return "to-start";
  }
  if (!b.grounded) return "stay";
  if (groundUnder(b, solids)) return "stay";
  // Standing, but the floor moved: follow a platform that's still roughly under you.
  let best: Solid | null = null;
  for (const s of solids) {
    if (b.x + BODY.halfWidth <= s.l || b.x - BODY.halfWidth >= s.r) continue;
    if (Math.abs(s.top - b.y) > 0.9) continue;
    if (!freeAt(b.x, s.top, solids)) continue;
    if (!best || s.top > best.top) best = s;
  }
  if (best) {
    b.y = best.top;
    b.vy = 0;
    return "moved";
  }
  return "to-start";
}

export function spawnOn(start: Solid): Body {
  return newBody((start.l + start.r) / 2, start.top);
}
