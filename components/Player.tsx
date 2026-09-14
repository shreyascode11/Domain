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

const SUBSTEP = 1 / 120;
/** How much of the level, in world units, the camera keeps in view across. */
const VIEW_WIDTH = 12.5;

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
  const motion = useRef<MascotMotion>({ vx: 0, vy: 0, grounded: true, facing: 1, sinceJump: 9, sinceLand: 9 });
  const controls = useKeyboardControls();

  const spawnedFor = useRef<number | null>(null);
  const seenRevision = useRef(0);
  const seenRespawn = useRef(0);
  const prevJump = useRef(false);
  const pendingJump = useRef(false);
  const accumulator = useRef(0);

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
    }

    // 2. Respawn button.
    if (s.respawnToken !== seenRespawn.current) {
      seenRespawn.current = s.respawnToken;
      seenRevision.current = s.worldRevision;
      toStart();
    }

    // 3. The page changed under Dom (an edit, a script, a transition frame).
    if (s.worldRevision !== seenRevision.current) {
      seenRevision.current = s.worldRevision;
      if (resettle(body.current, solids) === "to-start") toStart();
    }

    const b = body.current;

    // Input: keyboard/touch, or the dev-only test bot.
    let keys: Partial<ControlState> = controls.current;
    const bot = process.env.NODE_ENV !== "production" ? (window as unknown as { __domainBot?: BotInput }).__domainBot : undefined;
    if (s.phase !== "playing") keys = {};
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
      const ev = step(b, { move, jumpPressed: pendingJump.current, jumpHeld }, solids, SUBSTEP);
      pendingJump.current = false;
      if (ev.jumped) {
        m.sinceJump = 0;
        sound.jump();
        s.noteJumped();
      }
      if (ev.landed) {
        m.sinceLand = 0;
        sound.land();
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
        sound.bonk();
      }
      toStart();
      cam.current.ready = false;
    }

    const now = body.current;
    group.current?.position.set(now.x, now.y, 0);

    // The objective evaluator (§9.2): standing on the goal.
    if (s.phase === "playing" && now.grounded && now.groundKey) {
      if (solids.find((o) => o.key === now.groundKey)?.isGoal) {
        sound.goal();
        s.completeLevel();
      }
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
    const distance = THREE.MathUtils.clamp(fit, 8, 20) * cameraInput.zoom;

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
