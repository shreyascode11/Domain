import { listenersOf } from "./jsRun";

/**
 * The live stage page — the real document the world is built from — as a
 * small registry, so the 3D view can hand a click to the actual element it
 * shows, and lessons can ask questions of the actual DOM.
 */

let doc: Document | null = null;
let elements = new Map<string, Element>();

export function setStage(d: Document, map: Map<string, Element>) {
  doc = d;
  elements = map;
}

/**
 * A real click on the real element — `addEventListener("click", …)` hears
 * it. A genuine mouse click also focuses whatever's focusable before the
 * click fires (so `:focus` rules apply); dispatching a bare click event
 * alone does not, so it's done explicitly here.
 */
export function clickElement(key: string) {
  const el = elements.get(key);
  if (!el || !doc?.defaultView) return false;
  const win = doc.defaultView as Window & typeof globalThis;
  if (el instanceof win.HTMLElement) el.focus();
  el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, view: win }));
  return true;
}

export function countMatches(selector: string) {
  try {
    return doc?.querySelectorAll(selector).length ?? 0;
  } catch {
    return 0;
  }
}

export function listenersFor(key: string) {
  const el = elements.get(key);
  return el ? listenersOf(doc?.defaultView, el) : [];
}
