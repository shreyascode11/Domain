"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { HiddenStage } from "./HiddenStage";
import { Scene3D } from "./Scene3D";
import { Hud } from "./Hud";
import { CodePanel } from "./CodePanel";
import { Inspector } from "./Inspector";
import { IntroOverlay, DebriefOverlay, ChapterCompleteOverlay, LevelMap } from "./Overlays";
import { SiteOverlay } from "./SiteBuild";
import { IconMap, IconMute, IconSite, IconSound } from "./Icons";
import { useLevelStore, useProgressStore, firstIncompleteIndex, isUnlocked } from "@/lib/store";
import { CHAPTERS, LEVELS, chapterOf, levelsIn } from "@/lib/levels";
import { STAGE_WIDTH, STAGE_HEIGHT } from "@/lib/constants";
import { cameraInput, touchInput, LOOK_LIMIT, ZOOM_LIMIT } from "@/lib/input";
import { isTypingTarget } from "@/hooks/useKeyboardControls";
import { sound } from "@/lib/audio";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function TouchButton({ label, input, children }: { label: string; input: keyof typeof touchInput; children: React.ReactNode }) {
  const set = (on: boolean) => (e: ReactPointerEvent) => {
    e.preventDefault();
    touchInput[input] = on;
  };
  return (
    <button
      aria-label={label}
      onPointerDown={set(true)}
      onPointerUp={set(false)}
      onPointerCancel={set(false)}
      onPointerLeave={set(false)}
      onContextMenu={(e) => e.preventDefault()}
      className="panel-soft pointer-events-auto flex h-14 w-14 select-none items-center justify-center text-xl text-gold-200 active:bg-gold-400/20"
    >
      {children}
    </button>
  );
}

/**
 * The level view: 3D world + side panel. The page the world is built from
 * is always laid out at a fixed STAGE_WIDTH × STAGE_HEIGHT (lib/constants.ts)
 * so the px → world-unit mapping stays exact.
 */
export function PlayClient() {
  const flatten = useLevelStore((s) => s.flatten);
  const phase = useLevelStore((s) => s.phase);
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const loadLevel = useLevelStore((s) => s.loadLevel);
  const progress = useProgressStore((s) => s.levels);
  const worldReady = useLevelStore((s) => s.measuredLoadToken === s.levelLoadToken);
  const [hydrated, setHydrated] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [muted, setMuted] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pageScale, setPageScale] = useState(1);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const chapter = chapterOf(LEVELS[levelIndex]);

  // Browser-only state, read after mount so server and client HTML agree.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(sound.isMuted());
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Is the keyboard typing into an editor right now?
  useEffect(() => {
    const update = () => setTyping(isTypingTarget(document.activeElement));
    const later = () => setTimeout(update, 0);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", later);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", later);
    };
  }, []);

  // Shortcuts work whenever you aren't typing — no need to click the world first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (isTypingTarget(e.target)) return;
      if (e.target instanceof HTMLElement && e.target.closest("[role='dialog']") && e.code !== "Escape") return;
      if (e.code === "KeyM") {
        setSiteOpen(false);
        setMapOpen((open) => !open);
        return;
      }
      if (e.code === "KeyB") {
        setMapOpen(false);
        setSiteOpen((open) => !open);
        return;
      }
      const s = useLevelStore.getState();
      if (s.phase !== "playing" || mapOpen || siteOpen) return;
      if (e.code === "KeyF") s.toggleFlatten();
      else if (e.code === "KeyR") s.respawn();
      else if (e.code === "KeyV") s.toggleView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapOpen, siteOpen]);

  // The flattened page is scaled to fit inside the viewport.
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

  // Load saved progress, then open the first unfinished level (or ?level=N if unlocked).
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

  // Wheel zoom without scrolling the page (needs a non-passive listener).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const s = useLevelStore.getState();
      if (s.phase !== "playing" || s.flatten) return;
      // A dialog over the world (the map, a hint) scrolls itself instead.
      if (e.target instanceof Element && e.target.closest('[role="dialog"]')) return;
      e.preventDefault();
      cameraInput.zoom = clamp(cameraInput.zoom * Math.exp(e.deltaY * 0.0012), ZOOM_LIMIT.min, ZOOM_LIMIT.max);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Right- or middle-drag looks around; the view springs back when released.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (document.activeElement instanceof HTMLElement && isTypingTarget(document.activeElement)) document.activeElement.blur();
    if (e.button !== 2 && e.button !== 1) return;
    e.preventDefault();
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    cameraInput.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    cameraInput.lookYaw = clamp(cameraInput.lookYaw - (e.clientX - d.x) * 0.004, -LOOK_LIMIT.yaw, LOOK_LIMIT.yaw);
    cameraInput.lookPitch = clamp(cameraInput.lookPitch + (e.clientY - d.y) * 0.003, -LOOK_LIMIT.pitch, LOOK_LIMIT.pitch);
    d.x = e.clientX;
    d.y = e.clientY;
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    cameraInput.dragging = false;
  };

  const completed = LEVELS.filter((l) => progress[l.id]?.completed).length;

  return (
    <div className="bg-night-map flex h-screen w-full flex-col text-ink-100">
      <header className="relative flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gold-600/30 bg-linear-to-b from-ink-850 to-ink-900 px-5">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="title-inscription font-display text-xl font-black tracking-[0.2em]">
            DOMAIN
          </Link>
          <span className="hud-label hidden truncate text-[11px] text-ink-400 md:inline">
            Chapter {chapter.number} · {chapter.subject} · {chapter.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-end gap-4 xl:flex" aria-label={`${completed} of ${LEVELS.length} lessons complete`}>
            {CHAPTERS.map((c) => {
              const inChapter = levelsIn(c.number);
              const done = inChapter.filter((l) => progress[l.id]?.completed).length;
              const gold = inChapter.filter((l) => progress[l.id]?.gold).length;
              const active = c.number === chapter.number;
              return (
                <div key={c.number} className="flex w-16 flex-col gap-1" title={`${c.subject}: ${done}/${inChapter.length} complete · ${gold} gold`}>
                  <div className="hud-label flex items-baseline justify-between text-[10px]">
                    <span className={active ? "text-gold-300" : "text-ink-500"}>{c.subject}</span>
                    <span className={active ? "text-ink-300" : "text-ink-600"}>
                      {done}/{inChapter.length}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full rounded-full transition-[width] ${active ? "bg-linear-to-r from-jade-500 to-gold-400" : "bg-ink-500"}`}
                      style={{ width: `${(done / inChapter.length) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <span className="hud-label text-[12px] text-ink-300">
            {completed}/{LEVELS.length}
          </span>
          <button
            onClick={(e) => {
              const next = sound.toggleMute();
              setMuted(next);
              if (!next) sound.click();
              if (e.detail > 0) e.currentTarget.blur();
            }}
            className="btn btn-ghost btn-sm"
            title={muted ? "Unmute sound" : "Mute sound"}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
          >
            {muted ? <IconMute size={15} /> : <IconSound size={15} />}
          </button>
          <button
            onClick={(e) => {
              setMapOpen(false);
              setSiteOpen(true);
              if (e.detail > 0) e.currentTarget.blur();
            }}
            className="btn btn-ghost btn-sm"
            title="See the website you're building"
          >
            <IconSite size={15} /> My site <span className="keycap">B</span>
          </button>
          <button
            onClick={(e) => {
              setSiteOpen(false);
              setMapOpen(true);
              if (e.detail > 0) e.currentTarget.blur();
            }}
            className="btn btn-ghost btn-sm"
          >
            <IconMap size={15} /> Map <span className="keycap">M</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex h-[62vh] min-h-105 min-w-0 p-3 lg:h-auto lg:flex-[1.65]">
          <div
            ref={viewportRef}
            data-world
            tabIndex={-1}
            aria-label="Game world. A and D or the arrow keys move, Space jumps. Right-drag to look around, scroll to zoom."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative h-full w-full overflow-hidden bg-ink-950 outline-none transition-shadow ${
              !typing && phase === "playing"
                ? "shadow-[0_0_0_1px_rgba(63,224,200,0.55),0_0_30px_-6px_rgba(63,224,200,0.3)]"
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
            <Hud typing={typing} />
            {!flatten && phase === "playing" && <Inspector />}

            {coarse && phase === "playing" && !flatten && (
              <div className="pointer-events-none absolute inset-x-3 bottom-14 z-10 flex justify-between">
                <div className="flex gap-2">
                  <TouchButton label="Move left" input="left">
                    ◀
                  </TouchButton>
                  <TouchButton label="Move right" input="right">
                    ▶
                  </TouchButton>
                </div>
                <TouchButton label="Jump" input="jump">
                  ▲
                </TouchButton>
              </div>
            )}

            {hydrated && phase === "intro" && <IntroOverlay />}
            {phase === "debrief" && <DebriefOverlay />}
            {phase === "chapter-complete" && <ChapterCompleteOverlay onOpenMap={() => setMapOpen(true)} />}
            {mapOpen && <LevelMap onClose={() => setMapOpen(false)} />}
            {siteOpen && <SiteOverlay currentId={LEVELS[levelIndex].id} onClose={() => setSiteOpen(false)} />}
          </div>
        </div>

        <div className="min-h-80 flex-1 border-t border-gold-600/25 lg:min-h-0 lg:min-w-100 lg:max-w-150 lg:border-l lg:border-t-0">
          <CodePanel />
        </div>
      </div>
    </div>
  );
}
