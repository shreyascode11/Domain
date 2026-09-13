import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LEVELS } from "./levels";
import type { WorldObject } from "./layout";
import { diffCss, type CssChange, type CssIssue } from "./cssParse";

export type Phase = "intro" | "playing" | "debrief" | "chapter-complete";

export type LevelResult = {
  gold: boolean;
  assisted: boolean;
  note?: string;
  changes: CssChange[];
};

export type LevelProgress = { completed: boolean; gold: boolean; assisted: boolean };

/* ------------------------------------------------------------------ */
/* Saved progress (localStorage). Hydrated explicitly on mount, so the  */
/* server render and the first client render agree.                   */
/* ------------------------------------------------------------------ */

type ProgressState = {
  levels: Record<string, LevelProgress>;
  seenChapterIntro: Record<number, boolean>;
  record: (levelId: string, result: LevelProgress) => void;
  markChapterIntroSeen: (chapter: number) => void;
  clear: () => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      levels: {},
      seenChapterIntro: {},
      record: (levelId, result) =>
        set((s) => {
          const prev = s.levels[levelId];
          return {
            levels: {
              ...s.levels,
              [levelId]: {
                completed: true,
                // Keep the best result you've ever had on a level.
                gold: result.gold || !!prev?.gold,
                assisted: prev ? prev.assisted && result.assisted : result.assisted,
              },
            },
          };
        }),
      markChapterIntroSeen: (chapter) =>
        set((s) => ({ seenChapterIntro: { ...s.seenChapterIntro, [chapter]: true } })),
      clear: () => set({ levels: {}, seenChapterIntro: {} }),
    }),
    {
      name: "domain-progress-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

/** Levels unlock in order; a level is playable once the one before it is done. */
export function isUnlocked(index: number, progress: Record<string, LevelProgress>) {
  if (index === 0) return true;
  return !!progress[LEVELS[index - 1].id]?.completed;
}

export function firstIncompleteIndex(progress: Record<string, LevelProgress>) {
  const i = LEVELS.findIndex((l) => !progress[l.id]?.completed);
  return i === -1 ? 0 : i;
}

/* ------------------------------------------------------------------ */
/* The live level session.                                             */
/* ------------------------------------------------------------------ */

type LevelState = {
  levelIndex: number;
  phase: Phase;

  /** What's in the editors right now (may be mid-typing / invalid). */
  html: string;
  css: string;
  /** The last CSS that validated and was actually applied to the world. */
  appliedCss: string;
  cssIssues: CssIssue[];

  setHtml: (html: string) => void;
  setCss: (css: string) => void;
  setApplied: (css: string) => void;
  setCssIssues: (issues: CssIssue[]) => void;

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
  openChapterComplete: () => void;

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

  selectedKey: string | null;
  select: (key: string | null) => void;

  /** Ask the editor to switch to the CSS tab and put the cursor on a line. */
  cssJump: { line: number; nonce: number } | null;
  jumpToCss: (line: number) => void;
  sidePanelTab: "lesson" | "css" | "html";
  setSidePanelTab: (tab: "lesson" | "css" | "html") => void;
};

function sameWorld(a: WorldObject[], b: WorldObject[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.key !== y.key || x.visible !== y.visible || x.color !== y.color || x.borderColor !== y.borderColor)
      return false;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(x.position[k] - y.position[k]) > 1e-4) return false;
      if (Math.abs(x.size[k] - y.size[k]) > 1e-4) return false;
    }
  }
  return true;
}

const first = LEVELS[0];

export const useLevelStore = create<LevelState>((set, get) => ({
  levelIndex: 0,
  phase: "intro",

  html: first.html,
  css: first.css,
  appliedCss: first.css,
  cssIssues: [],

  setHtml: (html) => set({ html }),
  setCss: (css) => set({ css }),
  setApplied: (appliedCss) => set({ appliedCss }),
  setCssIssues: (cssIssues) => set({ cssIssues }),

  levelLoadToken: 1,
  measuredLoadToken: 0,
  worldObjects: [],
  worldRevision: 0,
  setWorld: (objects, loadToken) => {
    const s = get();
    if (loadToken !== s.levelLoadToken) return; // measurement of a level we've left
    if (s.measuredLoadToken === loadToken && sameWorld(s.worldObjects, objects)) {
      // Nothing actually moved (e.g. a whitespace edit): keep the old array
      // so the scene doesn't re-render and the player isn't re-settled.
      set({ worldObjects: s.worldObjects.map((o, i) => ({ ...o, inspect: objects[i].inspect })) });
      return;
    }
    set({
      worldObjects: objects,
      measuredLoadToken: loadToken,
      worldRevision: s.worldRevision + 1,
    });
  },

  loadLevel: (index) => {
    const level = LEVELS[index];
    set((s) => ({
      levelIndex: index,
      phase: "intro",
      html: level.html,
      css: level.css,
      appliedCss: level.css,
      cssIssues: [],
      levelLoadToken: s.levelLoadToken + 1,
      result: null,
      hintRung: 0,
      falls: 0,
      guideDismissed: false,
      flatten: false,
      selectedKey: null,
      sidePanelTab: "lesson",
    }));
  },

  startLevel: () => set({ phase: "playing" }),

  resetLevel: () => {
    const level = LEVELS[get().levelIndex];
    set((s) => ({
      html: level.html,
      css: level.css,
      appliedCss: level.css,
      cssIssues: [],
      result: null,
      phase: "playing",
      falls: 0,
      selectedKey: null,
      respawnToken: s.respawnToken + 1,
    }));
  },

  completeLevel: () => {
    const s = get();
    if (s.phase !== "playing") return;
    const level = LEVELS[s.levelIndex];
    const rubric = level.rubric(s.appliedCss);
    const assisted = s.hintRung >= 5;
    const result: LevelResult = {
      gold: rubric.gold && !assisted,
      assisted,
      note: rubric.note,
      changes: diffCss(level.css, s.appliedCss),
    };
    useProgressStore.getState().record(level.id, {
      completed: true,
      gold: result.gold,
      assisted,
    });
    set({ phase: "debrief", result, selectedKey: null, flatten: false });
  },

  nextLevel: () => {
    const s = get();
    if (s.levelIndex + 1 < LEVELS.length) get().loadLevel(s.levelIndex + 1);
    else set({ phase: "chapter-complete" });
  },

  openChapterComplete: () => set({ phase: "chapter-complete" }),

  result: null,

  hintRung: 0,
  revealHint: () => set((s) => ({ hintRung: Math.min(5, s.hintRung + 1), guideDismissed: true })),
  falls: 0,
  recordFall: () => set((s) => ({ falls: s.falls + 1 })),
  guideDismissed: false,
  dismissGuide: () => set({ guideDismissed: true }),

  flatten: false,
  toggleFlatten: () => set((s) => ({ flatten: !s.flatten })),

  respawnToken: 0,
  respawn: () => set((s) => ({ respawnToken: s.respawnToken + 1 })),

  selectedKey: null,
  select: (selectedKey) => set({ selectedKey }),

  cssJump: null,
  jumpToCss: (line) =>
    set((s) => ({ cssJump: { line, nonce: (s.cssJump?.nonce ?? 0) + 1 }, sidePanelTab: "css" })),
  sidePanelTab: "lesson",
  setSidePanelTab: (sidePanelTab) => set({ sidePanelTab }),
}));

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // Debug hook only: lets automation inspect live scene state.
  (window as unknown as { __domainStore?: typeof useLevelStore }).__domainStore = useLevelStore;
}
