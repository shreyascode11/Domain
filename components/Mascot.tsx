"use client";

import { forwardRef, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type MascotMotion = {
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 1 | -1;
  /** Seconds since the last jump / landing, for squash & stretch. */
  sinceJump: number;
  sinceLand: number;
  /** Seconds into the level-clear celebration, or null when not celebrating. */
  cheer: number | null;
};

// Rich 3D chitin color palette
const CHITIN_BASE = "#e07a1e";
const CHITIN_DARK = "#8c3b0d";
const CHITIN_HIGHLIGHT = "#fca34d";
const CHITIN_BELLY = "#fdbb74";
const TEAL = "#2dd4bf";
const GOLD = "#f59e0b";
const INK = "#0f172a";
const SCARF = "#f43f5e";

// 3 pairs of legs on X axis: front, middle, rear
const LEG_CONFIG = [
  { x: 0.12, angleY: 0.28, phase: 0 },
  { x: 0.12, angleY: -0.28, phase: Math.PI },
  { x: 0.0, angleY: 0.0, phase: Math.PI },
  { x: 0.0, angleY: 0.0, phase: 0 },
  { x: -0.12, angleY: -0.32, phase: 0 },
  { x: -0.12, angleY: 0.32, phase: Math.PI },
];

/** 3D Articulated Ant Leg with outward splay and joint */
function Leg3D({
  legRef,
  x,
  side,
  angleY,
}: {
  legRef: (el: THREE.Group | null) => void;
  x: number;
  side: 1 | -1;
  angleY: number;
}) {
  return (
    <group ref={legRef} position={[x, 0.42, 0.12 * side]} rotation={[0, angleY, 0]}>
      {/* Hip coxa */}
      <mesh rotation={[0.4 * side, 0, 0]} position={[0, -0.02, 0.05 * side]}>
        <sphereGeometry args={[0.042, 10, 8]} />
        <meshStandardMaterial color={CHITIN_DARK} roughness={0.4} />
      </mesh>
      {/* Upper leg (Femur) arches outward */}
      <mesh
        position={[0, 0.04, 0.12 * side]}
        rotation={[0.75 * side, 0, 0.15 * side]}
        castShadow
      >
        <capsuleGeometry args={[0.026, 0.18, 4, 8]} />
        <meshStandardMaterial color={CHITIN_BASE} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Knee joint */}
      <mesh position={[0, 0.09, 0.21 * side]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color={GOLD} roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Lower leg (Tibia) bends back down towards ground */}
      <mesh
        position={[0, -0.18, 0.23 * side]}
        rotation={[-0.4 * side, 0, -0.1 * side]}
        castShadow
      >
        <capsuleGeometry args={[0.02, 0.36, 4, 8]} />
        <meshStandardMaterial color={INK} roughness={0.5} />
      </mesh>
      {/* Foot claw */}
      <mesh position={[0.01, -0.37, 0.25 * side]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.02, 0.06, 5]} />
        <meshStandardMaterial color={CHITIN_DARK} roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * Dom — the player character.
 * Redesigned as a fully volumetric, true 3D ant adventurer:
 * - True 3D Y-axis rotation (turns in 3D space, no 2D flat paper squish)
 * - Eyes on both sides of head with pupils and specular glints
 * - 6 articulated 3D legs splaying outwards into space
 * - Segmented chitin abdomen with gloss highlights
 * - Explorer backpack, scarf, and glowing crystalline antennae
 */
export const Mascot = forwardRef<THREE.Group, { motion: RefObject<MascotMotion> }>(
  function Mascot({ motion }, ref) {
    const rotGroup = useRef<THREE.Group>(null);
    const squash = useRef<THREE.Group>(null);
    const bodyBob = useRef<THREE.Group>(null);
    const head = useRef<THREE.Group>(null);
    const abdomen = useRef<THREE.Group>(null);
    const antennaL = useRef<THREE.Group>(null);
    const antennaR = useRef<THREE.Group>(null);
    const eyeL = useRef<THREE.Group>(null);
    const eyeR = useRef<THREE.Group>(null);
    const legs = useRef<(THREE.Group | null)[]>([]);
    const anim = useRef({ walk: 0, currentY: 0, t: 0, blinkAt: 2.5 });

    const tipMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: TEAL,
          emissive: TEAL,
          emissiveIntensity: 2.5,
          toneMapped: false,
          roughness: 0.1,
        }),
      []
    );

    const eyeMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: "#ffffff",
          roughness: 0.15,
          metalness: 0.1,
        }),
      []
    );

    const pupilMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: "#050811",
          roughness: 0.05,
        }),
      []
    );

    useFrame((_, rawDelta) => {
      const m = motion.current;
      if (!m) return;
      const dt = Math.min(rawDelta, 1 / 20);
      const a = anim.current;
      a.t += dt;

      const cheer = m.cheer;
      const speed = Math.abs(m.vx);
      const walking = m.grounded && speed > 0.25 && cheer === null;
      a.walk += dt * (walking ? 7 + speed * 2.8 : 0);

      // True 3D Y-axis rotation: facing right = 0, facing left = Math.PI
      const targetY = m.facing === 1 ? 0 : Math.PI;
      // Handle wrap-around smoothly
      let diff = targetY - a.currentY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      a.currentY += diff * Math.min(1, dt * 14);

      if (rotGroup.current) {
        rotGroup.current.rotation.y = a.currentY;
        // Dynamic bank lean into turns
        const turnLean = -diff * 0.35;
        rotGroup.current.rotation.z = THREE.MathUtils.lerp(
          rotGroup.current.rotation.z,
          turnLean,
          dt * 12
        );
      }

      // Procedural 3D Squash & Stretch
      let sy = 1;
      if (!m.grounded) {
        sy = THREE.MathUtils.clamp(1 + m.vy * 0.035, 0.88, 1.22);
      }
      if (m.sinceLand < 0.2) {
        sy = 1 - 0.25 * Math.sin((m.sinceLand / 0.2) * Math.PI);
      }
      if (m.sinceJump < 0.14) {
        sy = 1 + 0.22 * Math.sin((m.sinceJump / 0.14) * Math.PI);
      }
      if (squash.current) {
        squash.current.scale.y = THREE.MathUtils.lerp(squash.current.scale.y, sy, dt * 25);
        const sXZ = 1 / Math.sqrt(squash.current.scale.y);
        squash.current.scale.x = sXZ;
        squash.current.scale.z = sXZ;
      }

      // Body bob and forward sprint tilt — little hops while celebrating.
      if (bodyBob.current) {
        const bob = cheer !== null
          ? Math.abs(Math.sin(cheer * 9)) * 0.3
          : walking
          ? Math.abs(Math.sin(a.walk * 2)) * 0.045
          : Math.sin(a.t * 2.4) * 0.015;
        bodyBob.current.position.y = bob;
        const forwardLean = walking ? 0.12 : m.grounded ? 0 : -m.vy * 0.03;
        bodyBob.current.rotation.z = THREE.MathUtils.lerp(
          bodyBob.current.rotation.z,
          forwardLean,
          dt * 10
        );
      }

      // Abdomen secondary sway
      if (abdomen.current) {
        abdomen.current.rotation.z =
          Math.sin(a.t * 3) * 0.06 + (walking ? Math.cos(a.walk * 2) * 0.1 : 0);
        abdomen.current.rotation.y = walking ? Math.sin(a.walk) * 0.08 : 0;
      }

      // 6-Leg Tripod Gait in 3D
      legs.current.forEach((leg, i) => {
        if (!leg) return;
        const cfg = LEG_CONFIG[i];
        if (cheer !== null) {
          // Legs kick out on every hop.
          leg.rotation.z = THREE.MathUtils.lerp(leg.rotation.z, 0.5 + Math.sin(cheer * 9 + cfg.phase) * 0.35, dt * 14);
          leg.position.y = 0.42;
        } else if (walking) {
          const stride = Math.sin(a.walk * 2 + cfg.phase);
          const lift = Math.max(0, Math.cos(a.walk * 2 + cfg.phase)) * 0.25;
          leg.rotation.z = stride * 0.48;
          leg.position.y = 0.42 + lift * 0.08;
        } else if (!m.grounded) {
          // Legs tuck when airborne
          leg.rotation.z = THREE.MathUtils.lerp(leg.rotation.z, 0.35, dt * 10);
        } else {
          // Idle breathing on legs
          leg.rotation.z = THREE.MathUtils.lerp(
            leg.rotation.z,
            Math.sin(a.t * 2 + cfg.phase) * 0.03,
            dt * 10
          );
          leg.position.y = 0.42;
        }
      });

      // Head look & antenna physics
      if (head.current) {
        head.current.rotation.z =
          Math.sin(a.t * 1.8) * 0.04 + (walking ? 0.05 : 0);
      }
      const sway =
        Math.sin(a.t * 3.5) * 0.14 + (walking ? Math.sin(a.walk * 2) * 0.12 : 0) - m.vy * 0.02 + (cheer !== null ? Math.sin(cheer * 14) * 0.5 : 0);
      if (antennaL.current) antennaL.current.rotation.z = 0.38 + sway;
      if (antennaR.current) antennaR.current.rotation.z = 0.28 + sway * 0.85;

      // Blinking on both eyes
      if (eyeL.current && eyeR.current) {
        if (a.t > a.blinkAt) {
          const k = (a.t - a.blinkAt) / 0.14;
          const blinkScale = k < 1 ? Math.max(0.1, Math.abs(1 - 2 * k)) : 1;
          eyeL.current.scale.y = blinkScale;
          eyeR.current.scale.y = blinkScale;
          if (k >= 1) a.blinkAt = a.t + 2.5 + Math.random() * 3.5;
        }
      }
    });

    return (
      <group ref={ref}>
        {/* Dynamic 3D ground contact shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <circleGeometry args={[0.42, 28]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.38} depthWrite={false} />
        </mesh>

        {/* 3D Rotation Group (rotates smoothly around Y) */}
        <group ref={rotGroup}>
          <group ref={squash}>
            {/* 6 Articulated 3D Legs */}
            {LEG_CONFIG.map((cfg, i) => (
              <Leg3D
                key={i}
                legRef={(el) => {
                  legs.current[i] = el;
                }}
                x={cfg.x}
                side={i % 2 === 0 ? 1 : -1}
                angleY={cfg.angleY}
              />
            ))}

            <group ref={bodyBob}>
              {/* Thorax (Middle Body) */}
              <mesh position={[0.02, 0.54, 0]} scale={[0.16, 0.15, 0.15]} castShadow>
                <sphereGeometry args={[1, 24, 18]} />
                <meshStandardMaterial
                  color={CHITIN_DARK}
                  roughness={0.35}
                  metalness={0.2}
                />
              </mesh>

              {/* Explorer Scarf */}
              <mesh position={[0.11, 0.63, 0]} rotation={[0, 0, -0.35]}>
                <torusGeometry args={[0.11, 0.04, 10, 24]} />
                <meshStandardMaterial color={SCARF} roughness={0.65} />
              </mesh>
              {/* Scarf knot & fluttering tails */}
              <mesh position={[0.08, 0.58, 0.12]} rotation={[0.4, 0.2, -0.2]}>
                <boxGeometry args={[0.05, 0.12, 0.03]} />
                <meshStandardMaterial color={SCARF} roughness={0.65} />
              </mesh>

              {/* Segmented Abdomen (Gaster) */}
              <group ref={abdomen} position={[-0.22, 0.52, 0]}>
                {/* Abdomen main sphere */}
                <mesh scale={[0.34, 0.26, 0.26]} castShadow>
                  <sphereGeometry args={[1, 28, 20]} />
                  <meshStandardMaterial
                    color={CHITIN_BASE}
                    roughness={0.32}
                    metalness={0.18}
                  />
                </mesh>
                {/* Segment stripe 1 */}
                <mesh position={[-0.08, 0.01, 0]} scale={[0.05, 0.258, 0.258]}>
                  <sphereGeometry args={[1, 20, 16]} />
                  <meshStandardMaterial color={CHITIN_DARK} roughness={0.4} />
                </mesh>
                {/* Segment stripe 2 */}
                <mesh position={[0.06, 0.01, 0]} scale={[0.045, 0.255, 0.255]}>
                  <sphereGeometry args={[1, 20, 16]} />
                  <meshStandardMaterial color={CHITIN_DARK} roughness={0.4} />
                </mesh>
                {/* Belly highlight plate */}
                <mesh position={[0, -0.04, 0]} scale={[0.26, 0.2, 0.2]}>
                  <sphereGeometry args={[1, 16, 12]} />
                  <meshStandardMaterial color={CHITIN_BELLY} roughness={0.5} />
                </mesh>

                {/* 3D Explorer's Backpack */}
                <mesh position={[0.02, 0.26, 0]} rotation={[0, 0, 0.2]} castShadow>
                  <boxGeometry args={[0.22, 0.14, 0.26]} />
                  <meshStandardMaterial color={TEAL} roughness={0.45} />
                </mesh>
                {/* Backpack Gold Buckle */}
                <mesh position={[0.02, 0.26, 0]} rotation={[0, 0, 0.2]}>
                  <boxGeometry args={[0.04, 0.145, 0.27]} />
                  <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.25} />
                </mesh>
                {/* Rolled Bedroll / Map scroll strapped on top of pack */}
                <mesh
                  position={[0.02, 0.36, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry args={[0.055, 0.055, 0.28, 14]} />
                  <meshStandardMaterial color="#fef08a" roughness={0.7} />
                </mesh>
              </group>

              {/* Head */}
              <group ref={head} position={[0.22, 0.8, 0]}>
                {/* Main head volume */}
                <mesh scale={[0.25, 0.23, 0.24]} castShadow>
                  <sphereGeometry args={[1, 30, 24]} />
                  <meshStandardMaterial
                    color={CHITIN_HIGHLIGHT}
                    roughness={0.3}
                    metalness={0.15}
                  />
                </mesh>

                {/* Explorer Goggles / Brow Band */}
                <mesh position={[0.06, 0.08, 0]} rotation={[0, 0, -0.1]}>
                  <torusGeometry args={[0.23, 0.024, 8, 28]} />
                  <meshStandardMaterial color={INK} roughness={0.5} />
                </mesh>
                {/* Goggle brass rims */}
                <mesh position={[0.13, 0.08, 0.11]} rotation={[0, 0.3, 0]}>
                  <torusGeometry args={[0.065, 0.016, 8, 20]} />
                  <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0.13, 0.08, -0.11]} rotation={[0, -0.3, 0]}>
                  <torusGeometry args={[0.065, 0.016, 8, 20]} />
                  <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.2} />
                </mesh>

                {/* 3D Mandibles (Jaws) */}
                <mesh position={[0.24, -0.14, 0.06]} rotation={[0, 0.3, -0.4]}>
                  <coneGeometry args={[0.035, 0.12, 6]} />
                  <meshStandardMaterial color={CHITIN_DARK} roughness={0.4} />
                </mesh>
                <mesh position={[0.24, -0.14, -0.06]} rotation={[0, -0.3, -0.4]}>
                  <coneGeometry args={[0.035, 0.12, 6]} />
                  <meshStandardMaterial color={CHITIN_DARK} roughness={0.4} />
                </mesh>

                {/* Left Eye (+Z side) */}
                <group ref={eyeL} position={[0.11, 0.04, 0.15]} rotation={[0, 0.35, 0]}>
                  <mesh scale={[0.075, 0.09, 0.06]}>
                    <sphereGeometry args={[1, 18, 14]} />
                    <primitive object={eyeMaterial} attach="material" />
                  </mesh>
                  <mesh position={[0.035, -0.005, 0.03]} scale={[0.045, 0.055, 0.03]}>
                    <sphereGeometry args={[1, 14, 12]} />
                    <primitive object={pupilMaterial} attach="material" />
                  </mesh>
                  <mesh position={[0.045, 0.025, 0.05]} scale={0.015}>
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                </group>

                {/* Right Eye (-Z side) */}
                <group ref={eyeR} position={[0.11, 0.04, -0.15]} rotation={[0, -0.35, 0]}>
                  <mesh scale={[0.075, 0.09, 0.06]}>
                    <sphereGeometry args={[1, 18, 14]} />
                    <primitive object={eyeMaterial} attach="material" />
                  </mesh>
                  <mesh position={[0.035, -0.005, -0.03]} scale={[0.045, 0.055, 0.03]}>
                    <sphereGeometry args={[1, 14, 12]} />
                    <primitive object={pupilMaterial} attach="material" />
                  </mesh>
                  <mesh position={[0.045, 0.025, -0.05]} scale={0.015}>
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                </group>

                {/* Antennae with Glowing Teal Energy Tips */}
                {[
                  { r: antennaL, z: 0.09, x: 0.04 },
                  { r: antennaR, z: -0.09, x: 0.04 },
                ].map(({ r, z, x }, i) => (
                  <group key={i} ref={r} position={[x, 0.2, z]}>
                    <mesh position={[0, 0.14, 0]}>
                      <cylinderGeometry args={[0.014, 0.02, 0.28, 8]} />
                      <meshStandardMaterial color={INK} roughness={0.4} />
                    </mesh>
                    <mesh position={[0.08, 0.29, 0]} rotation={[0, 0, -0.85]}>
                      <cylinderGeometry args={[0.01, 0.014, 0.16, 8]} />
                      <meshStandardMaterial color={INK} roughness={0.4} />
                    </mesh>
                    {/* Glowing Crystal Orb */}
                    <mesh position={[0.15, 0.35, 0]} material={tipMaterial}>
                      <sphereGeometry args={[0.046, 14, 12]} />
                    </mesh>
                    <pointLight
                      position={[0.15, 0.35, 0]}
                      color={TEAL}
                      intensity={0.4}
                      distance={0.8}
                    />
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    );
  }
);
