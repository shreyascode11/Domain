import { parse, type Node } from "acorn";
import { simple } from "acorn-walk";
import type { CssIssue } from "./cssParse";

/**
 * Runs the learner's JavaScript against the real page the world is built
 * from, inside that page's own window (the stage iframe).
 *
 * Beginners write infinite loops (`i--` instead of `i++`), and a frozen tab
 * teaches nothing. Before running, every loop gets a guard that stops it
 * after a generous number of turns and explains why — the same technique
 * CodePen and JS Bin use.
 *
 * Deliberate Phase-0 simplification of blueprint §7.3: the code runs in the
 * stage iframe rather than a Worker with a proxied DOM. It is the learner's
 * own code in their own browser; nothing is shared with other users.
 */

export type ConsoleLine = { kind: "log" | "warn" | "error" | "info"; text: string };

/** A pretend server response for `fetch` in a level. A function receives the request. */
export type ApiReply = { status?: number; body?: unknown; delay?: number; offline?: boolean };
export type ApiRoute = ApiReply | ((req: { method: string; url: string; headers: Record<string, string>; body: unknown }) => ApiReply);

/** What a level's code can use beyond the page: modules to import, a server to fetch from, storage. */
export type JsEnv = {
  /** Keyed like "GET /api/bridge". */
  api?: Record<string, ApiRoute>;
  /** Module files, keyed by path ("./bridge.js"), that the code can import. */
  modules?: Record<string, string>;
  storage?: { local?: Record<string, string>; session?: Record<string, string> };
  /** Storage is kept per key, so it survives re-running the same level. */
  key?: string;
};

const LOOP_LIMIT = 10000;

function lineAt(text: string, offset: number) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

function friendlySyntax(message: string) {
  const m = message.replace(/\s*\(\d+:\d+\)$/, "");
  if (/Unexpected token/.test(m)) return { message: "JavaScript didn't expect this here.", hint: "Check for a missing `(`, `)`, `{`, `}` or a stray character." };
  if (/Unterminated string/.test(m)) return { message: "A string is never closed.", hint: 'Strings start and end with the same quote: `"like this"`.' };
  if (/Unexpected character/.test(m)) return { message: "This character isn't valid JavaScript.", hint: "Curly quotes (“ ”) from documents often cause this — use straight quotes." };
  if (/Identifier .* has already been declared/.test(m)) return { message: m + ".", hint: "Use a different name, or assign to the existing variable without `let`/`const`." };
  return { message: m + "." };
}

export function checkJs(code: string): { issues: CssIssue[] } {
  try {
    parse(code, { ecmaVersion: "latest", sourceType: "module" });
    return { issues: [] };
  } catch (e) {
    const err = e as { message: string; pos?: number };
    const pos = err.pos ?? 0;
    const f = friendlySyntax(err.message);
    return { issues: [{ line: lineAt(code, pos), from: pos, to: pos + 1, ...f }] };
  }
}

type LoopNode = Node & { body: Node & { type: string; start: number; end: number } };

/** Insert a turn counter at the start of every loop body. */
export function guardLoops(code: string) {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const edits: { at: number; text: string }[] = [];
  const guard = (line: number) =>
    `if (++__loops > ${LOOP_LIMIT}) throw new __LoopError(${line});`;
  const visit = (node: Node) => {
    const loop = node as LoopNode;
    const body = loop.body;
    const line = lineAt(code, node.start);
    if (body.type === "BlockStatement") {
      edits.push({ at: body.start + 1, text: guard(line) });
    } else {
      edits.push({ at: body.start, text: `{${guard(line)}` });
      edits.push({ at: body.end, text: `}` });
    }
  };
  simple(ast, {
    ForStatement: visit,
    ForInStatement: visit,
    ForOfStatement: visit,
    WhileStatement: visit,
    DoWhileStatement: visit,
  });
  edits.sort((a, b) => b.at - a.at);
  let out = code;
  for (const e of edits) out = out.slice(0, e.at) + e.text + out.slice(e.at);
  return out;
}

type ModuleNode = Node & {
  type: string;
  source?: { value: string };
  specifiers?: { type: string; local: { name: string }; imported?: { name: string }; exported?: { name: string } }[];
  declaration?: (Node & { type: string; id?: { name: string }; declarations?: { id: { type: string; name?: string } }[] }) | null;
};

/**
 * Rewrite import/export into plain script code, on the same lines, so it can
 * run inside a Function. Imports read from `__import(path)`; exported names
 * are collected so a module file can hand them back.
 */
export function modulesToScript(code: string) {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" }) as unknown as { body: ModuleNode[] };
  const edits: { from: number; to: number; text: string }[] = [];
  const exported: string[] = [];
  for (const node of ast.body) {
    if (node.type === "ImportDeclaration") {
      const path = JSON.stringify(node.source!.value);
      const parts: string[] = [];
      const named: string[] = [];
      for (const sp of node.specifiers ?? []) {
        if (sp.type === "ImportDefaultSpecifier") parts.push(`const ${sp.local.name} = __import(${path}).default;`);
        else if (sp.type === "ImportNamespaceSpecifier") parts.push(`const ${sp.local.name} = __import(${path});`);
        else named.push(sp.imported!.name === sp.local.name ? sp.local.name : `${sp.imported!.name}: ${sp.local.name}`);
      }
      if (named.length) parts.push(`const { ${named.join(", ")} } = __import(${path});`);
      if (!parts.length) parts.push(`__import(${path});`);
      edits.push({ from: node.start, to: node.end, text: parts.join(" ") });
    } else if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) {
        const d = node.declaration;
        if (d.id) exported.push(d.id.name);
        for (const v of d.declarations ?? []) if (v.id.type === "Identifier" && v.id.name) exported.push(v.id.name);
        edits.push({ from: node.start, to: d.start, text: "" });
      } else {
        for (const sp of node.specifiers ?? []) exported.push(sp.local.name === sp.exported!.name ? sp.local.name : `${sp.exported!.name}: ${sp.local.name}`);
        edits.push({ from: node.start, to: node.end, text: "" });
      }
    } else if (node.type === "ExportDefaultDeclaration") {
      const d = node.declaration!;
      if ((d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") && d.id) {
        exported.push(`default: ${d.id.name}`);
        edits.push({ from: node.start, to: d.start, text: "" });
      } else {
        exported.push("default: __default");
        edits.push({ from: node.start, to: d.start, text: "const __default = " });
      }
    }
  }
  edits.sort((a, b) => b.from - a.from);
  let out = code;
  for (const e of edits) out = out.slice(0, e.from) + e.text + out.slice(e.to);
  return { code: out, exported };
}

function format(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "function") return `ƒ ${value.name || "function"}()`;
  if (typeof Element !== "undefined" && value && typeof value === "object" && "tagName" in value && "classList" in value) {
    const el = value as Element;
    const cls = el.classList.length ? ` class="${el.className}"` : "";
    return `<${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ""}${cls}>`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Turn a runtime error into something a beginner can act on. */
export function explainRuntimeError(err: unknown): { message: string; hint?: string } {
  const e = err as { name?: string; message?: string; loopLine?: number };
  const msg = e?.message ?? String(err);
  if (e?.name === "LoopError") {
    return {
      message: `The loop on line ${e.loopLine} ran more than ${LOOP_LIMIT.toLocaleString()} times, so it was stopped.`,
      hint: "Check that its condition eventually becomes false — for example `i++` counting towards the limit, not `i--` away from it.",
    };
  }
  let m: RegExpMatchArray | null;
  if ((m = msg.match(/Cannot read properties of null \(reading '(.+)'\)/)) || (m = msg.match(/null is not an object \(evaluating '.*\.(.+)'\)/))) {
    return {
      message: `Tried to use \`.${m[1]}\` on nothing (\`null\`).`,
      hint: "`document.querySelector` returns `null` when no element matches. Check the selector — classes need a dot: `\".stone\"`.",
    };
  }
  if ((m = msg.match(/Cannot set properties of null \(setting '(.+)'\)/))) {
    return {
      message: `Tried to set \`.${m[1]}\` on nothing (\`null\`).`,
      hint: "`document.querySelector` returns `null` when no element matches. Check the selector — classes need a dot: `\".stone\"`.",
    };
  }
  if ((m = msg.match(/^(\w+) is not defined/))) {
    return { message: `\`${m[1]}\` hasn't been created.`, hint: `Check the spelling, or create it first with \`const ${m[1]} = …\`.` };
  }
  if ((m = msg.match(/(.+) is not a function/))) {
    return { message: `\`${m[1]}\` isn't a function, so it can't be called with \`()\`.`, hint: "Check the spelling and capital letters — `addEventListener`, `querySelector`, `classList.add`." };
  }
  if (/Assignment to constant variable/.test(msg)) {
    return { message: "You tried to change a `const`.", hint: "Use `let` for a variable whose value changes." };
  }
  return { message: msg };
}

type StageWindow = Window & typeof globalThis & {
  __domainListeners?: WeakMap<EventTarget, Set<string>>;
  __domainWrapped?: WeakMap<object, EventListener>;
  __domainRunListeners?: { target: EventTarget; type: string; listener: EventListener; options?: boolean | EventListenerOptions }[];
  __domainStorage?: Record<string, Map<string, string>>;
  __domainPatched?: boolean;
};

/** Forget storage and page-level listeners from a previous level. */
export function resetStageEnv(win: Window) {
  const w = win as StageWindow;
  w.__domainStorage = {};
}

export type RunResult = { ok: true } | { ok: false; line?: number; message: string; hint?: string };

/**
 * Install once per stage window: record which events each element listens
 * for (the inspector shows them), and route errors thrown later — inside a
 * click handler, say — to the console panel.
 */
export function prepareStageWindow(win: Window, onConsole: (line: ConsoleLine) => void) {
  const w = win as StageWindow;
  if (w.__domainPatched) return;
  w.__domainPatched = true;
  w.__domainListeners = new WeakMap();
  w.__domainWrapped = new WeakMap();
  w.__domainRunListeners = [];
  const proto = w.EventTarget.prototype;
  const original = proto.addEventListener;
  const originalRemove = proto.removeEventListener;
  proto.addEventListener = function (this: EventTarget, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
    const map = w.__domainListeners!;
    const set = map.get(this) ?? new Set<string>();
    set.add(type);
    map.set(this, set);
    let wrapped: EventListenerOrEventListenerObject | null = listener;
    if (typeof listener === "function") {
      // The same wrapper for the same function, so removeEventListener(fn) still finds it.
      wrapped = w.__domainWrapped!.get(listener) ?? null;
      if (!wrapped) {
        wrapped = function (this: EventTarget, ev: Event) {
          try {
            return listener.call(this, ev);
          } catch (err) {
            const f = explainRuntimeError(err);
            onConsole({ kind: "error", text: f.hint ? `${f.message} ${f.hint}` : f.message });
          }
        };
        w.__domainWrapped!.set(listener, wrapped as EventListener);
      }
    }
    if (wrapped && (this === w.document || this === w)) {
      w.__domainRunListeners!.push({ target: this, type, listener: wrapped as EventListener, options });
    }
    return original.call(this, type, wrapped, options);
  };
  proto.removeEventListener = function (this: EventTarget, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) {
    const wrapped = typeof listener === "function" ? (w.__domainWrapped!.get(listener) ?? listener) : listener;
    return originalRemove.call(this, type, wrapped, options);
  };
  w.addEventListener("unhandledrejection", (ev) => {
    const reason = (ev as PromiseRejectionEvent).reason;
    const f = explainRuntimeError(reason);
    onConsole({ kind: "error", text: `Uncaught (in promise): ${f.hint ? `${f.message} ${f.hint}` : f.message}` });
  });
}

export function listenersOf(win: Window | null | undefined, el: EventTarget) {
  const map = (win as StageWindow | undefined)?.__domainListeners;
  return map ? [...(map.get(el) ?? [])] : [];
}

/** Run code in the stage window. Returns a cleanup that clears its timers. */
export function runInStage(
  code: string,
  win: Window,
  onConsole: (line: ConsoleLine) => void,
  env: JsEnv = {}
): { result: RunResult; cleanup: () => void } {
  const w = win as StageWindow;
  const timers = new Set<number>();
  const intervals = new Set<number>();
  // Listeners on document/window outlive a re-run (the body is rebuilt, they aren't), so drop earlier ones.
  for (const l of w.__domainRunListeners ?? []) l.target.removeEventListener(l.type, l.listener, l.options);
  if (w.__domainRunListeners) w.__domainRunListeners.length = 0;
  const cleanup = () => {
    timers.forEach((t) => win.clearTimeout(t));
    intervals.forEach((t) => win.clearInterval(t));
  };

  let guarded: string;
  try {
    guarded = guardLoops(modulesToScript(code).code);
  } catch (e) {
    const err = e as { message: string; pos?: number };
    return { result: { ok: false, line: lineAt(code, err.pos ?? 0), ...friendlySyntax(err.message) }, cleanup };
  }

  const makeConsole = () => {
    let depth = 0;
    const counts = new Map<string, number>();
    const started = new Map<string, number>();
    const out = (kind: ConsoleLine["kind"]) => (...args: unknown[]) => onConsole({ kind, text: "  ".repeat(depth) + args.map(format).join(" ") });
    const log = out("log");
    return {
      log,
      info: out("info"),
      warn: out("warn"),
      error: out("error"),
      debug: log,
      dir: log,
      trace: (...args: unknown[]) => log("Trace:", ...args),
      table: (data: unknown) => {
        if (data && typeof data === "object") {
          for (const [k, v] of Object.entries(data as Record<string, unknown>)) log(`│ ${k} │ ${format(v)}`);
        } else log(data);
      },
      count: (label = "default") => {
        counts.set(label, (counts.get(label) ?? 0) + 1);
        log(`${label}: ${counts.get(label)}`);
      },
      countReset: (label = "default") => counts.delete(label),
      group: (...args: unknown[]) => {
        if (args.length) log("▼", ...args);
        depth++;
      },
      groupCollapsed: (...args: unknown[]) => {
        if (args.length) log("▶", ...args);
        depth++;
      },
      groupEnd: () => {
        depth = Math.max(0, depth - 1);
      },
      time: (label = "default") => started.set(label, win.performance.now()),
      timeEnd: (label = "default") => {
        const t = started.get(label);
        if (t !== undefined) log(`${label}: ${(win.performance.now() - t).toFixed(1)} ms`);
        started.delete(label);
      },
      assert: (condition: unknown, ...args: unknown[]) => {
        if (!condition) onConsole({ kind: "error", text: `Assertion failed: ${args.map(format).join(" ") || "console.assert"}` });
      },
    };
  };

  class LoopError extends Error {
    loopLine: number;
    constructor(line: number) {
      super(`loop on line ${line}`);
      this.name = "LoopError";
      this.loopLine = line;
    }
  }

  const setTimeoutTracked = (fn: () => void, ms?: number) => {
    const id = win.setTimeout(() => {
      timers.delete(id);
      try {
        fn();
      } catch (err) {
        const f = explainRuntimeError(err);
        onConsole({ kind: "error", text: f.hint ? `${f.message} ${f.hint}` : f.message });
      }
    }, ms);
    timers.add(id);
    return id;
  };
  const setIntervalTracked = (fn: () => void, ms?: number) => {
    const id = win.setInterval(() => {
      try {
        fn();
      } catch (err) {
        win.clearInterval(id);
        const f = explainRuntimeError(err);
        onConsole({ kind: "error", text: f.hint ? `${f.message} ${f.hint}` : f.message });
      }
    }, Math.max(16, ms ?? 16));
    intervals.add(id);
    return id;
  };

  // Storage lives on the stage window, per level, and never touches the game's own localStorage.
  const storageFor = (kind: "local" | "session") => {
    const all = (w.__domainStorage ??= {});
    const id = `${env.key ?? "level"}:${kind}`;
    let map = all[id];
    if (!map) {
      map = new Map(Object.entries(env.storage?.[kind] ?? {}));
      all[id] = map;
    }
    const store = map;
    return {
      getItem: (k: string) => (store.has(String(k)) ? store.get(String(k))! : null),
      setItem: (k: string, v: unknown) => void store.set(String(k), String(v)),
      removeItem: (k: string) => void store.delete(String(k)),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    };
  };

  // fetch talks to the level's pretend server, after a short, realistic delay.
  const fakeFetch = (input: unknown, init: { method?: string; headers?: unknown; body?: unknown } = {}) => {
    const url = typeof input === "string" ? input : String((input as { url?: string })?.url ?? input);
    const method = (init.method ?? "GET").toUpperCase();
    const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
    const headers: Record<string, string> = {};
    if (init.headers && typeof init.headers === "object") {
      const h = init.headers as { forEach?: (fn: (v: string, k: string) => void) => void };
      if (typeof h.forEach === "function") h.forEach((v, k) => (headers[k.toLowerCase()] = v));
      else for (const [k, v] of Object.entries(init.headers)) headers[k.toLowerCase()] = String(v);
    }
    // Like a real request: a non-string body is sent as text ("[object Object]").
    let body: unknown = init.body === undefined || init.body === null ? undefined : String(init.body);
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        /* plain text body */
      }
    }
    const route = env.api?.[`${method} ${path}`];
    const reply: ApiReply = route
      ? typeof route === "function"
        ? route({ method, url: path, headers, body })
        : route
      : { status: 404, body: { error: `No route for ${method} ${path}` } };
    const sw = win as StageWindow;
    return new sw.Promise<Response>((resolve, reject) => {
      setTimeoutTracked(() => {
        if (reply.offline) return reject(new TypeError("Failed to fetch"));
        const status = reply.status ?? 200;
        const text = reply.body === undefined || status === 204 ? null : typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body);
        resolve(new sw.Response(text, { status, headers: { "Content-Type": "application/json" } }));
      }, reply.delay ?? 400);
    });
  };

  const moduleCache = new Map<string, unknown>();
  const importModule = (path: string): unknown => {
    if (moduleCache.has(path)) return moduleCache.get(path);
    const source = env.modules?.[path];
    if (source === undefined) throw new Error(`Cannot find module '${path}'`);
    const { code: body, exported } = modulesToScript(source);
    const factory = new (win as StageWindow).Function("__import", "console", `"use strict";\n${body}\nreturn { ${exported.join(", ")} };`);
    const exports = factory(importModule, makeConsole());
    moduleCache.set(path, exports);
    return exports;
  };

  try {
    const fn = new (win as StageWindow).Function(
      "console",
      "setTimeout",
      "setInterval",
      "__LoopError",
      "fetch",
      "localStorage",
      "sessionStorage",
      "__import",
      `"use strict"; let __loops = 0;\n${guarded}`
    );
    fn.call(undefined, makeConsole(), setTimeoutTracked, setIntervalTracked, LoopError, fakeFetch, storageFor("local"), storageFor("session"), importModule);
    return { result: { ok: true }, cleanup };
  } catch (err) {
    const stackLine = /<anonymous>:(\d+):\d+/.exec((err as Error)?.stack ?? "");
    // +2 lines of wrapper (Function header + our prologue line).
    const line = stackLine ? Math.max(1, Number(stackLine[1]) - 3) : undefined;
    return { result: { ok: false, line, ...explainRuntimeError(err) }, cleanup };
  }
}
