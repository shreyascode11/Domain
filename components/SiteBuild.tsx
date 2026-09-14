"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHAPTERS, LEVELS, levelsIn } from "@/lib/levels";
import { SITE_NAME, SITE_STEPS } from "@/lib/site";
import { useProgressStore } from "@/lib/store";
import { SitePreview } from "./SitePreview";

const ALL_IDS = LEVELS.map((l) => l.id);

/** Ids of every finished lesson, in course order. */
export function useDoneIds() {
  const progress = useProgressStore((s) => s.levels);
  return useMemo(() => ALL_IDS.filter((id) => progress[id]?.completed), [progress]);
}

const CHAPTER_ROLE: Record<string, string> = {
  HTML: "adds the content",
  CSS: "styles it",
  Flexbox: "lays it out",
  JavaScript: "makes it respond",
};

/** "Your website grew": a before → after reveal of the piece this lesson added. */
export function SiteGrowth({ levelId }: { levelId: string }) {
  const done = useDoneIds();
  const step = SITE_STEPS[levelId];
  const before = useMemo(() => done.filter((id) => id !== levelId), [done, levelId]);
  const after = useMemo(() => (done.includes(levelId) ? done : [...done, levelId]), [done, levelId]);
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowAfter(true), 1100);
    return () => clearTimeout(t);
  }, [levelId]);

  if (!step) return null;
  return (
    <section className="site-growth">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="hud-label text-[11px] text-jade-400">Your website grew</div>
          <div className="font-display text-[19px] font-bold text-gold-200">+ {step.label}</div>
          <p className="text-[13.5px] text-ink-300">{step.detail}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full border border-white/15 text-[12px]" role="group" aria-label="Compare">
            <button type="button" onClick={() => setShowAfter(false)} className={`px-3 py-1 ${!showAfter ? "bg-white/15 text-ink-100" : "text-ink-400"}`} aria-pressed={!showAfter}>
              Before
            </button>
            <button type="button" onClick={() => setShowAfter(true)} className={`px-3 py-1 ${showAfter ? "bg-jade-600/60 text-white" : "text-ink-400"}`} aria-pressed={showAfter}>
              After
            </button>
          </div>
        </div>
      </div>
      <div className={`mt-3 ${showAfter ? "site-reveal" : ""}`} key={showAfter ? "after" : "before"}>
        <SitePreview done={showAfter ? after : before} spotlight={showAfter ? levelId : undefined} height={250} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
          <div className="h-full rounded-full bg-linear-to-r from-jade-500 via-gold-400 to-ember-400 transition-[width] duration-700" style={{ width: `${(after.length / ALL_IDS.length) * 100}%` }} />
        </div>
        <span className="hud-label text-[11px] text-ink-300">
          {SITE_NAME} · {after.length}/{ALL_IDS.length} pieces built
        </span>
      </div>
    </section>
  );
}

/** The whole site so far, plus a checklist of every piece still to build. */
export function SiteOverlay({ onClose, currentId }: { onClose: () => void; currentId?: string }) {
  const done = useDoneIds();
  const [peek, setPeek] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-[3px]">
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="Your website" className="rise-in m-auto w-full max-w-5xl">
        <div className="panel p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="hud-label text-[11px] text-gold-400">The website you&apos;re building</div>
              <h2 className="title-inscription text-3xl font-bold">{SITE_NAME}</h2>
              <p className="text-[13.5px] text-ink-300">
                Every lesson adds a piece: HTML adds the content, CSS styles it, flexbox lays it out, JavaScript makes it respond.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-ghost btn-sm" aria-pressed={peek} onClick={() => setPeek((p) => !p)}>
                {peek ? "Back to my site" : "Peek at the finished site"}
              </button>
              <button data-autofocus onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
                Close <span className="keycap">Esc</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <SitePreview done={peek ? ALL_IDS : done} height={440} />
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full rounded-full bg-linear-to-r from-jade-500 via-gold-400 to-ember-400" style={{ width: `${(done.length / ALL_IDS.length) * 100}%` }} />
                </div>
                <span className="hud-label text-[12px] text-ink-200">
                  {done.length}/{ALL_IDS.length} built
                </span>
              </div>
            </div>

            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
              {CHAPTERS.map((c) => {
                const lessons = levelsIn(c.number);
                const built = lessons.filter((l) => done.includes(l.id)).length;
                return (
                  <div key={c.number}>
                    <div className="hud-label mb-1.5 flex justify-between text-[11px]">
                      <span className="text-gold-300">
                        {c.subject} · {CHAPTER_ROLE[c.subject]}
                      </span>
                      <span className="text-ink-400">
                        {built}/{lessons.length}
                      </span>
                    </div>
                    <ol className="space-y-1">
                      {lessons.map((l) => {
                        const isDone = done.includes(l.id);
                        const isNow = l.id === currentId;
                        return (
                          <li
                            key={l.id}
                            className={`flex items-center gap-2 rounded-md px-2 py-1 text-[13px] ${isNow ? "bg-teal-400/10 ring-1 ring-teal-400/40" : ""}`}
                          >
                            <span
                              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                                isDone ? "bg-jade-500 text-ink-950" : "border border-ink-500 text-ink-500"
                              }`}
                            >
                              {isDone ? "✓" : l.number}
                            </span>
                            <span className={isDone ? "text-ink-100" : "text-ink-400"}>{SITE_STEPS[l.id]?.label ?? l.title}</span>
                            {isNow && <span className="hud-label ml-auto text-[10px] text-teal-300">This lesson</span>}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The landing-page teaser: your site so far, or a peek at the finished one. */
export function SiteShowcase({ hydrated }: { hydrated: boolean }) {
  const done = useDoneIds();
  const [finished, setFinished] = useState(false);
  const showingFinished = finished || !hydrated || done.length === 0;
  const ids = showingFinished ? ALL_IDS : done;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.5fr]">
      <div className="text-left">
        <div className="hud-label text-[12px] tracking-[0.3em] text-[#ffc9e4]">Build a real website as you play</div>
        <h2 className="mt-2 font-display text-3xl font-bold text-gold-200">{SITE_NAME}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-200">
          Every lesson you finish adds a piece to a real website. It starts as a blank page. HTML gives it content, CSS gives it style, flexbox arranges it, and JavaScript brings it to life.
        </p>
        <ul className="mt-4 space-y-2 text-[14px] text-ink-200">
          {CHAPTERS.map((c) => (
            <li key={c.number} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ffc9e4]" />
              <b className="text-ink-100">{c.subject}</b> {CHAPTER_ROLE[c.subject]} · {levelsIn(c.number).length} pieces
            </li>
          ))}
        </ul>
        {hydrated && done.length > 0 && (
          <div className="mt-5 inline-flex overflow-hidden rounded-full border border-white/15 text-[13px]" role="group" aria-label="Which version">
            <button type="button" onClick={() => setFinished(false)} className={`px-4 py-1.5 ${!finished ? "bg-white/15 text-white" : "text-ink-300"}`} aria-pressed={!finished}>
              My site · {done.length}/{ALL_IDS.length}
            </button>
            <button type="button" onClick={() => setFinished(true)} className={`px-4 py-1.5 ${finished ? "bg-white/15 text-white" : "text-ink-300"}`} aria-pressed={finished}>
              Finished site
            </button>
          </div>
        )}
      </div>
      <div className="relative">
        <SitePreview done={ids} height={380} />
        {showingFinished && (
          <span className="hud-label absolute -top-3 right-4 rounded-full bg-linear-to-r from-[#ffe7c2] to-[#e0a0c8] px-3 py-1 text-[11px] text-[#3b1f4a] shadow-lg">
            What you&apos;ll have built
          </span>
        )}
      </div>
    </div>
  );
}
