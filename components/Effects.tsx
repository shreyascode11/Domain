"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fx, type FxEvent } from "@/lib/fx";

const MAX = 700;

type Particle = {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  size: number;
  gravity: number;
  drag: number;
  spin: number;
  angle: number;
  /** Shrink away as it ages (dust, poof) rather than holding size (confetti). */
  fade: boolean;
};

const DUST = new THREE.Color("#efe3c8");
const POOF = [new THREE.Color("#b6fff3"), new THREE.Color("#ffffff"), new THREE.Color("#5eead4")];
const CONFETTI = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#f78c6b", "#c77dff"].map((c) => new THREE.Color(c));
const GOLD = [new THREE.Color("#ffd98a"), new THREE.Color("#fff3c4"), new THREE.Color("#ffb703")];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

let reduced: boolean | null = null;
const reducedMotion = () => {
  if (reduced === null && typeof window !== "undefined") reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return !!reduced;
};

/** One pool of particles for a single look (soft puffs or confetti). */
function makePool(count: number) {
  return Array.from({ length: count }, (): Particle => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0.1, gravity: 0, drag: 0, spin: 0, angle: 0, fade: true }));
}

/**
 * Short-lived particles for game feel: dust when Dom jumps and lands, a poof
 * on respawn, confetti at the goal, and a rising shimmer when the way opens.
 * Everything is driven by events from lib/fx.
 */
export function Effects() {
  const puffMesh = useRef<THREE.InstancedMesh>(null);
  const confettiMesh = useRef<THREE.InstancedMesh>(null);
  // Particles live in refs: they're mutated every frame and never drive a re-render.
  const pools = useRef<{ puffs: Particle[]; confetti: Particle[] } | null>(null);
  const puffCursor = useRef(0);
  const confettiCursor = useRef(0);
  const scratch = useRef<THREE.Object3D | null>(null);
  /** Pools with nothing alive are skipped entirely, so idle frames cost nothing. */
  const busy = useRef({ puffs: false, confetti: false });

  // Give every instance a colour up front, so the materials compile with per-instance colour.
  useLayoutEffect(() => {
    for (const mesh of [puffMesh.current, confettiMesh.current]) {
      if (!mesh) continue;
      const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < MAX; i++) {
        mesh.setColorAt(i, DUST);
        mesh.setMatrixAt(i, hidden);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = false;
    }
  }, []);

  useEffect(() => {
    pools.current ??= { puffs: makePool(MAX), confetti: makePool(MAX) };
    const { puffs, confetti } = pools.current;
    const spawn = (pool: Particle[], cursor: { current: number }, mesh: THREE.InstancedMesh | null, color: THREE.Color, p: Omit<Particle, "alive" | "life" | "angle">) => {
      const i = cursor.current;
      cursor.current = (i + 1) % pool.length;
      pool[i] = { ...p, alive: true, life: 0, angle: Math.random() * Math.PI * 2 };
      if (pool === puffs) busy.current.puffs = true;
      else busy.current.confetti = true;
      mesh?.setColorAt(i, color);
      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    const scale = reducedMotion() ? 0.35 : 1;
    const n = (count: number) => Math.max(1, Math.round(count * scale));

    return fx.subscribe((e: FxEvent) => {
      const puff = (color: THREE.Color, p: Omit<Particle, "alive" | "life" | "angle">) => spawn(puffs, puffCursor, puffMesh.current, color, p);
      const flake = (color: THREE.Color, p: Omit<Particle, "alive" | "life" | "angle">) => spawn(confetti, confettiCursor, confettiMesh.current, color, p);
      const s = e.strength ?? 1;
      switch (e.kind) {
        case "dust":
          for (let i = 0; i < n(8); i++) {
            const dir = Math.random() < 0.5 ? -1 : 1;
            puff(DUST, { x: e.x + rand(-0.15, 0.15), y: e.y + 0.04, z: rand(-0.25, 0.25), vx: dir * rand(0.4, 1.6), vy: rand(0.2, 1), vz: rand(-0.4, 0.4), max: rand(0.35, 0.6), size: rand(0.06, 0.13), gravity: -1.5, drag: 3.5, spin: 0, fade: true });
          }
          break;
        case "land":
          for (let i = 0; i < n(6 + 12 * s); i++) {
            const dir = i % 2 === 0 ? -1 : 1;
            puff(DUST, { x: e.x + dir * rand(0.05, 0.3), y: e.y + 0.03, z: rand(-0.3, 0.3), vx: dir * rand(1, 1 + 2.6 * s), vy: rand(0.2, 0.8 + s), vz: rand(-0.6, 0.6), max: rand(0.4, 0.7), size: rand(0.07, 0.12 + 0.08 * s), gravity: -1, drag: 4, spin: 0, fade: true });
          }
          break;
        case "poof":
          for (let i = 0; i < n(24); i++) {
            const a = (i / 24) * Math.PI * 2;
            const speed = rand(1.2, 2.8);
            puff(pick(POOF), { x: e.x, y: e.y + 0.55, z: rand(-0.2, 0.2), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed + 0.4, vz: rand(-0.8, 0.8), max: rand(0.45, 0.7), size: rand(0.1, 0.2), gravity: 0, drag: 3, spin: 0, fade: true });
          }
          break;
        case "confetti":
          for (let i = 0; i < n(140); i++) {
            flake(pick(CONFETTI), { x: e.x + rand(-0.4, 0.4), y: e.y + rand(0.2, 0.8), z: rand(-0.4, 0.4), vx: rand(-4, 4), vy: rand(4.5, 9.5), vz: rand(-2.2, 2.2), max: rand(1.6, 2.6), size: rand(0.07, 0.12), gravity: -9, drag: 0.9, spin: rand(-12, 12), fade: false });
          }
          break;
        case "beacon":
          for (let i = 0; i < n(46); i++) {
            flake(pick(GOLD), { x: e.x + rand(-0.6, 0.6), y: e.y + rand(0, 0.4), z: rand(-0.5, 0.5), vx: rand(-0.3, 0.3), vy: rand(2, 5.5), vz: rand(-0.3, 0.3), max: rand(1, 1.7), size: rand(0.05, 0.09), gravity: 0, drag: 0.6, spin: rand(-6, 6), fade: true });
          }
          break;
      }
    });
  }, []);

  useFrame((_, rawDelta) => {
    const all = pools.current;
    if (!all) return;
    const dummy = (scratch.current ??= new THREE.Object3D());
    const dt = Math.min(rawDelta, 1 / 20);
    const update = (pool: Particle[], mesh: THREE.InstancedMesh | null, flat: boolean, which: "puffs" | "confetti") => {
      if (!mesh || !busy.current[which]) return;
      let any = false;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.alive) {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -999, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
        any = true;
        p.life += dt;
        if (p.life >= p.max) {
          p.alive = false;
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
        const drag = Math.exp(-p.drag * dt);
        p.vx *= drag;
        p.vz *= drag;
        p.vy = p.vy * (flat ? Math.exp(-0.4 * dt) : drag) + p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.angle += p.spin * dt;
        const t = p.life / p.max;
        const size = p.fade ? p.size * (1 - t) * (0.6 + 0.8 * Math.min(1, t * 6)) : p.size * Math.min(1, (1 - t) * 4);
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.angle, p.angle * 0.7, p.angle * 0.3);
        dummy.scale.set(size, flat ? size * 0.55 : size, size);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = any;
      busy.current[which] = any;
    };
    update(all.puffs, puffMesh.current, false, "puffs");
    update(all.confetti, confettiMesh.current, true, "confetti");
  });

  return (
    <>
      <instancedMesh ref={puffMesh} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={1} metalness={0} transparent opacity={0.85} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={confettiMesh} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 0.12]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}
