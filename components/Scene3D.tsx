"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Line, Sparkles, Stars, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA, N8AO } from "@react-three/postprocessing";
import * as THREE from "three";
import { useLevelStore } from "@/lib/store";
import { CHAPTERS, LEVELS } from "@/lib/levels";
import { BIOMES, type Biome } from "@/lib/biomes";
import { cloudTexture } from "@/lib/textures";
import { SCALE, STAGE_HEIGHT, STAGE_WIDTH } from "@/lib/constants";
import { Platform } from "./Platform";
import { Player } from "./Player";
import { Effects } from "./Effects";

function seeded(n: number) {
  const x = Math.sin(n * 91.3 + 17.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Sky dome: gradient, a sun disc and its glow, all from the biome. */
function Sky({ biome }: { biome: Biome }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color() },
          mid: { value: new THREE.Color() },
          horizon: { value: new THREE.Color() },
          sunColor: { value: new THREE.Color() },
          sunDir: { value: new THREE.Vector3() },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 sunColor; uniform vec3 sunDir;
          varying vec3 vDir;
          void main(){
            float h = vDir.y;
            vec3 c = h > 0.0
              ? mix(mix(horizon, mid, smoothstep(0.0, 0.3, h)), top, smoothstep(0.3, 0.95, h))
              : mix(horizon, mid * 0.5, smoothstep(0.0, 0.5, -h));
            float d = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
            c += sunColor * (pow(d, 900.0) * 3.0 + pow(d, 24.0) * 0.35 + pow(d, 4.0) * 0.12);
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    []
  );
  material.uniforms.top.value.set(biome.skyTop);
  material.uniforms.mid.value.set(biome.skyMid);
  material.uniforms.horizon.value.set(biome.horizon);
  material.uniforms.sunColor.value.set(biome.sun);
  material.uniforms.sunDir.value.set(biome.sunDir[0] * 0.6, Math.max(0.12, biome.sunDir[1] * 0.35), -1).normalize();
  return (
    <mesh material={material} renderOrder={-10}>
      <sphereGeometry args={[200, 48, 24]} />
    </mesh>
  );
}

/** A mountain ridge silhouette: a jagged band of peaks, far behind the page. */
function Ridge({ z, y, height, color, seed, width = 260 }: { z: number; y: number; height: number; color: string; seed: number; width?: number }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const steps = 70;
    shape.moveTo(-width / 2, -30);
    for (let i = 0; i <= steps; i++) {
      const x = -width / 2 + (i / steps) * width;
      const n = Math.sin(i * 0.37 + seed) * 0.5 + Math.sin(i * 0.11 + seed * 2) * 0.8 + seeded(i + seed * 13) * 0.5;
      shape.lineTo(x, Math.max(0, n * 0.5 + 0.6) * height);
    }
    shape.lineTo(width / 2, -30);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [height, seed, width]);
  return (
    <mesh geometry={geometry} position={[0, y, z]}>
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </mesh>
  );
}

/** Soft clouds drifting slowly across the far sky. */
function Clouds({ tint }: { tint: string }) {
  const tex = cloudTexture();
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: (seeded(i + 3) - 0.5) * 180,
        y: 6 + seeded(i + 9) * 18,
        z: -70 - seeded(i + 21) * 50,
        s: 14 + seeded(i + 33) * 18,
        speed: 0.3 + seeded(i + 44) * 0.5,
      })),
    []
  );
  useFrame((_, dt) => {
    group.current?.children.forEach((c, i) => {
      c.position.x += clouds[i].speed * dt;
      if (c.position.x > 100) c.position.x = -100;
    });
  });
  if (!tex) return null;
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <sprite key={i} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.5, 1]}>
          <spriteMaterial map={tex} color={tint} transparent opacity={0.85} depthWrite={false} fog />
        </sprite>
      ))}
    </group>
  );
}

/** A slowly churning sea of cloud far below — where a fall goes. */
function CloudSea({ biome }: { biome: Biome }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        fog: false,
        uniforms: { time: { value: 0 }, base: { value: new THREE.Color() }, glow: { value: new THREE.Color() } },
        vertexShader: `varying vec2 vUv; varying vec3 vWorld; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `
          uniform float time; uniform vec3 base; uniform vec3 glow; varying vec2 vUv; varying vec3 vWorld;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
          float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
          void main(){
            vec2 p = vWorld.xz * 0.06 + vec2(time * 0.02, time * 0.01);
            float n = fbm(p) * 0.7 + fbm(p * 2.7 - time * 0.015) * 0.3;
            float edge = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.7, vUv.y) * smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
            vec3 c = mix(base * 0.8, glow, smoothstep(0.35, 0.8, n));
            gl_FragColor = vec4(c, edge * (0.65 + n * 0.35));
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    []
  );
  const mesh = useRef<THREE.Mesh>(null);
  useEffect(() => {
    material.uniforms.base.value.set(biome.sea);
    material.uniforms.glow.value.set(biome.seaGlow);
  }, [material, biome]);
  useFrame((_, dt) => {
    const m = mesh.current?.material as THREE.ShaderMaterial | undefined;
    if (m) m.uniforms.time.value += dt;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -11, -30]} material={material}>
      <planeGeometry args={[320, 140, 1, 1]} />
    </mesh>
  );
}

/** Distant floating islands with a few trees: depth and scale, never reachable. */
function Islands({ biome }: { biome: Biome }) {
  const group = useRef<THREE.Group>(null);
  const t = useRef(0);
  const islands = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: (seeded(i) - 0.5) * 120,
        y: -6 + seeded(i + 40) * 10,
        z: -34 - seeded(i + 80) * 36,
        s: 1.6 + seeded(i + 120) * 2.6,
        rot: seeded(i + 160) * Math.PI,
        trees: Math.floor(seeded(i + 200) * 4),
      })),
    []
  );
  useFrame((_, dt) => {
    t.current += dt;
    group.current?.children.forEach((c, i) => {
      c.position.y = islands[i].y + Math.sin(t.current * 0.25 + i) * 0.3;
    });
  });
  return (
    <group ref={group}>
      {islands.map((isl, i) => (
        <group key={i} position={[isl.x, isl.y, isl.z]} rotation={[0, isl.rot, 0]} scale={isl.s}>
          <mesh position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.3, 2.2, 7]} />
            <meshStandardMaterial color={biome.rock} roughness={1} flatShading />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[1.35, 1.25, 0.35, 7]} />
            <meshStandardMaterial color={biome.grass} roughness={0.95} flatShading />
          </mesh>
          {Array.from({ length: isl.trees }).map((_, k) => (
            <mesh key={k} position={[(seeded(i * 7 + k) - 0.5) * 1.6, 0.8, (seeded(i * 11 + k) - 0.5) * 1.2]}>
              <coneGeometry args={[0.28, 1.1, 6]} />
              <meshStandardMaterial color={biome.ridgeNear} roughness={1} flatShading />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** The page itself: a faint frame marking the edges of <body>, just behind the blocks. */
function PageFrame() {
  const w = STAGE_WIDTH / SCALE;
  const h = STAGE_HEIGHT / SCALE;
  const z = -1.25;
  const pts = useMemo<[number, number, number][]>(
    () => [
      [-w / 2, -h / 2, z],
      [w / 2, -h / 2, z],
      [w / 2, h / 2, z],
      [-w / 2, h / 2, z],
      [-w / 2, -h / 2, z],
    ],
    [w, h, z]
  );
  return (
    <group>
      <Line points={pts} color="#ffffff" lineWidth={1} transparent opacity={0.22} dashed dashSize={0.35} gapSize={0.25} />
      <Text position={[-w / 2 + 0.1, h / 2 - 0.12, z]} fontSize={0.22} color="#ffffff" fillOpacity={0.4} anchorX="left" anchorY="top">
        {"<body>"}
      </Text>
    </group>
  );
}

/**
 * The playable world: whatever the page most recently measured, rendered as
 * real geometry — plus scenery (sky, ridges, islands, cloud sea) well
 * outside the page, which can never be stood on.
 */
export function Scene3D() {
  const worldObjects = useLevelStore((s) => s.worldObjects);
  const loadToken = useLevelStore((s) => s.measuredLoadToken);
  const select = useLevelStore((s) => s.select);
  const chapter = useLevelStore((s) => LEVELS[s.levelIndex].chapter);
  const biome = BIOMES[CHAPTERS.find((c) => c.number === chapter)!.biome];
  const night = biome === BIOMES.crystal;
  const [sx, sy, sz] = biome.sunDir;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 42, position: [4, 3, 12], near: 0.1, far: 400 }}
      gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: biome.exposure, powerPreference: "high-performance" }}
      onPointerMissed={() => select(null)}
    >
      <fog attach="fog" args={[biome.fog, 30, 140]} />
      <Sky biome={biome} />
      {night && <Stars radius={150} depth={40} count={2500} factor={4} saturation={0} fade speed={0.3} />}

      <hemisphereLight args={[biome.hemiSky, biome.hemiGround, 0.75]} />
      <directionalLight
        position={[sx * 14, sy * 14, sz * 14]}
        color={biome.sun}
        intensity={biome.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
      />
      {/* Cool rim light from behind, to separate blocks from the sky. */}
      <directionalLight position={[-sx * 10, 4, -12]} color={biome.hemiSky} intensity={0.9} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} color={biome.sun} position={[-6, 5, 6]} scale={[10, 5, 1]} />
        <Lightformer form="rect" intensity={1.2} color={biome.hemiSky} position={[6, 6, -4]} scale={[10, 5, 1]} />
        <Lightformer form="circle" intensity={0.8} color="#ffffff" position={[0, 10, 0]} scale={4} />
      </Environment>

      <Ridge z={-120} y={-14} height={34} color={biome.ridgeFar} seed={1.3} width={420} />
      <Ridge z={-85} y={-14} height={24} color={biome.ridgeNear} seed={4.1} width={320} />
      <Clouds tint={night ? "#8f86d6" : "#ffffff"} />
      <CloudSea biome={biome} />
      <Islands biome={biome} />
      <Sparkles count={60} scale={[26, 12, 8]} position={[0, 0, -1]} size={2.2} speed={0.25} opacity={0.6} color={night ? "#b9a8ff" : "#fff2c4"} />

      <PageFrame />
      {worldObjects.map((obj) => (
        // Keyed per level load, so a new level's blocks never glide in from
        // where the previous level's blocks were.
        <Platform key={`${loadToken}:${obj.key}`} object={obj} />
      ))}

      <Player />
      <Effects />

      <EffectComposer multisampling={0}>
        <N8AO aoRadius={1.1} intensity={2.2} distanceFalloff={1.2} quality="medium" halfRes />
        <SMAA />
        <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
        <Vignette offset={0.3} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  );
}
