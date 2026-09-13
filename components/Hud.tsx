"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useLevelStore } from "@/lib/store";
import { CHAPTER_5, HINT_RUNGS, LEVELS } from "@/lib/levels";
import { Code } from "./Code";
import { GuidePortrait } from "./Emblems";

/** After a mouse click, hand focus back so the keyboard drives the player. */
function clicked(action: () => void) {
  return (e: MouseEvent<HTMLButtonElement>) => {
    action();
    if (e.detail > 0) e.currentTarget.blur();
  };
}

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
    const t = setTimeout(() => setStuckKey(attemptKey), 60_000);
    return () => clearTimeout(t);
  }, [phase, attemptKey]);

  if (phase !== "playing") return null;

  const rung = showingRung !== null && showingRung < hintRung ? showingRung : null;
  const offer = !dismissed && hintRung === 0 && (falls >= 2 || stuckForAWhile);
  if (rung === null && !offer) return null;

  return (
    <div role="status" className="rise-in pointer-events-auto absolute bottom-14 left-1/2 z-10 w-[min(460px,92%)] -translate-x-1/2">
      <div className="panel flex gap-3 px-4 py-3">
        <GuidePortrait size={44} />
        <div className="min-w-0 flex-1 text-[14px] leading-snug text-ink-100">
          <div className="hud-label text-[11px] text-gold-400">
            The Old Ant{rung !== null ? ` · ${HINT_RUNGS[rung]}` : ""}
          </div>
          {rung !== null ? (
            <Code text={level.hints[rung]} />
          ) : (
            <>
              {falls >= 2 ? "That jump can't be made the way the page is laid out. " : ""}
              The world won&apos;t change until the CSS does. Shall I point you somewhere?
            </>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {rung !== null ? (
              <>
                <button
                  onClick={clicked(() => {
                    setTab("lesson");
                    setShowingRung(null);
                  })}
                  className="btn btn-ghost btn-sm"
                >
                  More in the Lesson tab
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

export function Hud({ worldFocused }: { worldFocused: boolean }) {
  const phase = useLevelStore((s) => s.phase);
  const flatten = useLevelStore((s) => s.flatten);
  const toggleFlatten = useLevelStore((s) => s.toggleFlatten);
  const resetLevel = useLevelStore((s) => s.resetLevel);
  const respawn = useLevelStore((s) => s.respawn);
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const falls = useLevelStore((s) => s.falls);
  const level = LEVELS[levelIndex];
  const playing = phase === "playing";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="panel-soft pointer-events-auto max-w-90 px-3.5 py-2.5">
          <div className="hud-label flex items-center gap-2 text-[11px] text-gold-400">
            <span>Ch {CHAPTER_5.number}</span>
            <span className="text-ink-500">◆</span>
            <span>
              Quest {level.number}/{LEVELS.length}
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
            <button onClick={clicked(toggleFlatten)} aria-pressed={flatten} className="btn btn-ghost btn-sm" title="See the ordinary web page this world is built from">
              {flatten ? "Back to 3D" : "Flatten"} <span className="keycap">F</span>
            </button>
            <button onClick={clicked(respawn)} className="btn btn-ghost btn-sm">
              Respawn <span className="keycap">R</span>
            </button>
            <button onClick={clicked(resetLevel)} className="btn btn-ghost btn-sm" title="Put the CSS back to how the level started">
              Reset CSS
            </button>
          </div>
        )}
      </div>

      {playing && !flatten && (
        <div className="flex items-end justify-between gap-3">
          <div className="panel-soft flex items-center gap-3 px-3 py-1.5 text-[12px] text-ink-300">
            {worldFocused ? (
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
                <span className="hud-label text-[11px] text-teal-300">Click a block to inspect</span>
              </>
            ) : (
              <span className="hud-label text-[12px] text-ember-300">Click the world to take control</span>
            )}
          </div>
        </div>
      )}

      {playing && flatten && (
        <div className="panel-soft self-start px-3 py-1.5 text-[13px] text-ink-100">
          This is the web page your world is made of. Every block you stand on is one of these boxes.
        </div>
      )}

      <GuideBubble />
    </div>
  );
}
