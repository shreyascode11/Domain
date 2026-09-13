// Phase 0 tuning constants.
// These govern the hidden-DOM -> 3D mapping and the physical feel of traversal.
// Tune here, never scatter magic numbers through components.

/** Fixed pixel size of the hidden/flattened stage document. Kept fixed (not
 * responsive) for Phase 0 so the px -> world-unit mapping stays exact. */
export const STAGE_WIDTH = 900;
export const STAGE_HEIGHT = 520;

/** Pixels per world unit. 1 unit ~= a comfortable single-jump step. */
export const SCALE = 60;

/** Depth (z) step applied per unit of DOM nesting / stacking order, so the
 * scene reads as genuinely three-dimensional instead of a flat billboard. */
export const CONTAINER_DEPTH = -1.4;
export const DEPTH_PER_Z_INDEX = 0.18;

/** Extrusion depth (z-thickness) of a leaf platform slab. */
export const PLATFORM_DEPTH = 1.1;

/** Debounce, in ms, between the last keystroke and a re-render of the world.
 * The blueprint suggests ~120ms, but that is shorter than the pause between
 * keystrokes for most people — the world rebuilt on almost every letter,
 * through half-typed CSS. 250ms waits for a small pause instead, and invalid
 * CSS never reaches the world at all (see HiddenStage). */
export const RENDER_DEBOUNCE_MS = 250;

export const WORLD = {
  /** Fall below this height and you're returned to the start. The stage
   * itself spans roughly y = -4.3 … +4.3. Movement tuning lives in lib/physics. */
  respawnY: -9,
};
