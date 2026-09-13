"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboardControls, type ControlState } from "@/hooks/useKeyboardControls";
import { WORLD } from "@/lib/constants";
import { useLevelStore } from "@/lib/store";
import type { WorldObject } from "@/lib/layout";
import { BODY, newBody, resettle, solidsFrom, spawnOn, step, type Body } from "@/lib/physics";
import { Mascot, type MascotMotion } from "./Mascot";

const SUBSTEP = 1 / 120;
/** How much of the level, in world units, the camera keeps in view across. */
const VIEW_WIDTH = 13;

/** Pull the camera back far enough to show VIEW_WIDTH across, whatever the view's shape. */
function cameraRig(fovDeg: number, aspect: number) {
  const halfFov = THREE.MathUtils.degToRad(fovDeg / 2);
  const distance = THREE.MathUtils.clamp(VIEW_WIDTH / (2 * Math.tan(halfFov) * aspect), 7.5, 17);
  return { distance, height: 1.2 + distance * 0.18 };
}

type BotInput = (s: {
  x: number;
  feet: number;
  grounded: boolean;
  objects: WorldObject[];
}) => Partial<ControlState>;

/**
 * The player: Dom, driven by the box platformer controller in lib/physics.
 *
 * Everything that moves Dom without your input — spawning on a new level,
 * respawning, re-settling after a CSS edit — happens here in the frame loop,
 * reading the store directly, so it can't race React effects.
 */
export function Player() {
  const group = useRef<THREE.Group>(null);
  const body = useRef<Body>(newBody(0, -50));
  const motion = useRef<MascotMotion>({ vx: 0, vy: 0, grounded: true, facing: 1, sinceJump: 9, sinceLand: 9 });
  const controls = useKeyboardControls();
  const camTarget = useRef(new THREE.Vector3());

  const spawnedFor = useRef<number | null>(null);
  const seenRevision = useRef(0);
  const seenRespawn = useRef(0);
  const prevJump = useRef(false);
  const pendingJump = useRef(false);
  const accumulator = useRef(0);

  useFrame((state, rawDelta) => {
    const s = useLevelStore.getState();
    const solids = solidsFrom(s.worldObjects);
    const camera = state.camera as THREE.PerspectiveCamera;
    const rig = cameraRig(camera.fov, state.size.width / Math.max(1, state.size.height));

    const snapCamera = () => {
      const b = body.current;
      camera.position.set(b.x + b.facing * 0.7, b.y + rig.height, rig.distance);
      camera.lookAt(camera.position.x, b.y + 0.8, 0);
    };
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
      snapCamera();
    }

    // 2. Respawn / reset button.
    if (s.respawnToken !== seenRespawn.current) {
      seenRespawn.current = s.respawnToken;
      seenRevision.current = s.worldRevision;
      toStart();
    }

    // 3. The CSS changed the world under Dom.
    if (s.worldRevision !== seenRevision.current) {
      seenRevision.current = s.worldRevision;
      if (resettle(body.current, solids) === "to-start") toStart();
    }

    const b = body.current;

    // Input: keyboard, or the dev-only test bot.
    let keys: Partial<ControlState> = controls.current;
    const bot =
      process.env.NODE_ENV !== "production"
        ? (window as unknown as { __domainBot?: BotInput }).__domainBot
        : undefined;
    if (s.phase !== "playing") keys = {};
    else if (bot) keys = bot({ x: b.x, feet: b.y, grounded: b.grounded, objects: s.worldObjects });

    const jumpHeld = !!keys.jump;
    // Remember a press until a physics sub-step actually sees it — on a fast
    // display a frame can run zero sub-steps, which used to drop the jump.
    if (jumpHeld && !prevJump.current) pendingJump.current = true;
    prevJump.current = jumpHeld;
    const move = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) as -1 | 0 | 1;

    // Fixed sub-steps: deterministic, and no tunnelling through thin slabs.
    accumulator.current = Math.min(accumulator.current + rawDelta, 0.1);
    const m = motion.current;
    while (accumulator.current >= SUBSTEP) {
      accumulator.current -= SUBSTEP;
      const ev = step(b, { move, jumpPressed: pendingJump.current, jumpHeld }, solids, SUBSTEP);
      pendingJump.current = false;
      if (ev.jumped) m.sinceJump = 0;
      if (ev.landed) m.sinceLand = 0;
    }
    m.sinceJump += rawDelta;
    m.sinceLand += rawDelta;
    m.vx = b.vx;
    m.vy = b.vy;
    m.grounded = b.grounded;
    m.facing = b.facing;

    if (b.y < WORLD.respawnY) {
      if (s.phase === "playing") s.recordFall();
      toStart();
      snapCamera();
    }

    const now = body.current;
    group.current?.position.set(now.x, now.y, 0);

    // The objective evaluator (§9.2): standing on the goal.
    if (s.phase === "playing" && now.grounded && now.groundKey) {
      if (solids.find((o) => o.key === now.groundKey)?.isGoal) s.completeLevel();
    }

    // Camera: follow, looking a little ahead of the way Dom faces.
    camTarget.current.set(now.x + now.facing * 0.7, now.y + rig.height, rig.distance);
    camera.position.lerp(camTarget.current, 1 - Math.pow(0.002, rawDelta));
    camera.lookAt(camera.position.x, camera.position.y - rig.height + 0.8, 0);
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __domainPlayer?: unknown }).__domainPlayer = {
      getPos: () => ({
        x: body.current.x,
        y: body.current.y + BODY.height / 2,
        feet: body.current.y,
        grounded: body.current.grounded,
      }),
    };
  }, []);

  return <Mascot ref={group} motion={motion} />;
}
