/**
 * A tiny bus for one-off visual effects, so gameplay code (the player's
 * frame loop) can ask for dust or confetti without knowing how it's drawn.
 */

export type FxKind = "dust" | "land" | "poof" | "confetti" | "beacon";
export type FxEvent = { kind: FxKind; x: number; y: number; strength?: number };

type Listener = (e: FxEvent) => void;
const listeners = new Set<Listener>();

export const fx = {
  emit(e: FxEvent) {
    listeners.forEach((l) => l(e));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  /** Camera shake, in world units, decaying each frame. */
  shake: 0,
  addShake(amount: number) {
    fx.shake = Math.min(0.5, fx.shake + amount);
  },
};
