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
};

const AMBER = "#f59e0b";
const AMBER_DARK = "#b45309";
const AMBER_LIGHT = "#fbbf57";
const TEAL = "#2dd4bf";
const GOLD = "#e6c36a";
const INK = "#101826";

const LEG_X = [-0.1, -0.1, 0.02, 0.02, 0.14, 0.14];
/** Tripod gait: legs 0, 3, 4 swing opposite to 1, 2, 5. */
const LEG_PHASE = [0, Math.PI, Math.PI, 0, 0, Math.PI];

/** One leg: a hip joint that swings, with an upper and lower segment. */
function Leg({ legRef, x, side }: { legRef: (el: THREE.Group | null) => void; x: number; side: 1 | -1 }) {
  return (
    <group ref={legRef} position={[x, 0.36, 0.1 * side]}>
      <mesh position={[0, -0.09, 0.05 * side]} rotation={[0.55 * side, 0, 0]} castShadow>
        <capsuleGeometry args={[0.028, 0.16, 4, 8]} />
        <meshStandardMaterial color={AMBER_DARK} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.25, 0.11 * side]} rotation={[-0.15 * side, 0, 0]} castShadow>
        <capsuleGeometry args={[0.024, 0.16, 4, 8]} />
        <meshStandardMaterial color={INK} roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * Dom — the player. A small explorer ant, after the chapter's fable. Built
 * from primitives, animated from the controller's motion: a tripod walk
 * cycle, squash on landing, stretch on take-off, a quick flip when turning,
 * idle bob, antenna sway and blinking.
 *
 * Modelled facing +x; facing left mirrors on x so the eyes stay on the
 * camera's side.
 */
export const Mascot = forwardRef<THREE.Group, { motion: RefObject<MascotMotion> }>(function Mascot({ motion }, ref) {
  const flip = useRef<THREE.Group>(null);
  const squash = useRef<THREE.Group>(null);
  const bodyBob = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const antennaL = useRef<THREE.Group>(null);
  const antennaR = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const anim = useRef({ walk: 0, flipX: 1, t: 0, blinkAt: 2.5 });
  const tipMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL, emissiveIntensity: 2.2, toneMapped: false }),
    []
  );

  useFrame((_, rawDelta) => {
    const m = motion.current;
    if (!m) return;
    const dt = Math.min(rawDelta, 1 / 20);
    const a = anim.current;
    a.t += dt;

    const speed = Math.abs(m.vx);
    const walking = m.grounded && speed > 0.3;
    a.walk += dt * (walking ? 5 + speed * 2.2 : 0);

    // Turn: flip through zero on x for a snappy, readable direction change.
    a.flipX += (m.facing - a.flipX) * Math.min(1, dt * 16);
    if (flip.current) flip.current.scale.x = Math.abs(a.flipX) < 0.08 ? 0.08 * Math.sign(a.flipX || 1) : a.flipX;

    // Squash & stretch.
    let sy = 1;
    if (!m.grounded) sy = THREE.MathUtils.clamp(1 + m.vy * 0.025, 0.9, 1.14);
    if (m.sinceLand < 0.18) sy = 1 - 0.22 * Math.sin((m.sinceLand / 0.18) * Math.PI);
    if (m.sinceJump < 0.12) sy = 1 + 0.16 * Math.sin((m.sinceJump / 0.12) * Math.PI);
    if (squash.current) {
      squash.current.scale.y += (sy - squash.current.scale.y) * Math.min(1, dt * 30);
      squash.current.scale.x = squash.current.scale.z = 1 / Math.sqrt(squash.current.scale.y);
    }

    // Body bob and lean.
    if (bodyBob.current) {
      const bob = walking ? Math.abs(Math.sin(a.walk * 2)) * 0.035 : Math.sin(a.t * 2.2) * 0.012;
      bodyBob.current.position.y = bob;
      const lean = walking ? -0.08 : m.grounded ? 0 : THREE.MathUtils.clamp(-m.vy * 0.02, -0.2, 0.2);
      bodyBob.current.rotation.z += (lean - bodyBob.current.rotation.z) * Math.min(1, dt * 10);
    }

    legs.current.forEach((leg, i) => {
      if (!leg) return;
      const phase = LEG_PHASE[i];
      const target = walking ? Math.sin(a.walk * 2 + phase) * 0.55 : m.grounded ? 0 : 0.35;
      leg.rotation.z += (target - leg.rotation.z) * Math.min(1, dt * 18);
    });

    // Head and antennae.
    if (head.current) head.current.rotation.z = Math.sin(a.t * 1.6) * 0.05 + (m.grounded ? 0 : 0.1);
    const sway = Math.sin(a.t * 3.1) * 0.12 + (walking ? Math.sin(a.walk * 2) * 0.1 : 0) - m.vy * 0.015;
    if (antennaL.current) antennaL.current.rotation.z = 0.35 + sway;
    if (antennaR.current) antennaR.current.rotation.z = 0.25 + sway * 0.8;

    // Blink.
    if (eyes.current) {
      if (a.t > a.blinkAt) {
        const k = (a.t - a.blinkAt) / 0.14;
        eyes.current.scale.y = k < 1 ? Math.max(0.1, Math.abs(1 - 2 * k)) : 1;
        if (k >= 1) a.blinkAt = a.t + 2 + Math.random() * 3;
      }
    }
  });

  return (
    <group ref={ref}>
      {/* soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.36, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      <group ref={flip}>
        <group ref={squash}>
          {LEG_X.map((x, i) => (
            <Leg
              key={i}
              legRef={(el) => {
                legs.current[i] = el;
              }}
              x={x}
              side={i % 2 === 0 ? 1 : -1}
            />
          ))}

          <group ref={bodyBob}>
            {/* abdomen */}
            <mesh position={[-0.2, 0.52, 0]} scale={[0.3, 0.24, 0.24]} castShadow>
              <sphereGeometry args={[1, 24, 16]} />
              <meshStandardMaterial color={AMBER} roughness={0.35} metalness={0.05} />
            </mesh>
            {/* abdomen stripes */}
            <mesh position={[-0.24, 0.53, 0]} scale={[0.04, 0.235, 0.235]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={AMBER_DARK} roughness={0.4} />
            </mesh>
            {/* explorer's satchel */}
            <mesh position={[-0.17, 0.74, 0]} rotation={[0, 0, 0.25]} castShadow>
              <boxGeometry args={[0.2, 0.12, 0.26]} />
              <meshStandardMaterial color={TEAL} roughness={0.45} />
            </mesh>
            <mesh position={[-0.17, 0.74, 0]} rotation={[0, 0, 0.25]}>
              <boxGeometry args={[0.035, 0.125, 0.27]} />
              <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* thorax */}
            <mesh position={[0.03, 0.55, 0]} scale={[0.15, 0.14, 0.14]} castShadow>
              <sphereGeometry args={[1, 20, 14]} />
              <meshStandardMaterial color={AMBER_DARK} roughness={0.4} />
            </mesh>
            {/* scarf */}
            <mesh position={[0.1, 0.63, 0]} rotation={[0, 0, -0.3]}>
              <torusGeometry args={[0.1, 0.035, 8, 20]} />
              <meshStandardMaterial color="#ef4444" roughness={0.6} />
            </mesh>

            {/* head */}
            <group ref={head} position={[0.2, 0.8, 0]}>
              <mesh scale={[0.24, 0.22, 0.23]} castShadow>
                <sphereGeometry args={[1, 28, 20]} />
                <meshStandardMaterial color={AMBER_LIGHT} roughness={0.35} />
              </mesh>
              {/* cheeks */}
              <mesh position={[0.1, -0.07, 0.17]} scale={[0.05, 0.03, 0.02]}>
                <sphereGeometry args={[1, 12, 8]} />
                <meshStandardMaterial color="#fb7185" roughness={0.8} />
              </mesh>
              {/* eyes — on the camera side */}
              <group ref={eyes} position={[0.06, 0.03, 0.18]}>
                {[0, 0.13].map((dx, i) => (
                  <group key={i} position={[dx, i === 0 ? 0 : 0.01, i === 0 ? 0.02 : -0.02]}>
                    <mesh scale={[0.07, 0.085, 0.05]}>
                      <sphereGeometry args={[1, 16, 12]} />
                      <meshStandardMaterial color="#ffffff" roughness={0.2} />
                    </mesh>
                    <mesh position={[0.02, -0.005, 0.035]} scale={[0.04, 0.05, 0.03]}>
                      <sphereGeometry args={[1, 12, 10]} />
                      <meshStandardMaterial color={INK} roughness={0.1} />
                    </mesh>
                    <mesh position={[0.03, 0.02, 0.06]} scale={0.012}>
                      <sphereGeometry args={[1, 8, 6]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                  </group>
                ))}
              </group>
              {/* antennae */}
              {[
                { r: antennaL, z: 0.08, x: 0.02 },
                { r: antennaR, z: -0.08, x: 0.08 },
              ].map(({ r, z, x }, i) => (
                <group key={i} ref={r} position={[x, 0.17, z]}>
                  <mesh position={[0, 0.12, 0]}>
                    <cylinderGeometry args={[0.013, 0.018, 0.24, 6]} />
                    <meshStandardMaterial color={INK} />
                  </mesh>
                  <mesh position={[0.07, 0.25, 0]} rotation={[0, 0, -0.9]}>
                    <cylinderGeometry args={[0.01, 0.013, 0.14, 6]} />
                    <meshStandardMaterial color={INK} />
                  </mesh>
                  <mesh position={[0.13, 0.3, 0]} material={tipMaterial}>
                    <sphereGeometry args={[0.04, 12, 10]} />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
