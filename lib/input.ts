/**
 * Input shared between the page (pointer, wheel, touch buttons) and the
 * frame loop. Plain mutable state rather than React state, so dragging the
 * camera or holding a touch button never re-renders anything.
 */

export const cameraInput = {
  /** Temporary look-around from right-drag, in radians. Springs back to 0. */
  lookYaw: 0,
  lookPitch: 0,
  dragging: false,
  /** Wheel zoom: 1 is the default framing. */
  zoom: 1,
};

export const touchInput = {
  left: false,
  right: false,
  jump: false,
};

export const LOOK_LIMIT = { yaw: 0.55, pitch: 0.35 };
/** Zoomed all the way out, a whole level (even a wide capstone) should fit in view. */
export const ZOOM_LIMIT = { min: 0.7, max: 2.6 };
