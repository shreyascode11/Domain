import { CONTAINER_DEPTH, DEPTH_PER_Z_INDEX, PLATFORM_DEPTH, SCALE } from "./constants";
import type { CssRule } from "./cssParse";

/** What the in-world inspector shows for an element (blueprint §7.4). */
export type InspectInfo = {
  selector: string; // e.g. div.stone.start
  breadcrumb: string[]; // ancestors → element
  width: number;
  height: number;
  box: {
    boxSizing: string;
    margin: [number, number, number, number];
    padding: [number, number, number, number];
    border: [number, number, number, number];
  };
  display: string;
  position: string;
  /** The rules in the learner's CSS that match this element, in file order. */
  rules: { selector: string; line: number; decls: { prop: string; value: string }[] }[];
  /** If the parent is a flex container: the settings that placed this element. */
  flexParent: null | {
    selector: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    gap: string;
    flexWrap: string;
  };
  /** If this element is itself a flex container. */
  flexSelf: null | {
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    gap: string;
  };
};

/**
 * A single measured element from the real, hidden DOM: its actual computed
 * layout box, in CSS pixels, exactly as the browser's own engine placed it.
 * Nothing here is invented — it is a read-back of getBoundingClientRect()
 * and getComputedStyle(), per the blueprint's Inviolable Rule #1.
 */
export type Box = {
  key: string;
  tag: string;
  id: string;
  className: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  depth: number;
  isLeaf: boolean;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  visible: boolean;
  inspect: InspectInfo;
};

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"]);

function selectorOf(el: Element) {
  let s = el.tagName.toLowerCase();
  if (el.id) s += `#${el.id}`;
  for (const c of Array.from(el.classList)) s += `.${c}`;
  return s;
}

const px = (v: string) => parseFloat(v) || 0;

function matchingRules(el: Element, rules: CssRule[]) {
  const out: InspectInfo["rules"] = [];
  for (const r of rules) {
    if (!r.selector) continue;
    try {
      if (el.matches(r.selector)) {
        out.push({ selector: r.selector, line: r.line, decls: r.decls.map(({ prop, value }) => ({ prop, value })) });
      }
    } catch {
      /* invalid selector — the validator already reported it */
    }
  }
  return out;
}

/**
 * Walks the real (hidden) document produced from the learner's HTML+CSS and
 * reads back every element's true computed layout. This must run against a
 * document the browser has actually laid out (an attached iframe), never a
 * virtual approximation, so CSS edge cases are inherited rather than
 * re-implemented and inevitably gotten wrong.
 */
export function measureDocument(doc: Document, rules: CssRule[], elements?: Map<string, Element>): Box[] {
  const boxes: Box[] = [];
  const body = doc.body;
  const view = doc.defaultView;
  if (!body || !view) return boxes;

  const walk = (el: Element, depth: number, path: string, crumbs: string[]) => {
    const children = Array.from(el.children).filter((c) => !SKIP_TAGS.has(c.tagName));
    const parentCs = el === body ? null : view.getComputedStyle(el);
    const parentIsFlex = !!parentCs && /flex/.test(parentCs.display);

    children.forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const cs = view.getComputedStyle(child);
      const visible =
        cs.display !== "none" && cs.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      const zIndex = cs.zIndex === "auto" ? 0 : parseInt(cs.zIndex, 10) || 0;
      const borderWidth =
        (px(cs.borderTopWidth) + px(cs.borderRightWidth) + px(cs.borderBottomWidth) + px(cs.borderLeftWidth)) / 4;
      const elementChildren = Array.from(child.children).filter((c) => !SKIP_TAGS.has(c.tagName));
      const childPath = path ? `${path}.${index}` : `${index}`;
      const selector = selectorOf(child);
      const breadcrumb = [...crumbs, selector];

      const inspect: InspectInfo = {
        selector,
        breadcrumb,
        width: rect.width,
        height: rect.height,
        box: {
          boxSizing: cs.boxSizing,
          margin: [px(cs.marginTop), px(cs.marginRight), px(cs.marginBottom), px(cs.marginLeft)],
          padding: [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)],
          border: [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)],
        },
        display: cs.display,
        position: cs.position,
        rules: matchingRules(child, rules),
        flexParent:
          parentIsFlex && parentCs
            ? {
                selector: selectorOf(el),
                flexDirection: parentCs.flexDirection,
                justifyContent: parentCs.justifyContent,
                alignItems: parentCs.alignItems,
                gap: parentCs.rowGap === parentCs.columnGap ? parentCs.columnGap : `${parentCs.rowGap} ${parentCs.columnGap}`,
                flexWrap: parentCs.flexWrap,
              }
            : null,
        flexSelf: /flex/.test(cs.display)
          ? {
              flexDirection: cs.flexDirection,
              justifyContent: cs.justifyContent,
              alignItems: cs.alignItems,
              gap: cs.rowGap === cs.columnGap ? cs.columnGap : `${cs.rowGap} ${cs.columnGap}`,
            }
          : null,
      };

      const key = child.id ? `#${child.id}` : `p${childPath}`;
      elements?.set(key, child);
      boxes.push({
        key,
        tag: child.tagName.toLowerCase(),
        id: child.id,
        className: typeof child.className === "string" ? child.className : "",
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex,
        depth,
        isLeaf: elementChildren.length === 0,
        backgroundColor: cs.backgroundColor,
        borderColor: cs.borderTopColor,
        borderWidth: Number.isFinite(borderWidth) ? borderWidth : 0,
        opacity: parseFloat(cs.opacity),
        visible,
        inspect,
      });

      walk(child, depth + 1, childPath, breadcrumb);
    });
  };

  walk(body, 0, "", []);
  return boxes;
}

/** A box, mapped into the 3D scene. Positions/sizes are in world units. */
export type WorldObject = {
  key: string;
  tag: string;
  isLeaf: boolean;
  visible: boolean;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  borderColor: string;
  borderWidth: number;
  label: string;
  /** Raw class list, used for game-logic checks like "is this the goal". */
  classList: string[];
  inspect: InspectInfo;
};

const CONTAINER_THICKNESS = 0.15;

/**
 * The literal geometric mapping described in the blueprint's §7.1:
 * "2D layout box -> 3D slab. x -> x, y -> -y (screen y is inverted), depth
 * from stacking context / z-index." Coordinates are re-centred on the stage.
 */
export function boxesToWorldObjects(boxes: Box[], containerWidth: number, containerHeight: number): WorldObject[] {
  return boxes.map((box) => {
    const worldX = (box.x + box.width / 2 - containerWidth / 2) / SCALE;
    const worldY = -(box.y + box.height / 2 - containerHeight / 2) / SCALE;
    const baseZ = box.isLeaf ? 0 : CONTAINER_DEPTH;
    const worldZ = baseZ + box.zIndex * DEPTH_PER_Z_INDEX;

    return {
      key: box.key,
      tag: box.tag,
      isLeaf: box.isLeaf,
      visible: box.visible && box.opacity > 0.01,
      position: [worldX, worldY, worldZ],
      size: [
        Math.max(box.width / SCALE, 0.02),
        Math.max(box.height / SCALE, 0.02),
        box.isLeaf ? PLATFORM_DEPTH : CONTAINER_THICKNESS,
      ],
      color: box.backgroundColor,
      borderColor: box.borderColor,
      borderWidth: box.borderWidth / SCALE,
      label: box.id || box.className || box.tag,
      classList: box.className.split(/\s+/).filter(Boolean),
      inspect: box.inspect,
    };
  });
}
