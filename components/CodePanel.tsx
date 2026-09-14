"use client";

import { useEffect, useMemo, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { css as cssLang } from "@codemirror/lang-css";
import { html as htmlLang } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState, Prec, type Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";
import { useLevelStore, type PanelTab } from "@/lib/store";
import { validateCss, type CssIssue } from "@/lib/cssParse";
import { validateHtml } from "@/lib/htmlParse";
import { checkJs } from "@/lib/jsRun";
import { LEVELS, type FileKind } from "@/lib/levels";
import { LessonPanel } from "./LessonPanel";
import { Code } from "./Code";
import { IconBook, IconLock, IconPencil, IconPlay, IconReset, IconTerminal } from "./Icons";

/** The editor, in the map's palette: gold selectors and tags, teal properties, ember values. */
const editorTheme = EditorView.theme(
  {
    "&": { fontSize: "14px", height: "100%", backgroundColor: "#070c18", color: "#dfe6f3" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.7" },
    ".cm-content": { caretColor: "#3fe0c8", padding: "12px 0" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#3fe0c8", borderLeftWidth: "2px" },
    ".cm-gutters": { backgroundColor: "#070c18", color: "#3a4c70", border: "none", borderRight: "1px solid #131d34" },
    ".cm-activeLineGutter": { backgroundColor: "#0e1629", color: "#e0b85f" },
    ".cm-activeLine": { backgroundColor: "rgba(224,184,95,0.05)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(63,224,200,0.22) !important" },
    ".cm-matchingBracket": { backgroundColor: "rgba(224,184,95,0.2)", outline: "1px solid rgba(224,184,95,0.5)" },
    ".cm-foldPlaceholder": { backgroundColor: "#131d34", border: "none", color: "#e0b85f" },
    ".cm-tooltip": { backgroundColor: "#0e1629", border: "1px solid rgba(199,154,62,0.45)", color: "#e8edf6" },
    ".cm-tooltip-lint": { maxWidth: "380px", fontFamily: "var(--font-sans)", fontSize: "13px" },
    ".cm-diagnostic-error": { borderLeft: "3px solid #ff6b6b" },
    "&.cm-readonly .cm-content": { opacity: 0.85 },
  },
  { dark: true }
);

const highlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [t.className, t.tagName, t.labelName], color: "#eed08a" },
    { tag: [t.propertyName, t.attributeName], color: "#7df3e1" },
    { tag: [t.number, t.unit], color: "#ffb86b" },
    { tag: [t.keyword, t.atom, t.bool, t.constant(t.name)], color: "#ff9fcf" },
    { tag: [t.string, t.attributeValue], color: "#a7e39a" },
    { tag: [t.color], color: "#ff9fb2" },
    { tag: [t.comment], color: "#6b7ea3", fontStyle: "italic" },
    { tag: [t.punctuation, t.separator, t.bracket, t.angleBracket], color: "#7c8db0" },
    { tag: [t.operator, t.derefOperator], color: "#9aabc9" },
    { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#8fd0ff" },
    { tag: t.variableName, color: "#dfe6f3" },
  ])
);

const toDiagnostics = (issues: CssIssue[], length: number): Diagnostic[] =>
  issues.map((i) => ({
    from: Math.min(i.from, length),
    to: Math.min(Math.max(i.to, i.from + 1), length),
    severity: "error",
    message: i.hint ? `${i.message} ${i.hint}` : i.message,
  }));

const lintFor: Record<FileKind, Extension> = {
  html: linter((v) => toDiagnostics(validateHtml(v.state.doc.toString()).issues, v.state.doc.length), { delay: 300 }),
  css: linter((v) => toDiagnostics(validateCss(v.state.doc.toString()).issues, v.state.doc.length), { delay: 300 }),
  js: linter((v) => toDiagnostics(checkJs(v.state.doc.toString()).issues, v.state.doc.length), { delay: 300 }),
};

const langFor: Record<FileKind, () => Extension> = { html: () => htmlLang(), css: () => cssLang(), js: () => javascript() };
const FILE_NAME: Record<FileKind, string> = { html: "index.html", css: "style.css", js: "script.js" };
const LABEL: Record<PanelTab, string> = { learn: "Learn", html: "HTML", css: "CSS", js: "JS" };

/** Esc leaves the editor so the keyboard controls Dom again. */
const escapeToPlay = Prec.highest(
  keymap.of([
    {
      key: "Escape",
      run: (view) => {
        view.contentDOM.blur();
        document.querySelector<HTMLElement>("[data-world]")?.focus({ preventScroll: true });
        return true;
      },
    },
  ])
);

function Status({ file }: { file: FileKind }) {
  const issues = useLevelStore((s) => s.issues[file]);
  const text = useLevelStore((s) => s[file]);
  const applied = useLevelStore((s) => (file === "html" ? s.appliedHtml : file === "css" ? s.appliedCss : s.ranJs));
  const jsStatus = useLevelStore((s) => s.jsStatus);
  const jumpTo = useLevelStore((s) => s.jumpTo);

  if (file === "js") {
    if (issues.length) {
      const first = issues[0];
      return (
        <div role="alert" className="border-t border-blood-400/40 bg-[linear-gradient(180deg,rgba(184,56,56,0.18),rgba(10,16,32,0.9))] px-4 py-2.5 text-[13px] leading-snug">
          <button onClick={() => jumpTo("js", first.line)} className="w-full text-left hover:underline">
            <span className="font-mono text-gold-300">Line {first.line}:</span> <Code text={first.message} />
            {first.hint && (
              <span className="mt-0.5 block text-ember-300">
                <Code text={first.hint} />
              </span>
            )}
          </button>
        </div>
      );
    }
    const unsaved = text !== applied;
    return (
      <div role="status" className="flex items-center gap-2 border-t border-ink-700 bg-ink-900 px-4 py-2.5 text-[13px]">
        <span aria-hidden className={`h-2 w-2 rotate-45 ${unsaved ? "bg-gold-400" : jsStatus.state === "error" ? "bg-blood-400" : "bg-jade-400"}`} />
        <span className={unsaved ? "text-gold-300" : jsStatus.state === "error" ? "text-blood-400" : "text-jade-400"}>
          {unsaved ? "Changed — press Run to follow the new instructions." : jsStatus.state === "error" ? "Stopped with an error — see the console." : "Ran without errors."}
        </span>
      </div>
    );
  }

  if (issues.length === 0) {
    const pending = text !== applied;
    return (
      <div role="status" className="flex items-center gap-2 border-t border-ink-700 bg-ink-900 px-4 py-2.5 text-[13px]">
        <span aria-hidden className={`h-2 w-2 rotate-45 ${pending ? "bg-gold-400" : "bg-jade-400 shadow-[0_0_8px_rgba(91,217,154,0.8)]"}`} />
        <span className={pending ? "text-gold-300" : "text-jade-400"}>{pending ? "Reshaping the world…" : `Valid ${file.toUpperCase()} — the world matches your code.`}</span>
      </div>
    );
  }

  const first = issues[0];
  return (
    <div role="alert" className="border-t border-blood-400/40 bg-[linear-gradient(180deg,rgba(184,56,56,0.18),rgba(10,16,32,0.9))] px-4 py-2.5 text-[13px] leading-snug text-ink-100">
      <div className="hud-label mb-1 text-[11px] text-blood-400">Paused on your last working {file.toUpperCase()} — fix this and the world updates</div>
      <button onClick={() => jumpTo(file, first.line)} className="w-full text-left hover:underline">
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

function ConsolePanel() {
  const lines = useLevelStore((s) => s.console);
  const clear = useLevelStore((s) => s.clearConsole);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [lines.length]);
  return (
    <div className="flex h-32 shrink-0 flex-col border-t border-ink-700 bg-ink-950">
      <div className="flex items-center justify-between px-4 py-1.5">
        <span className="hud-label flex items-center gap-1.5 text-[11px] text-ink-400">
          <IconTerminal size={13} /> Console
        </span>
        {lines.length > 0 && (
          <button onClick={clear} className="hud-label text-[11px] text-ink-500 hover:text-ink-200">
            Clear
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 font-mono text-[12.5px]" aria-live="polite">
        {lines.length === 0 && <div className="text-ink-600">console.log output and errors appear here.</div>}
        {lines.map((l, i) => (
          <div key={i} className={`border-b border-ink-850 py-0.5 ${l.kind === "error" ? "text-blood-400" : l.kind === "warn" ? "text-ember-300" : "text-ink-200"}`}>
            {l.kind === "error" ? "✕ " : "› "}
            {l.text}
          </div>
        ))}
        <div ref={end} />
      </div>
    </div>
  );
}

let consumedJump = 0;

function FileEditor({ file }: { file: FileKind }) {
  const level = useLevelStore((s) => LEVELS[s.levelIndex]);
  const text = useLevelStore((s) => s[file]);
  const setFile = useLevelStore((s) => s.setFile);
  const resetFile = useLevelStore((s) => s.resetFile);
  const runJs = useLevelStore((s) => s.runJs);
  const jump = useLevelStore((s) => s.jump);
  const editable = level.edit === file;
  const ref = useRef<ReactCodeMirrorRef>(null);

  const extensions = useMemo(() => {
    const ext: Extension[] = [langFor[file](), editorTheme, highlight, escapeToPlay, EditorView.lineWrapping];
    if (editable) {
      ext.push(lintFor[file], lintGutter());
      if (file === "js") {
        ext.push(
          Prec.highest(
            keymap.of([
              {
                key: "Mod-Enter",
                run: () => {
                  useLevelStore.getState().runJs();
                  return true;
                },
              },
            ])
          )
        );
      }
    } else {
      ext.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
    }
    return ext;
  }, [file, editable]);

  // "Edit · line N" from the inspector or a status message: put the cursor there.
  useEffect(() => {
    if (!jump || jump.file !== file || jump.nonce === consumedJump) return;
    consumedJump = jump.nonce;
    const timer = setTimeout(() => {
      const view = ref.current?.view;
      if (!view) return;
      const line = view.state.doc.line(Math.min(Math.max(1, jump.line), view.state.doc.lines));
      view.dispatch({ selection: { anchor: line.from, head: line.to }, scrollIntoView: true });
      if (editable) view.focus();
    }, 30);
    return () => clearTimeout(timer);
  }, [jump, file, editable]);

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-ink-700 bg-ink-850 px-4 py-2">
        <span className="font-mono text-[13px] text-ink-200">{FILE_NAME[file]}</span>
        {editable ? (
          <span className="hud-label flex items-center gap-1 rounded-sm bg-teal-400/15 px-1.5 py-0.5 text-[11px] text-teal-300">
            <IconPencil size={12} /> You edit this one
          </span>
        ) : (
          <span className="hud-label flex items-center gap-1 rounded-sm bg-ink-700/60 px-1.5 py-0.5 text-[11px] text-ink-400">
            <IconLock size={12} /> Read only
          </span>
        )}
        <span className="flex-1" />
        {editable && (
          <button onClick={() => resetFile(file)} className="btn btn-ghost btn-sm" title="Put this file back how the level started">
            <IconReset size={13} /> Reset
          </button>
        )}
        {editable && file === "js" && (
          <button onClick={runJs} className="btn btn-teal btn-sm" title="Run (Ctrl/⌘ + Enter)">
            <IconPlay size={13} /> Run <span className="keycap">⌘↵</span>
          </button>
        )}
      </div>
      {!editable && (
        <div className="shrink-0 border-b border-ink-700 bg-ink-900 px-4 py-2 text-[13px] text-ink-400">
          Read this to understand the level — it&apos;s part of the page. You change the <span className="text-gold-300">{level.edit.toUpperCase()}</span> in this level.
        </div>
      )}
      <div className="min-h-0 flex-1">
        <CodeMirror
          ref={ref}
          className="h-full"
          value={text}
          height="100%"
          theme="none"
          extensions={extensions}
          onChange={editable ? (v) => setFile(file, v) : undefined}
          basicSetup={{ autocompletion: false, highlightActiveLine: editable, foldGutter: false }}
        />
      </div>
      {editable && <Status file={file} />}
      {file === "js" && editable && <ConsolePanel />}
    </>
  );
}

export function CodePanel() {
  const tab = useLevelStore((s) => s.sidePanelTab);
  const setTab = useLevelStore((s) => s.setSidePanelTab);
  const level = useLevelStore((s) => LEVELS[s.levelIndex]);
  const issues = useLevelStore((s) => s.issues);
  const tabs: PanelTab[] = level.js !== undefined ? ["learn", "html", "css", "js"] : ["learn", "html", "css"];

  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-100">
      <div role="tablist" aria-label="Side panel" className="flex shrink-0 items-end gap-1 border-b border-gold-600/30 bg-linear-to-b from-ink-850 to-ink-900 px-3 pt-2">
        {tabs.map((id) => {
          const active = tab === id;
          const editable = id === level.edit;
          const hasIssue = id !== "learn" && issues[id].length > 0;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`hud-label relative flex items-center gap-1.5 px-4 pb-2 pt-1.5 text-[13px] transition-colors [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_100%,0_100%)] ${
                active ? "bg-ink-800 text-gold-300" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              {id === "learn" ? <IconBook size={13} /> : editable ? <IconPencil size={12} className="text-teal-300" /> : <IconLock size={11} className="opacity-60" />}
              {LABEL[id]}
              {hasIssue && <span className="h-2 w-2 rounded-full bg-blood-400 shadow-[0_0_6px_rgba(255,107,107,0.9)]" aria-label="has errors" />}
              {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-gold-400 shadow-[0_0_8px_rgba(224,184,95,0.8)]" />}
            </button>
          );
        })}
      </div>

      {tab === "learn" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <LessonPanel />
        </div>
      ) : (
        <FileEditor key={`${level.id}:${tab}`} file={tab} />
      )}
    </div>
  );
}
