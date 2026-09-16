import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LEVELS, type FileKind } from "./levels";
import type { WorldObject } from "./layout";
import { diffCss, type CssIssue } from "./cssParse";
import type { ConsoleLine } from "./jsRun";
import { countMatches } from "./stage";
import { XP, dayKey, isYesterday, rankFor } from "./ranks";

export type Phase = "intro" | "playing" | "debrief" | "chapter-complete";
export type PanelTab = "learn" | FileKind;

export type Change =
  | { kind: "css"; selector: string; prop: string; before: string | null; after: string | null }
  | { kind: "line"; file: FileKind; op: "added" | "removed"; text: string };

export type LevelResult = {
  gold: boolean;
  assisted: boolean;
  note?: string;
  changes: Change[];
  /** XP earned by this completion (0 on a replay that improved nothing). */
  xp: number;
  /** Total XP before this completion, for the debrief's progress bar. */
  xpBefore: number;
  /** A new rank reached by this completion. */
  rankUp: string | null;
  /** The streak after this completion, and whether it grew today. */
  streak: number;
  streakGrew: boolean;
};

export type LevelProgress = { completed: boolean; gold: boolean; assisted: boolean };

/* ------------------------------------------------------------------ */
/* Saved progress (localStorage). Hydrated explicitly on mount, so the  */
/* server render and the first client render agree.                   */
/* ------------------------------------------------------------------ */

export type Award = { xp: number; xpBefore: number; rankUp: string | null; streak: number; streakGrew: boolean };

type ProgressState = {
  levels: Record<string, LevelProgress>;
  seenChapterIntro: Record<number, boolean>;
  seenControls: boolean;
  xp: number;
  /** Days in a row with at least one lesson finished. */
  streak: { count: number; last: string | null };
  record: (levelId: string, result: LevelProgress) => Award;
  markChapterIntroSeen: (chapter: number) => void;
  markControlsSeen: () => void;
  clear: () => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      levels: {},
      seenChapterIntro: {},
      seenControls: false,
      xp: 0,
      streak: { count: 0, last: null },
      record: (levelId, result) => {
        const s = get();
        const prev = s.levels[levelId];
        const today = dayKey();
        const streakGrew = s.streak.last !== today;
        const streak = !streakGrew ? s.streak.count : s.streak.last && isYesterday(s.streak.last) ? s.streak.count + 1 : 1;
        // XP only for something new: a first clear, a first gold, a new streak day.
        let xp = 0;
        if (!prev?.completed) xp += XP.firstClear;
        if (result.gold && !prev?.gold) xp += XP.firstGold;
        if (streakGrew && streak > 1) xp += XP.streakDay;
        const before = rankFor(s.xp);
        const after = rankFor(s.xp + xp);
        set({
          xp: s.xp + xp,
          streak: { count: streak, last: today },
          levels: {
            ...s.levels,
            [levelId]: {
              completed: true,
              // Keep the best result you've ever had on a level.
              gold: result.gold || !!prev?.gold,
              assisted: prev ? prev.assisted && result.assisted : result.assisted,
            },
          },
        });
        return { xp, xpBefore: s.xp, rankUp: after.index > before.index ? after.name : null, streak, streakGrew };
      },
      markChapterIntroSeen: (chapter) => set((s) => ({ seenChapterIntro: { ...s.seenChapterIntro, [chapter]: true } })),
      markControlsSeen: () => set({ seenControls: true }),
      clear: () => set({ levels: {}, seenChapterIntro: {}, seenControls: false, xp: 0, streak: { count: 0, last: null } }),
    }),
    {
      name: "domain-progress-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      // Progress saved before XP existed: credit what was already earned.
      migrate: (persisted, version) => {
        const state = persisted as Partial<ProgressState>;
        if (version < 1) {
          const levels = state.levels ?? {};
          const xp = Object.values(levels).reduce((sum, l) => sum + (l.completed ? XP.firstClear : 0) + (l.gold ? XP.firstGold : 0), 0);
          return { ...state, xp, streak: { count: 0, last: null } } as ProgressState;
        }
        return state as ProgressState;
      },
    }
  )
);

/** Review mode: every level is open. Set back to false to restore in-order unlocking. */
export const UNLOCK_ALL_LEVELS = false;

/**
 * Levels unlock in order. A level you've already completed always stays
 * open, so progress saved before new chapters were added isn't locked away.
 */
export function isUnlocked(index: number, progress: Record<string, LevelProgress>) {
  if (UNLOCK_ALL_LEVELS || index === 0) return true;
  return !!progress[LEVELS[index].id]?.completed || !!progress[LEVELS[index - 1].id]?.completed;
}

export function firstIncompleteIndex(progress: Record<string, LevelProgress>) {
  const i = LEVELS.findIndex((l, idx) => !progress[l.id]?.completed && isUnlocked(idx, progress));
  return i === -1 ? 0 : i;
}

/**
 * A small line diff (longest common subsequence over trimmed, non-blank
 * lines), so moving a line shows up as removed here and added there.
 */
function lineChanges(file: FileKind, before: string, after: string): Change[] {
  const a = before.split("\n").map((l) => l.trim()).filter(Boolean);
  const b = after.split("\n").map((l) => l.trim()).filter(Boolean);
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out: Change[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      i++;
      j++;
    } else if (j < b.length && (i === a.length || lcs[i][j + 1] >= lcs[i + 1][j])) {
      out.push({ kind: "line", file, op: "added", text: b[j++] });
    } else {
      out.push({ kind: "line", file, op: "removed", text: a[i++] });
    }
  }
  return out.slice(0, 14);
}

/* ------------------------------------------------------------------ */
/* The live level session.                                             */
/* ------------------------------------------------------------------ */

type Issues = Record<FileKind, CssIssue[]>;

type LevelState = {
  levelIndex: number;
  phase: Phase;

  /** What's in the editors right now (may be mid-typing / invalid). */
  html: string;
  css: string;
  js: string;
  /** The last HTML/CSS that validated and was applied to the page. */
  appliedHtml: string;
  appliedCss: string;
  /** The JavaScript that was last run. */
  ranJs: string;
  issues: Issues;

  setFile: (file: FileKind, text: string) => void;
  setApplied: (html: string, css: string) => void;
  setIssues: (file: FileKind, issues: CssIssue[]) => void;
  resetFile: (file: FileKind) => void;

  /** Bumped by the Run button; the stage re-runs JavaScript when it changes. */
  jsRunToken: number;
  runJs: () => void;
  console: ConsoleLine[];
  logConsole: (line: ConsoleLine) => void;
  clearConsole: () => void;
  jsStatus: { state: "idle" | "ran" | "error"; message?: string; hint?: string; line?: number };
  setJsStatus: (s: LevelState["jsStatus"]) => void;

  /** Bumped on every level load/reset, so stale measurements are ignored. */
  levelLoadToken: number;
  measuredLoadToken: number;
  worldObjects: WorldObject[];
  worldRevision: number;
  setWorld: (objects: WorldObject[], loadToken: number) => void;

  loadLevel: (index: number) => void;
  startLevel: () => void;
  resetLevel: () => void;
  completeLevel: () => void;
  nextLevel: () => void;

  result: LevelResult | null;

  hintRung: number; // how many hint rungs are revealed, 0..5
  revealHint: () => void;
  falls: number;
  recordFall: () => void;
  guideDismissed: boolean;
  dismissGuide: () => void;

  flatten: boolean;
  toggleFlatten: () => void;

  respawnToken: number;
  respawn: () => void;

  /** Standing on the goal: a short celebration before the debrief. */
  celebrating: boolean;
  beginCelebration: () => void;
  /** Bumped each time Dom falls off the world. */
  fallToken: number;
  /** Whether the goal is currently reachable; null until the level is measured. */
  pathOpen: boolean | null;
  /** Bumped when an edit turns a blocked layout into a crossable one. */
  pathOpenToken: number;
  setPathOpen: (open: boolean, announce: boolean) => void;

  selectedKey: string | null;
  select: (key: string | null) => void;
  hoveredKey: string | null;
  hover: (key: string | null) => void;

  /** "3d": three-quarter follow camera. "side": flat side-on view. */
  view: "3d" | "side";
  toggleView: () => void;

  /** First-time control coaching. */
  moved: boolean;
  jumped: boolean;
  noteMoved: () => void;
  noteJumped: () => void;

  /** Ask an editor to open and put the cursor on a line. */
  jump: { file: FileKind; line: number; nonce: number } | null;
  jumpTo: (file: FileKind, line: number) => void;
  sidePanelTab: PanelTab;
  setSidePanelTab: (tab: PanelTab) => void;
};

function sameWorld(a: WorldObject[], b: WorldObject[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.key !== y.key || x.visible !== y.visible || x.color !== y.color || x.borderColor !== y.borderColor) return false;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(x.position[k] - y.position[k]) > 1e-4) return false;
      if (Math.abs(x.size[k] - y.size[k]) > 1e-4) return false;
    }
  }
  return true;
}

const noIssues = (): Issues => ({ html: [], css: [], js: [] });
const first = LEVELS[0];

export const useLevelStore = create<LevelState>((set, get) => ({
  levelIndex: 0,
  phase: "intro",

  html: first.html,
  css: first.css,
  js: first.js ?? "",
  appliedHtml: first.html,
  appliedCss: first.css,
  ranJs: first.js ?? "",
  issues: noIssues(),

  setFile: (file, text) => set({ [file]: text } as Pick<LevelState, typeof file>),
  setApplied: (appliedHtml, appliedCss) => set({ appliedHtml, appliedCss }),
  setIssues: (file, list) => set((s) => ({ issues: { ...s.issues, [file]: list } })),
  resetFile: (file) => {
    const level = LEVELS[get().levelIndex];
    const original = file === "js" ? level.js ?? "" : level[file];
    set({ [file]: original } as Pick<LevelState, typeof file>);
    if (file === "js") get().runJs();
  },

  jsRunToken: 0,
  runJs: () => set((s) => ({ jsRunToken: s.jsRunToken + 1, ranJs: s.js })),
  console: [],
  logConsole: (line) => set((s) => ({ console: [...s.console, line].slice(-60) })),
  clearConsole: () => set({ console: [] }),
  jsStatus: { state: "idle" },
  setJsStatus: (jsStatus) => set({ jsStatus }),

  levelLoadToken: 1,
  measuredLoadToken: 0,
  worldObjects: [],
  worldRevision: 0,
  setWorld: (objects, loadToken) => {
    const s = get();
    if (loadToken !== s.levelLoadToken) return; // measurement of a level we've left
    if (s.measuredLoadToken === loadToken && sameWorld(s.worldObjects, objects)) {
      // Nothing moved (e.g. a whitespace edit): keep the old array so the
      // scene doesn't re-render and the player isn't re-settled.
      set({ worldObjects: s.worldObjects.map((o, i) => ({ ...o, inspect: objects[i].inspect })) });
      return;
    }
    set({ worldObjects: objects, measuredLoadToken: loadToken, worldRevision: s.worldRevision + 1 });
  },

  loadLevel: (index) => {
    const level = LEVELS[index];
    set((s) => ({
      levelIndex: index,
      phase: "intro",
      html: level.html,
      css: level.css,
      js: level.js ?? "",
      appliedHtml: level.html,
      appliedCss: level.css,
      ranJs: level.js ?? "",
      issues: noIssues(),
      console: [],
      jsStatus: { state: "idle" },
      levelLoadToken: s.levelLoadToken + 1,
      result: null,
      hintRung: 0,
      falls: 0,
      celebrating: false,
      pathOpen: null,
      guideDismissed: false,
      flatten: false,
      selectedKey: null,
      hoveredKey: null,
      sidePanelTab: "learn",
    }));
  },

  startLevel: () => set({ phase: "playing", sidePanelTab: LEVELS[get().levelIndex].edit }),

  resetLevel: () => {
    const level = LEVELS[get().levelIndex];
    set((s) => ({
      html: level.html,
      css: level.css,
      js: level.js ?? "",
      appliedHtml: level.html,
      appliedCss: level.css,
      ranJs: level.js ?? "",
      issues: noIssues(),
      console: [],
      jsStatus: { state: "idle" },
      levelLoadToken: s.levelLoadToken + 1,
      result: null,
      phase: "playing",
      falls: 0,
      celebrating: false,
      pathOpen: null,
      selectedKey: null,
    }));
  },

  completeLevel: () => {
    const s = get();
    if (s.phase !== "playing") return;
    const level = LEVELS[s.levelIndex];
    const rubric = level.rubric({ html: s.appliedHtml, css: s.appliedCss, js: s.ranJs, count: countMatches });
    const assisted = s.hintRung >= 5;
    const changes: Change[] =
      level.edit === "css"
        ? diffCss(level.css, s.appliedCss).map((c) => ({ kind: "css" as const, ...c }))
        : lineChanges(level.edit, level.edit === "html" ? level.html : level.js ?? "", level.edit === "html" ? s.appliedHtml : s.ranJs);
    const gold = rubric.gold && !assisted;
    const award = useProgressStore.getState().record(level.id, { completed: true, gold, assisted });
    const result: LevelResult = { gold, assisted, note: rubric.note, changes, ...award };
    set({ phase: "debrief", result, selectedKey: null, flatten: false, celebrating: false });
  },

  nextLevel: () => {
    const s = get();
    const here = LEVELS[s.levelIndex];
    const next = LEVELS[s.levelIndex + 1];
    if (!next) return set({ phase: "chapter-complete" });
    if (next.chapter !== here.chapter && s.phase === "debrief") return set({ phase: "chapter-complete" });
    get().loadLevel(s.levelIndex + 1);
  },

  result: null,

  hintRung: 0,
  revealHint: () => set((s) => ({ hintRung: Math.min(5, s.hintRung + 1), guideDismissed: true })),
  falls: 0,
  recordFall: () => set((s) => ({ falls: s.falls + 1, fallToken: s.fallToken + 1 })),

  celebrating: false,
  beginCelebration: () => set({ celebrating: true, selectedKey: null }),
  fallToken: 0,
  pathOpen: null,
  pathOpenToken: 0,
  setPathOpen: (open, announce) => set((s) => ({ pathOpen: open, pathOpenToken: announce ? s.pathOpenToken + 1 : s.pathOpenToken })),
  guideDismissed: false,
  dismissGuide: () => set({ guideDismissed: true }),

  flatten: false,
  toggleFlatten: () => set((s) => ({ flatten: !s.flatten })),

  respawnToken: 0,
  respawn: () => set((s) => ({ respawnToken: s.respawnToken + 1 })),

  selectedKey: null,
  select: (selectedKey) => set({ selectedKey }),
  hoveredKey: null,
  hover: (hoveredKey) => (get().hoveredKey === hoveredKey ? undefined : set({ hoveredKey })),

  view: "3d",
  toggleView: () => set((s) => ({ view: s.view === "3d" ? "side" : "3d" })),

  moved: false,
  jumped: false,
  noteMoved: () => (get().moved ? undefined : set({ moved: true })),
  noteJumped: () => (get().jumped ? undefined : set({ jumped: true })),

  jump: null,
  jumpTo: (file, line) => set((s) => ({ jump: { file, line, nonce: (s.jump?.nonce ?? 0) + 1 }, sidePanelTab: file })),
  sidePanelTab: "learn",
  setSidePanelTab: (sidePanelTab) => set({ sidePanelTab }),
}));

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // Debug hook only: lets automation inspect live scene state.
  (window as unknown as { __domainStore?: typeof useLevelStore }).__domainStore = useLevelStore;
}
