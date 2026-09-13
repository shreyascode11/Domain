"use client";

import { useEffect, useRef } from "react";

export type ControlState = {
  left: boolean;
  right: boolean;
  jump: boolean;
};

// The world is a side-on page, so there's no depth to walk into: W and Up
// jump, like Space.
const KEY_MAP: Record<string, keyof ControlState> = {
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "jump",
  KeyW: "jump",
  ArrowUp: "jump",
};

/**
 * Keys belong to whatever has focus. Typing `display` in the CSS panel must
 * not walk the player left, and pressing Space on a focused button must
 * press the button — not jump.
 */
function belongsToSomethingElse(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest("input, textarea, select, button, a[href], [contenteditable], .cm-editor, [role='dialog']");
}

/** Live keyboard state for the player controller, read once per physics
 * frame rather than via re-rendering React on every keystroke. */
export function useKeyboardControls() {
  const state = useRef<ControlState>({ left: false, right: false, jump: false });

  useEffect(() => {
    const clear = () => {
      for (const k of Object.keys(state.current) as (keyof ControlState)[]) state.current[k] = false;
    };
    const down = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (!key || belongsToSomethingElse(e.target)) return;
      e.preventDefault(); // no page scrolling on arrows/space
      state.current[key] = true;
    };
    const up = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      state.current[key] = false;
    };
    const focusIn = (e: FocusEvent) => {
      if (belongsToSomethingElse(e.target)) clear();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("focusin", focusIn);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("focusin", focusIn);
    };
  }, []);

  return state;
}
