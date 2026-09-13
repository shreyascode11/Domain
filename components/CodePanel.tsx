"use client";

import { useEffect, useMemo, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { css as cssLang } from "@codemirror/lang-css";
import { html as htmlLang } from "@codemirror/lang-html";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";
import { useLevelStore } from "@/lib/store";
import { validateCss } from "@/lib/cssParse";
import { LEVELS } from "@/lib/levels";
import { LessonPanel } from "./LessonPanel";
import { Code } from "./Code";

/** The editor, in the map's palette: gold selectors, teal properties, ember values. */
const editorTheme = EditorView.theme(
  {
    "&": { fontSize: "13.5px", height: "100%", backgroundColor: "#070c18", color: "#dfe6f3" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
    ".cm-content": { caretColor: "#3fe0c8", padding: "10px 0" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#3fe0c8", borderLeftWidth: "2px" },
    ".cm-gutters": { backgroundColor: "#070c18", color: "#3a4c70", border: "none", borderRight: "1px solid #131d34" },
    ".cm-activeLineGutter": { backgroundColor: "#0e1629", color: "#e0b85f" },
    ".cm-activeLine": { backgroundColor: "rgba(224,184,95,0.05)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(63,224,200,0.22) !important" },
    ".cm-matchingBracket": { backgroundColor: "rgba(224,184,95,0.2)", outline: "1px solid rgba(224,184,95,0.5)" },
    ".cm-foldPlaceholder": { backgroundColor: "#131d34", border: "none", color: "#e0b85f" },
    ".cm-tooltip": { backgroundColor: "#0e1629", border: "1px solid rgba(199,154,62,0.45)", color: "#e8edf6" },
    ".cm-tooltip-lint": { maxWidth: "360px", fontFamily: "var(--font-sans)", fontSize: "13px" },
    ".cm-diagnostic-error": { borderLeft: "3px solid #ff6b6b" },
  },
  { dark: true }
);

const highlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [t.className, t.tagName, t.labelName], color: "#eed08a" },
    { tag: [t.propertyName, t.attributeName], color: "#7df3e1" },
    { tag: [t.number, t.unit], color: "#ffb86b" },
    { tag: [t.keyword, t.atom, t.constant(t.name)], color: "#ffc28a" },
    { tag: [t.string, t.attributeValue], color: "#a7e39a" },
    { tag: [t.color], color: "#ff9fb2" },
    { tag: [t.comment], color: "#56688c", fontStyle: "italic" },
    { tag: [t.punctuation, t.separator, t.bracket, t.angleBracket], color: "#6b7ea3" },
    { tag: [t.operator, t.derefOperator], color: "#9aabc9" },
    { tag: t.variableName, color: "#dfe6f3" },
  ])
);

const cssLinter = linter(
  (view): Diagnostic[] =>
    validateCss(view.state.doc.toString()).issues.map((i) => ({
      from: Math.min(i.from, view.state.doc.length),
      to: Math.min(Math.max(i.to, i.from + 1), view.state.doc.length),
      severity: "error",
      message: i.hint ? `${i.message} ${i.hint}` : i.message,
    })),
  { delay: 250 }
);

const TABS = [
  { id: "lesson", label: "Lesson" },
  { id: "css", label: "CSS" },
  { id: "html", label: "HTML" },
] as const;

function CssStatus() {
  const issues = useLevelStore((s) => s.cssIssues);
  const css = useLevelStore((s) => s.css);
  const applied = useLevelStore((s) => s.appliedCss);
  const jumpToCss = useLevelStore((s) => s.jumpToCss);
  const pending = css !== applied && issues.length === 0;

  if (issues.length === 0) {
    return (
      <div role="status" className="flex items-center gap-2 border-t border-ink-700 bg-ink-900 px-4 py-2.5 text-[13px]">
        <span aria-hidden className={`h-2 w-2 rotate-45 ${pending ? "bg-gold-400" : "bg-jade-400 shadow-[0_0_8px_rgba(91,217,154,0.8)]"}`} />
        <span className={pending ? "text-gold-300" : "text-jade-400"}>
          {pending ? "Reshaping the world…" : "Valid CSS — the world matches your code."}
        </span>
      </div>
    );
  }

  const first = issues[0];
  return (
    <div role="alert" className="border-t border-blood-400/40 bg-[linear-gradient(180deg,rgba(184,56,56,0.18),rgba(10,16,32,0.9))] px-4 py-2.5 text-[13px] leading-snug text-ink-100">
      <div className="hud-label mb-1 text-[11px] text-blood-400">World paused on your last working CSS</div>
      <button onClick={() => jumpToCss(first.line)} className="w-full text-left hover:underline">
        <span className="font-mono text-gold-300">Line {first.line}:</span> <Code text={first.message} />
        {first.hint && (
          <span className="mt-0.5 block text-ember-300">
            <Code text={first.hint} />
          </span>
        )}
      </button>
      {issues.length > 1 && <div className="mt-1 text-ink-400">+ {issues.length - 1} more — look for the red squiggles</div>}
    </div>
  );
}

export function CodePanel() {
  const tab = useLevelStore((s) => s.sidePanelTab);
  const setTab = useLevelStore((s) => s.setSidePanelTab);
  const html = useLevelStore((s) => s.html);
  const css = useLevelStore((s) => s.css);
  const setCss = useLevelStore((s) => s.setCss);
  const cssJump = useLevelStore((s) => s.cssJump);
  const level = useLevelStore((s) => LEVELS[s.levelIndex]);
  const issues = useLevelStore((s) => s.cssIssues);
  const cssRef = useRef<ReactCodeMirrorRef>(null);

  const cssExtensions = useMemo(() => [cssLang(), editorTheme, highlight, cssLinter, lintGutter()], []);
  const htmlExtensions = useMemo(
    () => [htmlLang(), editorTheme, highlight, EditorState.readOnly.of(true), EditorView.editable.of(false)],
    []
  );

  // "Show in CSS" from the inspector or the error bar: put the cursor there.
  useEffect(() => {
    if (!cssJump || tab !== "css") return;
    const timer = setTimeout(() => {
      const view = cssRef.current?.view;
      if (!view) return;
      const line = view.state.doc.line(Math.min(Math.max(1, cssJump.line), view.state.doc.lines));
      view.dispatch({ selection: { anchor: line.from, head: line.to }, scrollIntoView: true });
      view.focus();
    }, 30);
    return () => clearTimeout(timer);
  }, [cssJump, tab]);

  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-100">
      <div role="tablist" aria-label="Side panel" className="flex shrink-0 items-end gap-1 border-b border-gold-600/30 bg-linear-to-b from-ink-850 to-ink-900 px-3 pt-2">
        {TABS.map((tabDef) => {
          const active = tab === tabDef.id;
          return (
            <button
              key={tabDef.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tabDef.id)}
              className={`hud-label relative px-4 pb-2 pt-1.5 text-[13px] transition-colors [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_100%,0_100%)] ${
                active ? "bg-ink-800 text-gold-300" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              {tabDef.label}
              {tabDef.id === "css" && issues.length > 0 && (
                <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-blood-400 shadow-[0_0_6px_rgba(255,107,107,0.9)]" aria-label={`${issues.length} CSS errors`} />
              )}
              {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-gold-400 shadow-[0_0_8px_rgba(224,184,95,0.8)]" />}
            </button>
          );
        })}
      </div>

      {tab === "lesson" && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <LessonPanel />
        </div>
      )}

      {tab === "css" && (
        <>
          <div className="flex shrink-0 items-start gap-2 border-b border-ink-700 bg-ink-850 px-4 py-2.5 text-[13px] text-ink-200">
            <span className="hud-label mt-px text-[11px] text-teal-300">Objective</span>
            <span>
              <Code text={level.objective} />
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <CodeMirror
              ref={cssRef}
              className="h-full"
              value={css}
              height="100%"
              theme="none"
              extensions={cssExtensions}
              onChange={setCss}
              basicSetup={{ autocompletion: false, highlightActiveLine: true }}
            />
          </div>
          <CssStatus />
        </>
      )}

      {tab === "html" && (
        <>
          <div className="shrink-0 border-b border-ink-700 bg-ink-850 px-4 py-2.5 text-[13px] text-ink-300">
            <span className="hud-label mr-2 text-[11px] text-gold-400">Read-only</span>
            This chapter is about CSS. Here is the world&apos;s skeleton — every element becomes a block.
          </div>
          <div className="min-h-0 flex-1">
            <CodeMirror className="h-full" value={html} height="100%" theme="none" extensions={htmlExtensions} />
          </div>
        </>
      )}
    </div>
  );
}
