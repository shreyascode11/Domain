"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, Outlines, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import type { WorldObject } from "@/lib/layout";
import { useLevelStore } from "@/lib/store";
import { clickElement } from "@/lib/stage";
import { stoneTextures } from "@/lib/textures";
import { sound } from "@/lib/audio";

const TRANSPARENT_RE = /rgba?\([^)]*,\s*0\s*\)/;
const isTransparent = (c: string) => !c || c === "transparent" || TRANSPARENT_RE.test(c);

let reducedMotion: boolean | null = null;
function prefersReducedMotion() {
  if (reducedMotion === null && typeof window !== "undefined") {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return !!reducedMotion;
}

const SELECT = "#ffd166";
const SELECT_COLOR = new THREE.Color(SELECT);
const PULSE = new THREE.Color("#5eead4");

/** Glide toward the layout's position, and pulse when the layout moves it. */
function useGlide(target: THREE.Vector3, size: THREE.Vector3) {
  const ref = useRef<THREE.Group>(null);
  const placed = useRef(false);
  const pulse = useRef(0);
  const lastSize = useRef(size.clone());
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (!placed.current) {
      ref.current.position.copy(target);
      placed.current = true;
      return;
    }
    if (ref.current.position.distanceTo(target) > 0.02 || lastSize.current.distanceTo(size) > 0.02) pulse.current = 1;
    lastSize.current.copy(size);
  }, [target, size]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const k = prefersReducedMotion() ? 1 : 1 - Math.exp(-delta * 18);
    ref.current.position.lerp(target, k);
    pulse.current = Math.max(0, pulse.current - delta * 1.6);
  });
  return { ref, pulse };
}

function useHandlers(object: WorldObject, selected: boolean) {
  const select = useLevelStore((s) => s.select);
  const hover = useLevelStore((s) => s.hover);
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      // A real click on the real element: JavaScript listeners hear it.
      clickElement(object.key);
      sound.click();
      select(selected ? null : object.key);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
      hover(object.key);
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
      hover(null);
    },
  };
}

/** Hover label: the element this block is, written as HTML. */
function Tag({ object, y }: { object: WorldObject; y: number }) {
  const { selector } = object.inspect;
  const [tag, ...rest] = selector.split(/(?=[.#])/);
  const classes = rest.filter((p) => p.startsWith(".")).map((p) => p.slice(1));
  const id = rest.find((p) => p.startsWith("#"))?.slice(1);
  return (
    <Html position={[0, y, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className="pointer-events-none -translate-y-full whitespace-nowrap rounded-[3px] border border-teal-400/60 bg-ink-950/90 px-2 py-1 font-mono text-[12px] shadow-lg">
        <span className="text-ink-500">&lt;</span>
        <span className="text-gold-300">{tag}</span>
        {id && (
          <>
            {" "}
            <span className="text-teal-300">id</span>=<span className="text-jade-400">&quot;{id}&quot;</span>
          </>
        )}
        {classes.length > 0 && (
          <>
            {" "}
            <span className="text-teal-300">class</span>=<span className="text-jade-400">&quot;{classes.join(" ")}&quot;</span>
          </>
        )}
        <span className="text-ink-500">&gt;</span>
      </div>
    </Html>
  );
}

/** The goal: a pillar of light and a turning crystal, visible from anywhere. */
function GoalBeacon({ height }: { height: number }) {
  const crystal = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (crystal.current) {
      crystal.current.rotation.y = t.current * 1.4;
      crystal.current.position.y = height / 2 + 1.05 + Math.sin(t.current * 2) * 0.08;
    }
    if (ring.current) {
      const p = (t.current % 1.6) / 1.6;
      ring.current.scale.setScalar(0.4 + p * 1.1);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - p);
    }
  });
  return (
    <group>
      <mesh position={[0, height / 2 + 3.2, 0]}>
        <cylinderGeometry args={[0.28, 0.55, 6.4, 24, 1, true]} />
        <meshBasicMaterial color="#ffcf6e" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, height / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.62, 48]} />
        <meshBasicMaterial color="#ffd98a" transparent opacity={0.6} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={crystal} position={[0, height / 2 + 1.05, 0]} castShadow>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, height / 2 + 1.1, 0.6]} color="#ffc971" intensity={8} distance={6} decay={2} />
    </group>
  );
}

/** The start: a slowly turning rune on the platform's top. */
function StartRune({ height, width }: { height: number; width: number }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ring.current) ring.current.rotation.z += d * 0.6;
  });
  const r = Math.min(0.5, width * 0.32);
  return (
    <mesh ref={ring} position={[0, height / 2 + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r * 0.8, r, 6, 1]} />
      <meshBasicMaterial color="#5eead4" transparent opacity={0.9} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function FaceLabel({ text, color, h, d }: { text: string; color: string; h: number; d: number }) {
  return (
    <Text position={[0, 0, d / 2 + 0.015]} fontSize={Math.min(0.2, h * 0.5)} letterSpacing={0.2} color={color} anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#0b1220">
      {text}
    </Text>
  );
}

/** Repeat the stone detail at a constant real-world size, whatever the block's size. */
function useStoneMaps(w: number, h: number) {
  return useMemo(() => {
    const base = stoneTextures();
    if (!base) return null;
    const rep = (t: THREE.Texture) => {
      const c = t.clone();
      c.repeat.set(Math.max(0.35, w / 2.2), Math.max(0.35, h / 2.2));
      c.needsUpdate = true;
      return c;
    };
    return { map: rep(base.map), bump: rep(base.bump), rough: rep(base.rough) };
  }, [w, h]);
}

/** A leaf element: a solid block you can stand on. */
function Block({ object, selected }: { object: WorldObject; selected: boolean }) {
  const [px, py, pz] = object.position;
  const [w, h, d] = object.size;
  const target = useMemo(() => new THREE.Vector3(px, py, pz), [px, py, pz]);
  const sizeVec = useMemo(() => new THREE.Vector3(w, h, d), [w, h, d]);
  const { ref, pulse } = useGlide(target, sizeVec);
  const handlers = useHandlers(object, selected);
  const hovered = useLevelStore((s) => s.hoveredKey === object.key);
  const maps = useStoneMaps(w, d);
  const material = useRef<THREE.MeshStandardMaterial>(null);

  const isGoal = object.classList.includes("goal");
  const isStart = object.classList.includes("start");
  const color = isTransparent(object.color) ? "#9aa3ad" : object.color;
  const border = isTransparent(object.borderColor) ? "#343d4a" : object.borderColor;
  const topColor = useMemo(() => new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.16), [color]);
  const radius = Math.min(0.06, Math.min(w, h) * 0.22);

  useFrame(() => {
    const mat = material.current;
    if (!mat) return;
    const glow = selected ? 0.3 : hovered ? 0.14 : 0;
    mat.emissive.copy(selected || hovered ? SELECT_COLOR : PULSE);
    mat.emissiveIntensity = Math.max(glow, pulse.current * 0.55);
  });

  return (
    <group ref={ref}>
      <RoundedBox args={[w, h, d]} radius={radius} smoothness={3} castShadow receiveShadow {...handlers}>
        <meshStandardMaterial
          ref={material}
          color={color}
          map={maps?.map ?? null}
          bumpMap={maps?.bump ?? null}
          bumpScale={1.2}
          roughnessMap={maps?.rough ?? null}
          roughness={0.9}
          metalness={0.02}
        />
        {/* The element's CSS border, drawn as its outline. */}
        <Outlines thickness={selected ? 0.05 : object.borderWidth > 0 ? 0.022 : 0.01} color={selected ? SELECT : border} />
      </RoundedBox>
      {/* The worn top you walk on: same colour, lighter. */}
      <mesh position={[0, h / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[Math.max(0.01, w - radius * 2), Math.max(0.01, d - radius * 2)]} />
        <meshStandardMaterial color={topColor} map={maps?.map ?? null} bumpMap={maps?.bump ?? null} bumpScale={0.8} roughness={0.95} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {isGoal && (
        <>
          <GoalBeacon height={h} />
          <FaceLabel text="GOAL" color="#ffe29a" h={h} d={d} />
        </>
      )}
      {isStart && (
        <>
          <StartRune height={h} width={w} />
          <FaceLabel text="START" color="#b6fff3" h={h} d={d} />
        </>
      )}
      {(hovered || selected) && <Tag object={object} y={h / 2 + (isGoal ? 1.7 : 0.35)} />}
    </group>
  );
}

/**
 * A container element: no body of its own, drawn as a glowing blueprint
 * frame labelled with its selector — so you can see which box contains,
 * and arranges, the blocks inside it.
 */
function Container({ object, selected }: { object: WorldObject; selected: boolean }) {
  const [px, py, pz] = object.position;
  const [w, h, d] = object.size;
  const target = useMemo(() => new THREE.Vector3(px, py, pz), [px, py, pz]);
  const sizeVec = useMemo(() => new THREE.Vector3(w, h, d), [w, h, d]);
  const { ref } = useGlide(target, sizeVec);
  const handlers = useHandlers(object, selected);
  const hovered = useLevelStore((s) => s.hoveredKey === object.key);
  const hw = w / 2;
  const hh = h / 2;
  const points = useMemo<[number, number, number][]>(
    () => [
      [-hw, -hh, 0],
      [hw, -hh, 0],
      [hw, hh, 0],
      [-hw, hh, 0],
      [-hw, -hh, 0],
    ],
    [hw, hh]
  );
  const active = selected || hovered;
  const color = active ? SELECT : "#7df3e1";

  return (
    <group ref={ref}>
      <mesh {...handlers}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.12 : 0.05} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Line points={points} color={color} lineWidth={active ? 2.4 : 1.5} dashed dashSize={0.2} gapSize={0.12} transparent opacity={active ? 1 : 0.75} toneMapped={false} />
      <Text position={[-hw + 0.06, -hh - 0.1, 0]} fontSize={0.19} color={color} anchorX="left" anchorY="top" outlineWidth={0.012} outlineColor="#0b1220">
        {object.inspect.selector}
      </Text>
    </group>
  );
}

/** One measured DOM element, rendered as part of the world. Hover to name it, click to click it. */
export function Platform({ object }: { object: WorldObject }) {
  const selected = useLevelStore((s) => s.selectedKey === object.key);
  if (!object.visible) return null;
  return object.isLeaf ? <Block object={object} selected={selected} /> : <Container object={object} selected={selected} />;
}
