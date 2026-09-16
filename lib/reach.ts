import type { WorldObject } from "./layout";
import { BODY, MOVE, REACH } from "./physics";

type Pad = { key: string; l: number; r: number; top: number; bottom: number; isStart: boolean; isGoal: boolean };

/**
 * Horizontal speed to estimate jumps with. A flat jump reaches a little
 * under REACH.acrossPx — the distance the controller was measured to clear —
 * because this drives the "the way is open" message: claiming a marginal
 * jump is open would be a lie, while staying quiet about one is merely
 * modest. Levels are designed with gaps well inside or well beyond this.
 */
const FLAT_AIRTIME = (2 * MOVE.jumpSpeed) / MOVE.gravity;
const AIR_SPEED = (REACH.acrossPx * 0.92) / 60 / FLAT_AIRTIME;

/**
 * Can Dom get from the start to the goal in this layout? A conservative
 * estimate from the jump arc (MOVE.jumpSpeed, MOVE.gravity): it never says
 * "open" for a gap the player can't clear, and treats a tall block standing
 * between two platforms as a wall.
 */
export function goalReachable(objects: WorldObject[]): boolean {
  const pads: Pad[] = objects
    .filter((o) => o.isLeaf && o.visible)
    .map((o) => ({
      key: o.key,
      l: o.position[0] - o.size[0] / 2,
      r: o.position[0] + o.size[0] / 2,
      top: o.position[1] + o.size[1] / 2,
      bottom: o.position[1] - o.size[1] / 2,
      isStart: o.classList.includes("start"),
      isGoal: o.classList.includes("goal"),
    }));
  const start = pads.find((p) => p.isStart);
  const goal = pads.find((p) => p.isGoal);
  if (!start || !goal) return false;

  const walled = (a: Pad, b: Pad) => {
    const floor = Math.max(a.top, b.top);
    const from = Math.min(a.r, b.r);
    const to = Math.max(a.l, b.l);
    return pads.some((c) => c !== a && c !== b && c.r > from - 0.01 && c.l < to + 0.01 && c.l >= Math.min(a.l, b.l) && c.top - floor > 1.6 && c.bottom < floor + BODY.height);
  };

  const canHop = (a: Pad, b: Pad) => {
    const rise = b.top - a.top;
    if (rise > 1.6 || walled(a, b)) return false;
    const gap = b.l >= a.r ? b.l - a.r : a.l >= b.r ? a.l - b.r : -1;
    if (gap <= 0.02 && Math.abs(rise) < 0.15) return true;
    const disc = MOVE.jumpSpeed ** 2 - 2 * MOVE.gravity * rise;
    if (disc < 0) return false;
    const airtime = (MOVE.jumpSpeed + Math.sqrt(disc)) / MOVE.gravity;
    return gap <= AIR_SPEED * airtime;
  };

  const seen = new Set([start.key]);
  const queue = [start];
  while (queue.length) {
    const a = queue.shift()!;
    if (a.key === goal.key) return true;
    for (const b of pads) {
      if (!seen.has(b.key) && canHop(a, b)) {
        seen.add(b.key);
        queue.push(b);
      }
    }
  }
  return false;
}
