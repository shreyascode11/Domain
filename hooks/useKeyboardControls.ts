"use client";

import { useEffect, useRef } from "react";
import { touchInput } from "@/lib/input";

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

/** True while the keyboard is being used to type somewhere. */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest("input, textarea, select, [contenteditable], .cm-editor");
}

/**
 * Live movement keys for the player, read once per frame rather than via
 * React state. Keys control Dom whenever you aren't typing — no need to
 * click the world first. While an editor has focus, keys type; press Esc
 * to leave the editor and play.
 */
export function useKeyboardControls() {
  const keys = useRef<ControlState>({ left: false, right: false, jump: false });
  const merged = useRef<ControlState>({ left: false, right: false, jump: false });

  useEffect(() => {
    const clear = () => {
      keys.current.left = keys.current.right = keys.current.jump = false;
    };
    const down = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (!key || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      // Space on a focused button presses the button, not jump.
      if (key === "jump" && e.code === "Space" && e.target instanceof HTMLElement && e.target.closest("button, a[href], [role='button']")) return;
      if (e.target instanceof HTMLElement && e.target.closest("[role='dialog']")) return;
      e.preventDefault(); // no page scrolling on arrows/space
      keys.current[key] = true;
    };
    const up = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (key) keys.current[key] = false;
    };
    const focusIn = (e: FocusEvent) => {
      if (isTypingTarget(e.target)) clear();
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

  // Keyboard and on-screen touch buttons, combined.
  return {
    get current() {
      merged.current.left = keys.current.left || touchInput.left;
      merged.current.right = keys.current.right || touchInput.right;
      merged.current.jump = keys.current.jump || touchInput.jump;
      return merged.current;
    },
  };
}
