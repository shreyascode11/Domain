"use client";

import { useEffect, useRef, useState } from "react";
import { useLevelStore } from "@/lib/store";
import { measureDocument, boxesToWorldObjects } from "@/lib/layout";
import { validateCss } from "@/lib/cssParse";
import { RENDER_DEBOUNCE_MS, STAGE_WIDTH, STAGE_HEIGHT } from "@/lib/constants";

// A minimal, honest reset: kill the default body margin so (0,0) in the
// document matches (0,0) of the stage, and give the document a fixed
// viewport so the px -> world-unit mapping is exact. Nothing here changes
// how any of the learner's own CSS behaves.
const RESET_STYLES = `
  html, body { margin: 0; padding: 0; }
  body {
    width: ${STAGE_WIDTH}px;
    height: ${STAGE_HEIGHT}px;
    overflow: hidden;
    position: relative;
    font: 11px/1.2 ui-monospace, monospace;
    color: #0f172a;
    background: #f8fafc;
  }
`;

const SKELETON = `<!doctype html><html><head><meta charset="utf-8" /><style>${RESET_STYLES}</style><style id="level-css"></style></head><body></body></html>`;

/**
 * The real, hidden DOM. Per blueprint §7.1: layout must be computed by the
 * browser's real engine, not by us.
 *
 * The document is created once. After that every edit is applied in place
 * — swap the <style> text, swap the body's HTML — and measured immediately
 * (getBoundingClientRect forces a synchronous layout), so there is no page
 * reload between keystrokes and nothing to flicker.
 *
 * CSS that doesn't validate is never applied: the world keeps showing the
 * last CSS that worked, and the editor explains what's wrong (§9.2: "fail
 * soft, keep last good render").
 *
 * When `visible` is true (Flatten mode) this is literally the page the
 * world is rendered from, shown as-is.
 */
export function HiddenStage({ visible, scale = 1 }: { visible: boolean; scale?: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  const html = useLevelStore((s) => s.html);
  const css = useLevelStore((s) => s.css);
  const levelLoadToken = useLevelStore((s) => s.levelLoadToken);

  // The page is server-rendered, so the iframe's srcdoc can finish loading
  // before React attaches onLoad. Check for an already-loaded document too.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.readyState === "complete" && doc.getElementById("level-css")) setReady(true);
  }, []);

  const lastToken = useRef<number | null>(null);
  const lastHtml = useRef<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready) return;

    const apply = () => {
      const doc = iframeRef.current?.contentDocument;
      const styleEl = doc?.getElementById("level-css");
      if (!doc || !styleEl) return;
      const store = useLevelStore.getState();

      const { rules, issues } = validateCss(css);
      store.setCssIssues(issues);
      const isNewLevel = lastToken.current !== levelLoadToken;
      if (issues.length > 0 && !isNewLevel) return; // keep last good render

      if (styleEl.textContent !== css) styleEl.textContent = css;
      if (lastHtml.current !== html || isNewLevel) {
        doc.body.innerHTML = html;
        lastHtml.current = html;
      }
      lastToken.current = levelLoadToken;
      store.setApplied(css);

      const boxes = measureDocument(doc, rules);
      store.setWorld(boxesToWorldObjects(boxes, STAGE_WIDTH, STAGE_HEIGHT), levelLoadToken);
    };

    if (debounce.current) clearTimeout(debounce.current);
    if (lastToken.current !== levelLoadToken) {
      apply(); // a new level loads instantly
    } else {
      debounce.current = setTimeout(apply, RENDER_DEBOUNCE_MS);
    }
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [ready, html, css, levelLoadToken]);

  // The iframe is always exactly STAGE_WIDTH × STAGE_HEIGHT CSS px — that is
  // the page's viewport, and every measurement is taken inside it. When it's
  // shown (Flatten), it's scaled to fit the view with a CSS transform, which
  // changes how it looks and never how it lays out.
  return (
    <div
      aria-hidden={!visible}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        visibility: visible ? "visible" : "hidden",
        pointerEvents: visible ? "auto" : "none",
        background: "#070b16",
      }}
    >
      <iframe
        ref={iframeRef}
        title="The web page this world is rendered from"
        srcDoc={SKELETON}
        onLoad={() => setReady(true)}
        sandbox="allow-same-origin"
        tabIndex={-1}
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          flexShrink: 0,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          boxShadow: "0 0 0 1px rgba(199,154,62,0.5), 0 20px 50px rgba(0,0,0,0.6)",
          background: "#f8fafc",
        }}
      />
    </div>
  );
}
