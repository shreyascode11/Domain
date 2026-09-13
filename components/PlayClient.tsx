"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { HiddenStage } from "./HiddenStage";
import { Scene3D } from "./Scene3D";
import { Hud } from "./Hud";
import { CodePanel } from "./CodePanel";
import { Inspector } from "./Inspector";
import { IntroOverlay, DebriefOverlay, ChapterCompleteOverlay, LevelMap } from "./Overlays";
import { useLevelStore, useProgressStore, firstIncompleteIndex, isUnlocked } from "@/lib/store";
import { CHAPTER_5, LEVELS } from "@/lib/levels";
import { STAGE_WIDTH, STAGE_HEIGHT } from "@/lib/constants";

/**
 * The Level View (blueprint §11.2): viewport + side panel. The 3D view fills
 * the space; the page it's built from is always laid out at a fixed
 * STAGE_WIDTH × STAGE_HEIGHT (see lib/constants.ts) so the px → world-unit
 * mapping stays exact.
 */
export function PlayClient() {
  const flatten = useLevelStore((s) => s.flatten);
  const phase = useLevelStore((s) => s.phase);
  const loadLevel = useLevelStore((s) => s.loadLevel);
  const progress = useProgressStore((s) => s.levels);
  const worldReady = useLevelStore((s) => s.measuredLoadToken === s.levelLoadToken);
  const [hydrated, setHydrated] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [worldFocused, setWorldFocused] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pageScale, setPageScale] = useState(1);

  // The 3D view fills the space; the flattened page is scaled to fit inside it.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPageScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT) * 0.96);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load saved progress, then open the first level you haven't finished
  // (or ?level=N, if that level is unlocked).
  useEffect(() => {
    Promise.resolve(useProgressStore.persist.rehydrate()).then(() => {
      const saved = useProgressStore.getState().levels;
      const requested = Number(new URLSearchParams(window.location.search).get("level"));
      const index =
        Number.isInteger(requested) && requested >= 1 && requested <= LEVELS.length && isUnlocked(requested - 1, saved)
          ? requested - 1
          : firstIncompleteIndex(saved);
      loadLevel(index);
      setHydrated(true);
    });
  }, [loadLevel]);

  // Focus the world when a level starts so the keys work straight away.
  useEffect(() => {
    if (phase === "playing") viewportRef.current?.focus({ preventScroll: true });
  }, [phase]);

  // World shortcuts — only while the world itself has focus, never while typing.
  const onWorldKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== viewportRef.current || phase !== "playing") return;
    const s = useLevelStore.getState();
    if (e.code === "KeyF") s.toggleFlatten();
    else if (e.code === "KeyR") s.respawn();
    else if (e.code === "KeyM") setMapOpen(true);
  };

  const completed = LEVELS.filter((l) => progress[l.id]?.completed).length;

  return (
    <div className="bg-night-map flex h-screen w-full flex-col text-ink-100">
      <header className="relative flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gold-600/30 bg-linear-to-b from-ink-850 to-ink-900 px-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="title-inscription font-display text-xl font-black tracking-[0.2em]">
            DOMAIN
          </Link>
          <span className="hud-label hidden text-[11px] text-ink-400 md:inline">
            Chapter {CHAPTER_5.number} · {CHAPTER_5.title}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1.5 sm:flex" aria-label={`${completed} of ${LEVELS.length} quests complete`}>
            {LEVELS.map((l, i) => {
              const p = progress[l.id];
              return (
                <span key={l.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className={`h-px w-4 ${progress[LEVELS[i - 1].id]?.completed ? "bg-gold-500/70" : "bg-ink-600"}`} />}
                  <span
                    title={l.title}
                    className={`block h-3 w-3 rotate-45 border ${
                      p?.gold
                        ? "border-gold-300 bg-gold-400 shadow-[0_0_10px_rgba(224,184,95,0.7)]"
                        : p?.completed
                          ? "border-jade-400 bg-jade-600"
                          : "border-ink-500 bg-ink-800"
                    }`}
                  />
                </span>
              );
            })}
            <span className="hud-label ml-2 text-[12px] text-ink-300">
              {completed}/{LEVELS.length}
            </span>
          </div>
          <button onClick={() => setMapOpen(true)} className="btn btn-ghost btn-sm">
            Map <span className="keycap">M</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex h-[62vh] min-h-105 min-w-0 p-3 lg:h-auto lg:flex-[1.65]">
          <div
            ref={viewportRef}
            tabIndex={0}
            aria-label="Game world. Use A and D or the arrow keys to move, and Space to jump."
            onKeyDown={onWorldKey}
            onPointerDown={() => viewportRef.current?.focus({ preventScroll: true })}
            onFocus={() => setWorldFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setWorldFocused(false);
            }}
            className={`relative h-full w-full overflow-hidden bg-ink-950 outline-none transition-shadow ${
              worldFocused && phase === "playing"
                ? "shadow-[0_0_0_1px_rgba(63,224,200,0.7),0_0_30px_-4px_rgba(63,224,200,0.35)]"
                : "shadow-[0_0_0_1px_rgba(199,154,62,0.35)]"
            }`}
          >
            <HiddenStage visible={flatten} scale={pageScale} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: flatten ? 0 : 1,
                pointerEvents: flatten ? "none" : "auto",
                transition: "opacity 180ms ease",
              }}
            >
              <Scene3D />
            </div>
            {!worldReady && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink-950">
                <span className="h-3 w-3 animate-spin border-2 border-gold-400 border-t-transparent" aria-hidden />
                <span className="hud-label text-[13px] text-gold-300">Raising the world from the page…</span>
              </div>
            )}
            <Hud worldFocused={worldFocused} />
            {!flatten && phase === "playing" && <Inspector />}

            {hydrated && phase === "intro" && <IntroOverlay />}
            {phase === "debrief" && <DebriefOverlay />}
            {phase === "chapter-complete" && <ChapterCompleteOverlay onOpenMap={() => setMapOpen(true)} />}
            {mapOpen && <LevelMap onClose={() => setMapOpen(false)} />}
          </div>
        </div>

        <div className="min-h-80 flex-1 border-t border-gold-600/25 lg:min-h-0 lg:min-w-95 lg:max-w-140 lg:border-l lg:border-t-0">
          <CodePanel />
        </div>
      </div>
    </div>
  );
}
