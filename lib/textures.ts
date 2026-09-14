import * as THREE from "three";

/**
 * Procedural textures, drawn once on a canvas at startup: no image files, no
 * network. Greyscale detail maps that get multiplied by each block's real
 * CSS background colour, so the block keeps the colour the CSS gave it.
 */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function valueNoise(size: number, cells: number, rand: () => number) {
  const grid = Array.from({ length: cells + 1 }, () => Array.from({ length: cells + 1 }, rand));
  for (let i = 0; i <= cells; i++) {
    grid[cells][i] = grid[0][i];
    grid[i][cells] = grid[i][0];
  }
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * cells;
      const gy = (y / size) * cells;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const a = grid[y0][x0] + (grid[y0][x0 + 1] - grid[y0][x0]) * sx;
      const b = grid[y0 + 1][x0] + (grid[y0 + 1][x0 + 1] - grid[y0 + 1][x0]) * sx;
      out[y * size + x] = a + (b - a) * sy;
    }
  }
  return out;
}

function fbm(size: number, seed: number) {
  const rand = rng(seed);
  const total = new Float32Array(size * size);
  let amp = 1;
  let norm = 0;
  for (const cells of [4, 8, 16, 32, 64]) {
    const layer = valueNoise(size, cells, rand);
    for (let i = 0; i < total.length; i++) total[i] += layer[i] * amp;
    norm += amp;
    amp *= 0.55;
  }
  for (let i = 0; i < total.length; i++) total[i] /= norm;
  return total;
}

let stone: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture; rough: THREE.CanvasTexture } | null = null;

/** Weathered stone: soft mottling, a few fine cracks, darker pits. */
export function stoneTextures() {
  if (stone || typeof document === "undefined") return stone;
  const size = 256;
  const n = fbm(size, 7);
  const fine = fbm(size, 91);

  const make = (fill: (i: number) => number) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = Math.max(0, Math.min(255, fill(i)));
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  };

  const albedo = make((i) => 190 + (n[i] - 0.5) * 90 + (fine[i] - 0.5) * 40);
  // Cracks: thin dark wandering lines drawn over the albedo.
  const actx = albedo.getContext("2d")!;
  const rand = rng(33);
  actx.strokeStyle = "rgba(40,36,30,0.35)";
  actx.lineWidth = 1;
  for (let c = 0; c < 7; c++) {
    let x = rand() * size;
    let y = rand() * size;
    actx.beginPath();
    actx.moveTo(x, y);
    for (let k = 0; k < 14; k++) {
      x += (rand() - 0.5) * 22;
      y += (rand() - 0.5) * 22;
      actx.lineTo(x, y);
    }
    actx.stroke();
  }

  const bump = make((i) => 128 + (n[i] - 0.5) * 160 + (fine[i] - 0.5) * 90);
  const rough = make((i) => 200 + (fine[i] - 0.5) * 80);

  const toTex = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  stone = { map: toTex(albedo, true), bump: toTex(bump, false), rough: toTex(rough, false) };
  return stone;
}

let cloud: THREE.CanvasTexture | null = null;

/** A soft, lumpy cloud puff for billboards. */
export function cloudTexture() {
  if (cloud || typeof document === "undefined") return cloud;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(12);
  for (let i = 0; i < 26; i++) {
    const x = size * (0.2 + rand() * 0.6);
    const y = size * (0.45 + (rand() - 0.5) * 0.25);
    const r = size * (0.1 + rand() * 0.16);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  cloud = new THREE.CanvasTexture(canvas);
  cloud.colorSpace = THREE.SRGBColorSpace;
  return cloud;
}
