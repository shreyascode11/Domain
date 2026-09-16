"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useLevelStore, useProgressStore } from "@/lib/store";
import { HINT_RUNGS, LEVELS, chapterOf, levelsIn } from "@/lib/levels";
import { Code } from "./Code";
import { GuidePortrait } from "./Emblems";
import { IconCube, IconLayers, IconReset, IconRespawn, IconSide } from "./Icons";

/** After a mouse click, hand focus back so the keyboard drives the player. */
function clicked(action: () => void) {
  return (e: MouseEvent<HTMLButtonElement>) => {
    action();
    if (e.detail > 0) e.currentTarget.blur();
  };
}

const FILE_LABEL = { html: "HTML", css: "CSS", js: "JavaScript" } as const;

function GuideBubble() {
  const phase = useLevelStore((s) => s.phase);
  const falls = useLevelStore((s) => s.falls);
  const hintRung = useLevelStore((s) => s.hintRung);
  const dismissed = useLevelStore((s) => s.guideDismissed);
  const dismiss = useLevelStore((s) => s.dismissGuide);
  const reveal = useLevelStore((s) => s.revealHint);
  const setTab = useLevelStore((s) => s.setSidePanelTab);
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const loadToken = useLevelStore((s) => s.levelLoadToken);
  const attemptKey = `${loadToken}:${phase}`;
  const [stuckKey, setStuckKey] = useState<string | null>(null);
  const [showingRung, setShowingRung] = useState<number | null>(null);
  const stuckForAWhile = stuckKey === attemptKey;
  const level = LEVELS[levelIndex];

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setTimeout(() => setStuckKey(attemptKey), 75_000);
    return () => clearTimeout(t);
  }, [phase, attemptKey]);

  if (phase !== "playing") return null;

  const rung = showingRung !== null && showingRung < hintRung ? showingRung : null;
  const offer = !dismissed && hintRung === 0 && (falls >= 3 || stuckForAWhile);
  if (rung === null && !offer) return null;

  return (
    <div role="status" className="rise-in pointer-events-auto absolute bottom-16 left-1/2 z-10 w-[min(460px,92%)] -translate-x-1/2">
      <div className="panel flex gap-3 px-4 py-3">
        <GuidePortrait size={44} />
        <div className="min-w-0 flex-1 text-[14px] leading-snug text-ink-100">
          <div className="hud-label text-[11px] text-gold-400">The Old Ant{rung !== null ? ` · ${HINT_RUNGS[rung]}` : ""}</div>
          {rung !== null ? (
            <Code text={level.hints[rung]} />
          ) : (
            <>
              {falls >= 3 ? "Jumping harder won't help — the page itself has to change. " : ""}
              The world only changes when the {FILE_LABEL[level.edit]} does. Want a nudge?
            </>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {rung !== null ? (
              <>
                <button
                  onClick={clicked(() => {
                    setTab("learn");
                    setShowingRung(null);
                  })}
                  className="btn btn-ghost btn-sm"
                >
                  More hints in Learn
                </button>
                <button onClick={clicked(() => setShowingRung(null))} className="btn btn-sm text-ink-300 hover:text-ink-100">
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={clicked(() => {
                    setShowingRung(0);
                    reveal();
                  })}
                  className="btn btn-gold btn-sm"
                >
                  Give me a hint
                </button>
                <button onClick={clicked(dismiss)} className="btn btn-sm text-ink-300 hover:text-ink-100">
                  Not yet
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The moment you land on the goal, before the debrief opens. */
function LevelClear() {
  const celebrating = useLevelStore((s) => s.celebrating);
  const concept = useLevelStore((s) => LEVELS[s.levelIndex].concept);
  if (!celebrating) return null;
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 top-[28%] flex justify-center">
      <div className="level-clear text-center">
        <div className="hud-label text-[12px] tracking-[0.4em] text-teal-300">Lesson complete</div>
        <div className="title-inscription font-display text-5xl font-black tracking-[0.12em] sm:text-6xl">Level Clear</div>
        <div className="mt-1 font-mono text-[13px] text-gold-200">{concept}</div>
      </div>
    </div>
  );
}

/** Announces that an edit has made the goal reachable. */
function PathOpenToast() {
  const token = useLevelStore((s) => s.pathOpenToken);
  const celebrating = useLevelStore((s) => s.celebrating);
  const [hiddenToken, setHiddenToken] = useState(0);
  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => setHiddenToken(token), 3400);
    return () => clearTimeout(t);
  }, [token]);
  if (!token || token === hiddenToken || celebrating) return null;
  return (
    <div role="status" key={token} className="path-open pointer-events-none absolute left-1/2 top-[26%] -translate-x-1/2">
      <div className="panel flex items-center gap-3 px-4 py-2.5">
        <span className="path-open-gem" aria-hidden />
        <div>
          <div className="hud-label text-[11px] text-jade-400">Your code worked</div>
          <div className="font-display text-[16px] font-bold text-gold-200">The way is open — walk to the goal</div>
        </div>
      </div>
    </div>
  );
}

/** A brief flash when Dom falls off the world. */
function FallFlash() {
  const token = useLevelStore((s) => s.fallToken);
  if (!token) return null;
  return <div key={token} className="fall-flash pointer-events-none absolute inset-0" aria-hidden />;
}

function Step({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span className={`flex items-center gap-1.5 ${done ? "text-jade-400" : "text-ink-200"}`}>
      <span className={`h-2 w-2 rotate-45 border ${done ? "border-jade-400 bg-jade-400" : "border-ink-400"}`} aria-hidden />
      {children}
    </span>
  );
}

/** Teaches the controls on the first level, then gets out of the way. */
function ControlsCoach({ typing }: { typing: boolean }) {
  const moved = useLevelStore((s) => s.moved);
  const jumped = useLevelStore((s) => s.jumped);
  const seen = useProgressStore((s) => s.seenControls);
  const markSeen = useProgressStore((s) => s.markControlsSeen);
  const learned = seen || (moved && jumped);

  useEffect(() => {
    if (moved && jumped && !seen) markSeen();
  }, [moved, jumped, seen, markSeen]);

  if (typing) {
    return (
      <div className="panel-soft flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-teal-300">
        Typing in the editor. Press <span className="keycap">Esc</span> to control Dom again.
      </div>
    );
  }

  return (
    <div className="panel-soft flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 text-[12px] text-ink-300">
      {learned ? (
        <>
          <span className="flex items-center gap-1">
            <span className="keycap">A</span>
            <span className="keycap">D</span>
            <span className="hud-label ml-0.5 text-[11px]">Move</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="keycap">Space</span>
            <span className="hud-label ml-0.5 text-[11px]">Jump</span>
          </span>
          <span className="hidden text-[11px] text-ink-400 md:inline">Right-drag look · Scroll zoom · Click a block to inspect</span>
        </>
      ) : (
        <>
          <span className="hud-label text-[11px] text-gold-400">Controls</span>
          <Step done={moved}>
            <span className="keycap">A</span>
            <span className="keycap">D</span> or arrows to walk
          </Step>
          <Step done={jumped}>
            <span className="keycap">Space</span> to jump
          </Step>
        </>
      )}
    </div>
  );
}

export function Hud({ typing }: { typing: boolean }) {
  const phase = useLevelStore((s) => s.phase);
  const flatten = useLevelStore((s) => s.flatten);
  const toggleFlatten = useLevelStore((s) => s.toggleFlatten);
  const resetLevel = useLevelStore((s) => s.resetLevel);
  const respawn = useLevelStore((s) => s.respawn);
  const view = useLevelStore((s) => s.view);
  const toggleView = useLevelStore((s) => s.toggleView);
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const falls = useLevelStore((s) => s.falls);
  const level = LEVELS[levelIndex];
  const chapter = chapterOf(level);
  const playing = phase === "playing";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="panel-soft pointer-events-auto max-w-96 px-3.5 py-2.5">
          <div className="hud-label flex items-center gap-2 text-[11px] text-gold-400">
            <span>
              {chapter.subject} · Lesson {level.number}/{levelsIn(chapter.number).length}
            </span>
            {falls > 0 && (
              <>
                <span className="text-ink-500">◆</span>
                <span className="text-ember-300">Falls {falls}</span>
              </>
            )}
          </div>
          <div className="mt-0.5 font-display text-[17px] font-bold text-gold-200">{level.title}</div>
          <div className="mt-1 text-[13px] leading-snug text-ink-200">
            <Code text={level.objective} />
          </div>
        </div>

        {playing && (
          <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
            {!flatten && (
              <button onClick={clicked(toggleView)} className="btn btn-ghost btn-sm" title="Switch camera (V)">
                {view === "3d" ? <IconCube size={14} /> : <IconSide size={14} />}
                {view === "3d" ? "3D view" : "Side view"} <span className="keycap">V</span>
              </button>
            )}
            <button onClick={clicked(toggleFlatten)} aria-pressed={flatten} className="btn btn-ghost btn-sm" title="See the ordinary web page this world is built from">
              <IconLayers size={14} />
              {flatten ? "Back to 3D" : "Web page"} <span className="keycap">F</span>
            </button>
            <button onClick={clicked(respawn)} className="btn btn-ghost btn-sm" title="Put Dom back at the start">
              <IconRespawn size={14} /> <span className="keycap">R</span>
            </button>
            <button onClick={clicked(resetLevel)} className="btn btn-ghost btn-sm" title={`Put the ${FILE_LABEL[level.edit]} back to how the level started`}>
              <IconReset size={14} /> Reset code
            </button>
          </div>
        )}
      </div>

      {playing && !flatten && (
        <div className="flex items-end justify-between gap-3">
          <ControlsCoach typing={typing} />
        </div>
      )}

      {playing && flatten && (
        <div className="panel-soft self-start px-3 py-1.5 text-[13px] text-ink-100">
          This is the real web page your world is made of. Every block you stand on is one of these boxes.
        </div>
      )}

      <GuideBubble />
      <PathOpenToast />
      <LevelClear />
      <FallFlash />
    </div>
  );
}
