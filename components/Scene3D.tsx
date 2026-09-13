"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import * as THREE from "three";
import { useLevelStore } from "@/lib/store";
import { Platform } from "./Platform";
import { Player } from "./Player";

/** A dusk sky dome: deep navy overhead, warm ember at the horizon. */
function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color("#060b1c") },
          mid: { value: new THREE.Color("#1a2c52") },
          horizon: { value: new THREE.Color("#d9774a") },
          below: { value: new THREE.Color("#120d1c") },
        },
        vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 below;
          varying vec3 vPos;
          void main(){
            float h = vPos.y;
            vec3 c = h > 0.0
              ? mix(mix(horizon, mid, smoothstep(0.0, 0.28, h)), top, smoothstep(0.28, 0.9, h))
              : mix(horizon * 0.55, below, smoothstep(0.0, 0.35, -h));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    []
  );
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[120, 32, 16]} />
    </mesh>
  );
}

function seeded(n: number) {
  const x = Math.sin(n * 91.3 + 17.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Distant floating islands for depth — far behind and below the page, never part of it. */
function DistantIslands() {
  const group = useRef<THREE.Group>(null);
  const islands = useMemo(
    () =>
      // Far back and low, in the haze — nothing that could be mistaken for a
      // platform you can reach.
      Array.from({ length: 14 }, (_, i) => ({
        x: (seeded(i) - 0.5) * 150,
        y: -14 - seeded(i + 40) * 16,
        z: -55 - seeded(i + 80) * 35,
        s: 1.4 + seeded(i + 120) * 2.2,
        rot: seeded(i + 160) * Math.PI,
      })),
    []
  );
  useFrame(({ clock }) => {
    group.current?.children.forEach((c, i) => {
      c.position.y = islands[i].y + Math.sin(clock.getElapsedTime() * 0.25 + i) * 0.25;
    });
  });
  return (
    <group ref={group}>
      {islands.map((isl, i) => (
        <group key={i} position={[isl.x, isl.y, isl.z]} rotation={[0, isl.rot, 0]} scale={isl.s}>
          <mesh scale={[1.3, 0.5, 1]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#2a2f45" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0, 0.42, 0]} scale={[1.25, 0.14, 0.95]}>
            <cylinderGeometry args={[1, 0.9, 1, 7]} />
            <meshStandardMaterial color="#2f5a4f" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * The playable 3D world: whatever the hidden DOM most recently measured,
 * rendered as real geometry. Everything the player can touch came from
 * lib/layout.ts's read-back of the browser's own layout engine; the sky
 * and islands are scenery, well outside the page.
 */
export function Scene3D() {
  const worldObjects = useLevelStore((s) => s.worldObjects);
  const loadToken = useLevelStore((s) => s.measuredLoadToken);
  const select = useLevelStore((s) => s.select);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 46, position: [0, 3, 8], near: 0.1, far: 300 }}
      gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={() => select(null)}
    >
      <fog attach="fog" args={["#2a2140", 24, 78]} />
      <SkyDome />
      <Stars radius={90} depth={30} count={1800} factor={3.2} saturation={0} fade speed={0.4} />

      <hemisphereLight args={["#a8c8ff", "#3b2414", 0.55]} />
      <directionalLight
        position={[-7, 11, 9]}
        color="#ffd6a5"
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <directionalLight position={[8, 5, -10]} color="#6fd3ff" intensity={1.1} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffb870" position={[-6, 4, 6]} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#7cc7ff" position={[6, 6, -4]} scale={[8, 4, 1]} />
        <Lightformer form="circle" intensity={1} color="#ffffff" position={[0, 10, 0]} scale={4} />
      </Environment>

      <DistantIslands />
      <Sparkles count={70} scale={[26, 12, 6]} position={[0, 0, -1]} size={2.4} speed={0.25} opacity={0.7} color="#ffd98a" />

      {worldObjects.map((obj) => (
        // Keyed per level load, so a new level's blocks never glide in from
        // where the previous level's blocks were.
        <Platform key={`${loadToken}:${obj.key}`} object={obj} />
      ))}

      <Player />

      <EffectComposer multisampling={0}>
        <SMAA />
        <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
        <Vignette offset={0.28} darkness={0.62} />
      </EffectComposer>
    </Canvas>
  );
}
