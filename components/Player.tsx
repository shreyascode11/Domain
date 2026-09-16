"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboardControls, type ControlState } from "@/hooks/useKeyboardControls";
import { WORLD } from "@/lib/constants";
import { useLevelStore } from "@/lib/store";
import type { WorldObject } from "@/lib/layout";
import { BODY, newBody, resettle, solidsFrom, spawnOn, step, type Body } from "@/lib/physics";
import { cameraInput } from "@/lib/input";
import { Mascot, type MascotMotion } from "./Mascot";
import { sound } from "@/lib/audio";
import { fx } from "@/lib/fx";
import { goalReachable } from "@/lib/reach";

const SUBSTEP = 1 / 120;
/** How much of the level, in world units, the camera keeps in view across. */
const VIEW_WIDTH = 12.5;
/** How long the level-clear celebration plays before the debrief. */
const CELEBRATION_SECONDS = 1.7;
/** An opened path must stay open this long before it's announced (skips mid-animation frames). */
const PATH_SETTLE_SECONDS = 0.3;

/**
 * The camera keeps the page's left and right as the screen's left and right,
 * so the movement keys always mean what they look like. "3d" looks at the
 * level from a little right of centre and above; "side" is flat-on.
 */
const VIEWS: Record<"3d" | "side", { yaw: number; pitch: number }> = {
  "3d": { yaw: 0.42, pitch: 0.24 },
  side: { yaw: 0, pitch: 0.03 },
};

type BotInput = (s: { x: number; feet: number; grounded: boolean; objects: WorldObject[] }) => Partial<ControlState>;

/**
 * The player: Dom, driven by the box platformer controller in lib/physics.
 *
 * Everything that moves Dom without your input — spawning on a new level,
 * respawning, re-settling after an edit — happens here in the frame loop,
 * reading the store directly, so it can't race React effects.
 */
export function Player() {
  const group = useRef<THREE.Group>(null);
  const body = useRef<Body>(newBody(0, -50));
  const motion = useRef<MascotMotion>({ vx: 0, vy: 0, grounded: true, facing: 1, sinceJump: 9, sinceLand: 9, cheer: null });
  const controls = useKeyboardControls();

  const spawnedFor = useRef<number | null>(null);
  const seenRevision = useRef(0);
  const seenRespawn = useRef(0);
  const prevJump = useRef(false);
  const pendingJump = useRef(false);
  const accumulator = useRef(0);
  const clock = useRef(0);
  const celebration = useRef<{ token: number; since: number } | null>(null);
  const reach = useRef({ revision: -1, open: false, openSince: 0 });
  const shakeOffset = useRef(new THREE.Vector3());

  const cam = useRef({
    focus: new THREE.Vector3(),
    yaw: VIEWS["3d"].yaw,
    pitch: VIEWS["3d"].pitch,
    lead: 0,
    ready: false,
  });
  const tmp = useRef(new THREE.Vector3());

  useFrame((state, rawDelta) => {
    const s = useLevelStore.getState();
    const solids = solidsFrom(s.worldObjects);
    const camera = state.camera as THREE.PerspectiveCamera;
    const dt = Math.min(rawDelta, 0.1);
    clock.current += dt;

    const toStart = () => {
      const start = solids.find((o) => o.isStart);
      if (!start) return false;
      const facing = body.current.facing;
      body.current = spawnOn(start);
      body.current.facing = facing;
      return true;
    };

    // 1. A new level: wait for its first measurement, then stand on start.
    if (spawnedFor.current !== s.levelLoadToken) {
      if (s.measuredLoadToken !== s.levelLoadToken || !toStart()) return;
      spawnedFor.current = s.levelLoadToken;
      seenRevision.current = s.worldRevision;
      seenRespawn.current = s.respawnToken;
      cam.current.ready = false; // cut, don't pan, to a new level
      celebration.current = null;
      const open = goalReachable(s.worldObjects);
      reach.current = { revision: s.worldRevision, open, openSince: clock.current };
      s.setPathOpen(open, false);
    }

    // 2. Respawn button.
    if (s.respawnToken !== seenRespawn.current) {
      seenRespawn.current = s.respawnToken;
      seenRevision.current = s.worldRevision;
      toStart();
      fx.emit({ kind: "poof", x: body.current.x, y: body.current.y });
    }

    // 3. The page changed under Dom (an edit, a script, a transition frame).
    if (s.worldRevision !== seenRevision.current) {
      seenRevision.current = s.worldRevision;
      if (resettle(body.current, solids) === "to-start") toStart();
    }

    // Did the latest edit open (or close) the way to the goal?
    if (reach.current.revision !== s.worldRevision) {
      const open = goalReachable(s.worldObjects);
      if (open && !reach.current.open) reach.current.openSince = clock.current;
      reach.current.open = open;
      reach.current.revision = s.worldRevision;
      if (!open && s.pathOpen !== false) s.setPathOpen(false, false);
    }
    if (reach.current.open && s.pathOpen === false && s.phase === "playing" && clock.current - reach.current.openSince >= PATH_SETTLE_SECONDS) {
      s.setPathOpen(true, true);
      sound.pathOpen();
      const goal = solids.find((o) => o.isGoal);
      if (goal) fx.emit({ kind: "beacon", x: (goal.l + goal.r) / 2, y: goal.top });
    }

    const b = body.current;

    // Input: keyboard/touch, or the dev-only test bot.
    let keys: Partial<ControlState> = controls.current;
    const bot = process.env.NODE_ENV !== "production" ? (window as unknown as { __domainBot?: BotInput }).__domainBot : undefined;
    if (s.phase !== "playing" || s.celebrating) keys = {};
    else if (bot) keys = bot({ x: b.x, feet: b.y, grounded: b.grounded, objects: s.worldObjects });

    const jumpHeld = !!keys.jump;
    // Remember a press until a physics sub-step sees it — on a fast display a
    // frame can run zero sub-steps, which used to drop the jump.
    if (jumpHeld && !prevJump.current) pendingJump.current = true;
    prevJump.current = jumpHeld;
    const move = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) as -1 | 0 | 1;
    if (move !== 0 && s.phase === "playing") s.noteMoved();

    // Fixed sub-steps: deterministic, and no tunnelling through thin slabs.
    accumulator.current = Math.min(accumulator.current + rawDelta, 0.1);
    const m = motion.current;
    while (accumulator.current >= SUBSTEP) {
      accumulator.current -= SUBSTEP;
      const fallSpeed = -b.vy;
      const ev = step(b, { move, jumpPressed: pendingJump.current, jumpHeld }, solids, SUBSTEP);
      pendingJump.current = false;
      if (ev.jumped) {
        m.sinceJump = 0;
        sound.jump();
        s.noteJumped();
        fx.emit({ kind: "dust", x: b.x, y: b.y });
      }
      if (ev.landed) {
        m.sinceLand = 0;
        sound.land();
        const strength = THREE.MathUtils.clamp(fallSpeed / 14, 0.15, 1);
        fx.emit({ kind: "land", x: b.x, y: b.y, strength });
        if (strength > 0.7) fx.addShake(0.06 * strength);
      }
      if (ev.bonked) sound.bonk();
    }
    m.sinceJump += rawDelta;
    m.sinceLand += rawDelta;
    m.vx = b.vx;
    m.vy = b.vy;
    m.grounded = b.grounded;
    m.facing = b.facing;
    if (b.grounded && Math.abs(b.vx) > 0.4) sound.step();

    if (b.y < WORLD.respawnY) {
      if (s.phase === "playing") {
        s.recordFall();
        sound.fall();
        fx.addShake(0.22);
      }
      toStart();
      cam.current.ready = false;
      fx.emit({ kind: "poof", x: body.current.x, y: body.current.y });
    }

    const now = body.current;
    group.current?.position.set(now.x, now.y, 0);

    // Standing on the goal: celebrate for a moment, then show the debrief.
    if (s.phase === "playing" && !s.celebrating && now.grounded && now.groundKey) {
      const goal = solids.find((o) => o.key === now.groundKey);
      if (goal?.isGoal) {
        s.beginCelebration();
        celebration.current = { token: s.levelLoadToken, since: clock.current };
        sound.goal();
        fx.emit({ kind: "confetti", x: now.x, y: goal.top });
        fx.addShake(0.08);
      }
    }
    const party = celebration.current;
    m.cheer = party && s.celebrating ? clock.current - party.since : null;
    if (party && s.celebrating && party.token === s.levelLoadToken && clock.current - party.since >= CELEBRATION_SECONDS) {
      celebration.current = null;
      s.completeLevel();
    }

    // ——— Camera ———
    const c = cam.current;
    const view = VIEWS[s.view];

    // Right-drag look springs back when released.
    if (!cameraInput.dragging) {
      const k = 1 - Math.exp(-dt * 6);
      cameraInput.lookYaw += (0 - cameraInput.lookYaw) * k;
      cameraInput.lookPitch += (0 - cameraInput.lookPitch) * k;
    }

    const aspect = state.size.width / Math.max(1, state.size.height);
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const fit = VIEW_WIDTH / (2 * Math.tan(halfFov) * aspect);
    // During the celebration the camera eases in on Dom.
    const partyT = party && s.celebrating ? Math.min(1, (clock.current - party.since) / 0.9) : 0;
    const pushIn = 1 - 0.38 * (1 - (1 - partyT) ** 3);
    const distance = THREE.MathUtils.clamp(fit, 8, 20) * cameraInput.zoom * pushIn;

    // Look a little ahead of the way Dom faces; follow height gently, so a
    // jump doesn't yank the view.
    c.lead += (now.facing * 0.9 - c.lead) * (1 - Math.exp(-dt * 2.5));
    const targetFocus = tmp.current.set(now.x + c.lead, now.y + 0.7, 0);
    if (!c.ready) {
      c.focus.copy(targetFocus);
      c.yaw = view.yaw;
      c.pitch = view.pitch;
      c.ready = true;
    } else {
      const kx = 1 - Math.exp(-dt * 5);
      const ky = 1 - Math.exp(-dt * (now.grounded ? 3.5 : 1.4));
      c.focus.x += (targetFocus.x - c.focus.x) * kx;
      c.focus.y += (targetFocus.y - c.focus.y) * ky;
      const kv = 1 - Math.exp(-dt * 4);
      c.yaw += (view.yaw - c.yaw) * kv;
      c.pitch += (view.pitch - c.pitch) * kv;
    }

    const yaw = c.yaw + cameraInput.lookYaw;
    const pitch = c.pitch + cameraInput.lookPitch;
    camera.position.set(
      c.focus.x + distance * Math.sin(yaw) * Math.cos(pitch),
      c.focus.y + distance * Math.sin(pitch),
      distance * Math.cos(yaw) * Math.cos(pitch)
    );
    // Shake: a quick, decaying jitter for falls and hard landings.
    if (fx.shake > 0.001) {
      const k = fx.shake;
      shakeOffset.current.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, 0);
      camera.position.add(shakeOffset.current);
      fx.shake *= Math.exp(-dt * 9);
    } else {
      fx.shake = 0;
    }
    camera.lookAt(c.focus.x, c.focus.y, 0);
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __domainPlayer?: unknown }).__domainPlayer = {
      getPos: () => ({ x: body.current.x, y: body.current.y + BODY.height / 2, feet: body.current.y, grounded: body.current.grounded }),
    };
  }, []);

  return <Mascot ref={group} motion={motion} />;
}
