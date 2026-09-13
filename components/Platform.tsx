"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Line, Outlines, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import type { WorldObject } from "@/lib/layout";
import { useLevelStore } from "@/lib/store";

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

/** Glide a group toward a target position: layout changes read as motion, not pops. */
function useGlide(target: THREE.Vector3) {
  const ref = useRef<THREE.Group>(null);
  const placed = useRef(false);
  useLayoutEffect(() => {
    if (placed.current || !ref.current) return;
    ref.current.position.copy(target);
    placed.current = true;
  }, [target]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const k = prefersReducedMotion() ? 1 : 1 - Math.exp(-delta * 20);
    ref.current.position.lerp(target, k);
  });
  return ref;
}

function useSelectHandlers(key: string, selected: boolean) {
  const select = useLevelStore((s) => s.select);
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      select(selected ? null : key);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
    },
  };
}

/** The goal: a light beam you can see from anywhere, and a turning crystal. */
function GoalBeacon({ height }: { height: number }) {
  const crystal = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!crystal.current) return;
    const t = clock.getElapsedTime();
    crystal.current.rotation.y = t * 1.4;
    crystal.current.position.y = height / 2 + 1.0 + Math.sin(t * 2) * 0.08;
  });
  return (
    <group>
      <mesh position={[0, height / 2 + 3, 0]}>
        <cylinderGeometry args={[0.32, 0.5, 6, 24, 1, true]} />
        <meshBasicMaterial color="#ffcf6e" transparent opacity={0.13} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={crystal} position={[0, height / 2 + 1, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, height / 2 + 1, 0.4]} color="#ffc971" intensity={6} distance={5} decay={2} />
    </group>
  );
}

/** The start: a slowly turning rune ring on the platform's top. */
function StartRune({ height, width }: { height: number; width: number }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ring.current) ring.current.rotation.z += d * 0.6;
  });
  const r = Math.min(0.42, width * 0.3);
  return (
    <mesh ref={ring} position={[0, height / 2 + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r * 0.78, r, 6, 1]} />
      <meshBasicMaterial color="#5eead4" transparent opacity={0.85} toneMapped={false} />
    </mesh>
  );
}

/** A sign engraved on the block's front face — readable, and never over Dom. */
function Label({ text, color, h, d }: { text: string; color: string; h: number; d: number }) {
  return (
    <Text
      position={[0, 0, d / 2 + 0.012]}
      fontSize={Math.min(0.2, h * 0.55)}
      letterSpacing={0.2}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.014}
      outlineColor="#0b1220"
    >
      {text}
    </Text>
  );
}

/** A leaf element: a solid block you can stand on. */
function Block({ object, selected }: { object: WorldObject; selected: boolean }) {
  const target = useMemo(() => new THREE.Vector3(...object.position), [object.position]);
  const glide = useGlide(target);
  const handlers = useSelectHandlers(object.key, selected);
  const [w, h, d] = object.size;
  const radius = Math.min(0.07, Math.min(w, h) * 0.25);
  const isGoal = object.classList.includes("goal");
  const isStart = object.classList.includes("start");
  const color = isTransparent(object.color) ? "#9aa7bd" : object.color;
  const border = isTransparent(object.borderColor) ? "#3b4a63" : object.borderColor;

  return (
    <group ref={glide}>
      <RoundedBox args={[w, h, d]} radius={radius} smoothness={3} castShadow receiveShadow {...handlers}>
        <meshStandardMaterial
          color={color}
          roughness={0.62}
          metalness={0.08}
          emissive={selected ? SELECT : isGoal ? "#ff9f5a" : "#000000"}
          emissiveIntensity={selected ? 0.35 : isGoal ? 0.12 : 0}
        />
        {/* The element's CSS border, drawn as its outline. */}
        <Outlines thickness={selected ? 0.045 : object.borderWidth > 0 ? 0.025 : 0.012} color={selected ? SELECT : border} />
      </RoundedBox>
      {isGoal && (
        <>
          <GoalBeacon height={h} />
          <Label text="GOAL" color="#ffe29a" h={h} d={d} />
        </>
      )}
      {isStart && (
        <>
          <StartRune height={h} width={w} />
          <Label text="START" color="#b6fff3" h={h} d={d} />
        </>
      )}
    </group>
  );
}

/**
 * A container element: no body of its own, drawn as a dashed blueprint
 * outline labelled with its selector — so you can see which box is the
 * flex container arranging the blocks inside it.
 */
function Container({ object, selected }: { object: WorldObject; selected: boolean }) {
  const target = useMemo(() => new THREE.Vector3(...object.position), [object.position]);
  const glide = useGlide(target);
  const handlers = useSelectHandlers(object.key, selected);
  const [w, h] = object.size;
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
  const color = selected ? SELECT : "#5eead4";

  return (
    <group ref={glide}>
      <mesh {...handlers}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.1 : 0.035} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Line points={points} color={color} lineWidth={selected ? 2.2 : 1.4} dashed dashSize={0.22} gapSize={0.14} transparent opacity={selected ? 1 : 0.7} />
      <Text position={[-hw + 0.06, -hh - 0.1, 0]} fontSize={0.2} color={color} anchorX="left" anchorY="top" outlineWidth={0.01} outlineColor="#0b1220">
        {object.inspect.selector}
      </Text>
    </group>
  );
}

/** One measured DOM element, rendered as part of the world. Click it to inspect. */
export function Platform({ object }: { object: WorldObject }) {
  const selected = useLevelStore((s) => s.selectedKey === object.key);
  if (!object.visible) return null;
  return object.isLeaf ? <Block object={object} selected={selected} /> : <Container object={object} selected={selected} />;
}
