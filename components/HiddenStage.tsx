"use client";

import { useEffect, useRef, useState } from "react";
import { useLevelStore } from "@/lib/store";
import { measureDocument, boxesToWorldObjects } from "@/lib/layout";
import { validateCss, parseCss } from "@/lib/cssParse";
import { validateHtml } from "@/lib/htmlParse";
import { checkJs, prepareStageWindow, resetStageEnv, runInStage } from "@/lib/jsRun";
import { setStage } from "@/lib/stage";
import { RENDER_DEBOUNCE_MS, STAGE_WIDTH, STAGE_HEIGHT } from "@/lib/constants";
import { LEVELS } from "@/lib/levels";
import { sound } from "@/lib/audio";

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

// The base keeps "#id" links inside this page; without it they resolve against the app's URL and load the app here.
const SKELETON = `<!doctype html><html><head><meta charset="utf-8" /><base href="about:srcdoc" /><style>${RESET_STYLES}</style><style id="level-css"></style></head><body></body></html>`;

/**
 * The real page the world is built from. Per blueprint §7.1: layout is
 * computed by the browser's own engine, never by us.
 *
 * - HTML and CSS apply live (debounced), in place, with no reload — and only
 *   once they validate, so half-typed code never reaches the world (§9.2:
 *   "fail soft, keep last good render").
 * - JavaScript runs when you press Run, on a fresh copy of the HTML.
 * - Anything that changes the page later — a click handler, a CSS transition —
 *   is picked up by watching the page and re-measuring each frame it moves.
 *
 * When `visible` (Flatten mode), this is literally the page, scaled to fit.
 */
export function HiddenStage({ visible, scale = 1 }: { visible: boolean; scale?: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  const html = useLevelStore((s) => s.html);
  const css = useLevelStore((s) => s.css);
  const js = useLevelStore((s) => s.js);
  const levelLoadToken = useLevelStore((s) => s.levelLoadToken);
  const jsRunToken = useLevelStore((s) => s.jsRunToken);

  const lastToken = useRef<number | null>(null);
  const lastRun = useRef(0);
  const cleanupJs = useRef<(() => void) | null>(null);
  const htmlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cssTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);
  const observer = useRef<MutationObserver | null>(null);
  const interactionListenersDoc = useRef<Document | null>(null);

  // The page is server-rendered, so the iframe's srcdoc can finish loading
  // before React attaches onLoad. Check for an already-loaded document too.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.readyState === "complete" && doc.getElementById("level-css")) setReady(true);
  }, []);

  const getDoc = () => {
    const doc = iframeRef.current?.contentDocument;
    return doc && doc.getElementById("level-css") ? doc : null;
  };

  /** Read the page back into the world. Returns whether the world changed. */
  const measure = () => {
    const doc = getDoc();
    if (!doc) return false;
    const store = useLevelStore.getState();
    const elements = new Map<string, Element>();
    const boxes = measureDocument(doc, parseCss(store.appliedCss).rules, elements);
    setStage(doc, elements);
    const before = store.worldRevision;
    store.setWorld(boxesToWorldObjects(boxes, STAGE_WIDTH, STAGE_HEIGHT), store.levelLoadToken);
    // Keep measuring while a CSS transition or animation is moving things.
    if (doc.getAnimations().length > 0) scheduleMeasure();
    return useLevelStore.getState().worldRevision !== before;
  };

  const scheduleMeasure = () => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      measure();
    });
  };

  const runJavaScript = (code: string) => {
    const doc = getDoc();
    const win = doc?.defaultView;
    if (!doc || !win) return;
    const store = useLevelStore.getState();
    cleanupJs.current?.();
    cleanupJs.current = null;
    if (!code.trim()) {
      store.setJsStatus({ state: "idle" });
      return;
    }
    const level = LEVELS[store.levelIndex];
    const env = { api: level.api, modules: level.modules, storage: level.storage, key: level.id };
    const { result, cleanup } = runInStage(code, win, store.logConsole, env);
    cleanupJs.current = cleanup;
    if (result.ok) store.setJsStatus({ state: "ran" });
    else {
      store.setJsStatus({ state: "error", message: result.message, hint: result.hint, line: result.line });
      store.logConsole({ kind: "error", text: result.hint ? `${result.message} ${result.hint}` : result.message });
    }
  };

  /** Replace the page's body with this HTML, then re-run the last JavaScript. */
  const rebuildBody = (markup: string, code: string) => {
    const doc = getDoc();
    if (!doc) return;
    observer.current?.disconnect();
    cleanupJs.current?.();
    cleanupJs.current = null;
    // A link followed in an earlier run (#target) would otherwise keep :target rules applied.
    const win = doc.defaultView;
    if (win?.location.hash) {
      try {
        win.history.replaceState(null, "", win.location.href.split("#")[0]);
      } catch {
        win.location.hash = "";
      }
    }
    doc.body.innerHTML = markup;
    observeBody(doc);
    runJavaScript(code);
  };

  const observeBody = (doc: Document) => {
    if (!observer.current) observer.current = new MutationObserver(() => scheduleMeasure());
    observer.current.observe(doc.body, { attributes: true, childList: true, subtree: true, characterData: true });
    // A checkbox's checked state, and focus itself, aren't DOM mutations —
    // clicking a real checkbox or button changes live UI state the
    // MutationObserver above never sees, even though :checked/:focus rules
    // do apply immediately in the real page. Listen for those directly.
    if (interactionListenersDoc.current !== doc) {
      doc.addEventListener("change", scheduleMeasure);
      doc.addEventListener("focusin", scheduleMeasure);
      doc.addEventListener("focusout", scheduleMeasure);
      // A real link to "#id" changes :target too — also not a DOM mutation.
      doc.defaultView?.addEventListener("hashchange", scheduleMeasure);
      interactionListenersDoc.current = doc;
    }
  };

  // A new level (or a reset): build the page instantly from its starting files.
  useEffect(() => {
    if (!ready || lastToken.current === levelLoadToken) return;
    const doc = getDoc();
    if (!doc) return;
    lastToken.current = levelLoadToken;
    const store = useLevelStore.getState();
    const level = LEVELS[store.levelIndex];
    prepareStageWindow(doc.defaultView!, (line) => useLevelStore.getState().logConsole(line));
    resetStageEnv(doc.defaultView!);
    const styleEl = doc.getElementById("level-css")!;
    styleEl.textContent = store.css;
    rebuildBody(store.html, level.js ?? "");
    lastRun.current = store.jsRunToken;
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, levelLoadToken]);

  // HTML edits.
  useEffect(() => {
    if (!ready || lastToken.current !== levelLoadToken) return;
    if (htmlTimer.current) clearTimeout(htmlTimer.current);
    htmlTimer.current = setTimeout(() => {
      const store = useLevelStore.getState();
      const { issues } = validateHtml(html);
      store.setIssues("html", issues);
      if (issues.length || html === store.appliedHtml) return;
      store.setApplied(html, store.appliedCss);
      rebuildBody(html, store.ranJs);
      if (measure()) sound.valid();
    }, RENDER_DEBOUNCE_MS);
    return () => {
      if (htmlTimer.current) clearTimeout(htmlTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, html]);

  // CSS edits.
  useEffect(() => {
    if (!ready || lastToken.current !== levelLoadToken) return;
    if (cssTimer.current) clearTimeout(cssTimer.current);
    cssTimer.current = setTimeout(() => {
      const doc = getDoc();
      if (!doc) return;
      const store = useLevelStore.getState();
      const { issues } = validateCss(css);
      store.setIssues("css", issues);
      if (issues.length || css === store.appliedCss) return;
      doc.getElementById("level-css")!.textContent = css;
      store.setApplied(store.appliedHtml, css);
      if (measure()) sound.valid();
    }, RENDER_DEBOUNCE_MS);
    return () => {
      if (cssTimer.current) clearTimeout(cssTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, css]);

  // JavaScript: check syntax as you type (for the squiggles), run only on Run.
  useEffect(() => {
    if (!ready) return;
    if (jsTimer.current) clearTimeout(jsTimer.current);
    jsTimer.current = setTimeout(() => useLevelStore.getState().setIssues("js", checkJs(js).issues), RENDER_DEBOUNCE_MS);
    return () => {
      if (jsTimer.current) clearTimeout(jsTimer.current);
    };
  }, [ready, js]);

  useEffect(() => {
    if (!ready || jsRunToken === lastRun.current) return;
    lastRun.current = jsRunToken;
    const store = useLevelStore.getState();
    store.clearConsole();
    const { issues } = checkJs(store.ranJs);
    store.setIssues("js", issues);
    if (issues.length) {
      const i = issues[0];
      store.setJsStatus({ state: "error", message: i.message, hint: i.hint, line: i.line });
      sound.error();
      return;
    }
    rebuildBody(store.appliedHtml, store.ranJs);
    measure();
    if (useLevelStore.getState().jsStatus.state === "error") sound.error();
    else sound.valid();
    // measure/rebuildBody only read refs and the store, so they needn't retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, jsRunToken]);

  useEffect(
    () => () => {
      observer.current?.disconnect();
      cleanupJs.current?.();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      const doc = interactionListenersDoc.current;
      doc?.removeEventListener("change", scheduleMeasure);
      doc?.removeEventListener("focusin", scheduleMeasure);
      doc?.removeEventListener("focusout", scheduleMeasure);
      doc?.defaultView?.removeEventListener("hashchange", scheduleMeasure);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // The iframe is always exactly STAGE_WIDTH × STAGE_HEIGHT CSS px — the
  // page's viewport, where every measurement is taken. In Flatten it's scaled
  // to fit with a CSS transform, which changes how it looks, never its layout.
  return (
    <div
      aria-hidden={!visible}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ visibility: visible ? "visible" : "hidden", pointerEvents: visible ? "auto" : "none", background: "#070b16" }}
    >
      <iframe
        ref={iframeRef}
        title="The web page this world is rendered from"
        srcDoc={SKELETON}
        onLoad={() => setReady(true)}
        sandbox="allow-same-origin allow-scripts"
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
