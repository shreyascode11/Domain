import type { Chapter } from "./levels";

/** The look of each chapter's world: sky, light, haze and scenery. */
export type Biome = {
  skyTop: string;
  skyMid: string;
  horizon: string;
  sun: string;
  sunIntensity: number;
  sunDir: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  fog: string;
  sea: string;
  seaGlow: string;
  ridgeNear: string;
  ridgeFar: string;
  rock: string;
  grass: string;
  accent: string;
  exposure: number;
};

export const BIOMES: Record<Chapter["biome"], Biome> = {
  // HTML — a clear morning over green hills.
  meadow: {
    skyTop: "#2d5fa8",
    skyMid: "#79aee0",
    horizon: "#ffd9a8",
    sun: "#fff1d6",
    sunIntensity: 3.0,
    sunDir: [-0.55, 0.75, 0.6],
    hemiSky: "#cfe6ff",
    hemiGround: "#4b5d37",
    fog: "#b9cde0",
    sea: "#e8eef7",
    seaGlow: "#ffe7c2",
    ridgeNear: "#5c7a63",
    ridgeFar: "#8fa9b8",
    rock: "#6f6a60",
    grass: "#6e9b4a",
    accent: "#2dd4bf",
    exposure: 1.0,
  },
  // CSS — warm afternoon over desert mesas.
  desert: {
    skyTop: "#3a5f9e",
    skyMid: "#e8b387",
    horizon: "#ffcf8c",
    sun: "#ffe2b0",
    sunIntensity: 3.2,
    sunDir: [0.5, 0.6, 0.62],
    hemiSky: "#ffe2c4",
    hemiGround: "#7a4c2a",
    fog: "#e7c3a0",
    sea: "#f4dcc2",
    seaGlow: "#ffc98a",
    ridgeNear: "#a8643c",
    ridgeFar: "#d49a70",
    rock: "#a4744a",
    grass: "#c9a15c",
    accent: "#f59e0b",
    exposure: 0.95,
  },
  // Flexbox — golden-hour canyon.
  canyon: {
    skyTop: "#1f2c57",
    skyMid: "#8d5e8a",
    horizon: "#ff9e5e",
    sun: "#ffc48a",
    sunIntensity: 2.8,
    sunDir: [-0.6, 0.45, 0.66],
    hemiSky: "#ffc9a8",
    hemiGround: "#40243a",
    fog: "#b07a7e",
    sea: "#d9a7a0",
    seaGlow: "#ff9e6b",
    ridgeNear: "#6e3b45",
    ridgeFar: "#a0627a",
    rock: "#7c4a3c",
    grass: "#b98a4c",
    accent: "#fb923c",
    exposure: 1.0,
  },
  // JavaScript — a crystal night.
  crystal: {
    skyTop: "#070b24",
    skyMid: "#23245e",
    horizon: "#6a4bc4",
    sun: "#bfd4ff",
    sunIntensity: 2.4,
    sunDir: [0.45, 0.7, 0.55],
    hemiSky: "#8fa8ff",
    hemiGround: "#1a1238",
    fog: "#2b2a5e",
    sea: "#3b3480",
    seaGlow: "#7f6bff",
    ridgeNear: "#241f4d",
    ridgeFar: "#3a3378",
    rock: "#3a3558",
    grass: "#4fd1c5",
    accent: "#a78bfa",
    exposure: 1.1,
  },
};
