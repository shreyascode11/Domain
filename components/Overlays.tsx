"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useLevelStore, useProgressStore } from "@/lib/store";
import { CHAPTER_5, LEVELS } from "@/lib/levels";
import { Code } from "./Code";
import { DomFace, Seal } from "./Emblems";
import { WorldMap } from "./WorldMap";

function Dialog({ label, children, width = "max-w-xl" }: { label: string; children: ReactNode; width?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);
  return (
    <div className="absolute inset-0 z-20 flex overflow-y-auto bg-ink-950/70 p-4 backdrop-blur-[3px]">
      {/* m-auto centres the card when it fits and lets it scroll from the top when it doesn't. */}
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className={`rise-in m-auto w-full ${width}`}>
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="hud-label text-[11px] text-gold-400">{children}</div>;
}

export function IntroOverlay() {
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const start = useLevelStore((s) => s.startLevel);
  const seen = useProgressStore((s) => s.seenChapterIntro[CHAPTER_5.number]);
  const markSeen = useProgressStore((s) => s.markChapterIntroSeen);
  const level = LEVELS[levelIndex];
  const showFable = level.number === 1 && !seen;

  const begin = () => {
    if (showFable) markSeen(CHAPTER_5.number);
    start();
  };

  if (showFable) {
    return (
      <Dialog label={`A fable: ${CHAPTER_5.title}`} width="max-w-2xl">
        <div className="parchment rounded-[4px] px-8 py-6">
          <div className="text-center">
            <div className="hud-label text-[11px] text-parchment-700">Chapter {CHAPTER_5.number} · A fable</div>
            <h2 className="mt-1 font-display text-[26px] font-bold text-[#3b2a10]">{CHAPTER_5.title}</h2>
            <div className="mx-auto mt-2 h-px w-40 bg-linear-to-r from-transparent via-[#8a6a3a] to-transparent" />
          </div>
          <div className="mt-3 space-y-2.5 font-serif text-[15.5px] leading-relaxed text-[#3b2a10]">
            {CHAPTER_5.fable.map((p, i) => (
              <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-display first-letter:text-[42px] first-letter:leading-[0.8] first-letter:text-[#8a3d0b]" : ""}>
                {p}
              </p>
            ))}
          </div>
          <p className="mt-4 border-t border-[#8a6a3a]/40 pt-3 text-center font-serif text-[15.5px] italic text-[#6b2f0a]">
            {CHAPTER_5.moral}
          </p>
          <div className="mt-4 flex justify-center">
            <button data-autofocus className="btn btn-gold" onClick={begin}>
              Begin the chapter
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog label={`Level ${level.number}: ${level.title}`}>
      <div className="panel px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>
              Quest {level.number} of {LEVELS.length} · learning <span className="font-mono normal-case tracking-normal text-teal-300">{level.concept}</span>
            </Eyebrow>
            <h2 className="title-inscription mt-1 text-3xl font-bold">{level.title}</h2>
          </div>
          <div className="hidden shrink-0 sm:block">
            <DomFace size={56} />
          </div>
        </div>
        <div className="rule-ornament my-4" />
        <div className="space-y-2 text-[15px] leading-relaxed text-ink-200">
          {level.lesson.map((p, i) => (
            <p key={i}>
              <Code text={p} />
            </p>
          ))}
        </div>
        <div className="mt-5 border-l-2 border-teal-400 bg-teal-400/5 px-4 py-3">
          <div className="hud-label text-[11px] text-teal-300">Objective</div>
          <p className="mt-0.5 text-[15px] text-ink-100">
            <Code text={level.objective} />
          </p>
        </div>
        <p className="mt-3 text-[13px] text-ink-400">
          The world starts broken — look around first. The CSS panel is your only tool. Stuck? The Old Ant waits in the Lesson tab.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button data-autofocus className="btn btn-gold" onClick={start}>
            Start quest <span className="keycap">↵</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function DebriefOverlay() {
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const result = useLevelStore((s) => s.result);
  const next = useLevelStore((s) => s.nextLevel);
  const replay = useLevelStore((s) => s.resetLevel);
  const level = LEVELS[levelIndex];
  if (!result) return null;
  const isLast = levelIndex === LEVELS.length - 1;

  return (
    <Dialog label="Level complete" width="max-w-2xl">
      <div className="panel px-7 py-6">
        <div className="flex items-center gap-5">
          <div className="seal-in shrink-0">
            <Seal size={84} earned={result.gold} />
          </div>
          <div>
            <div className="hud-label text-[12px] text-jade-400">Quest complete</div>
            <h2 className="title-inscription text-3xl font-bold">{level.title}</h2>
            <div className="hud-label mt-1 text-[12px]">
              {result.gold ? (
                <span className="text-gold-300">Gold seal earned</span>
              ) : result.assisted ? (
                <span className="text-ink-300">Solved with the Old Ant&apos;s answer — no seal this time</span>
              ) : (
                <span className="text-ink-300">Solved — no seal this time</span>
              )}
            </div>
          </div>
        </div>

        <div className="rule-ornament my-5" />

        <section>
          <Eyebrow>What you changed</Eyebrow>
          {result.changes.length === 0 ? (
            <p className="mt-1 text-sm text-ink-300">Nothing in the CSS — you found a way across without it.</p>
          ) : (
            <ul className="mt-2 space-y-1 border border-ink-600 bg-ink-950/80 p-3 font-mono text-[13px]">
              {result.changes.map((c) => (
                <li key={`${c.selector}|${c.prop}`}>
                  <span className="text-gold-300">{c.selector}</span> <span className="text-teal-300">{c.prop}</span>
                  <span className="text-ink-500">: </span>
                  {c.before !== null && <span className="text-blood-400 line-through decoration-2">{c.before}</span>}
                  {c.before !== null && c.after !== null && <span className="text-ink-500"> → </span>}
                  {c.after !== null ? <span className="text-jade-400">{c.after}</span> : <span className="text-ink-500"> removed</span>}
                </li>
              ))}
            </ul>
          )}
          {result.note && (
            <p className="mt-2 text-[14px] text-ember-300">
              <Code text={result.note} />
            </p>
          )}
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="panel-soft p-3">
            <Eyebrow>The rule</Eyebrow>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-100">
              <Code text={level.debrief.rule} />
            </p>
          </div>
          <div className="panel-soft p-3">
            <Eyebrow>Where you&apos;ll see it</Eyebrow>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-100">
              <Code text={level.debrief.seenIn} />
            </p>
          </div>
        </section>

        <blockquote className="mt-5 text-center font-serif text-[17px] italic text-gold-200/90">{level.debrief.fableLine}</blockquote>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button className="btn btn-ghost btn-sm" onClick={replay}>
            Replay quest
          </button>
          <button data-autofocus className="btn btn-gold" onClick={next}>
            {isLast ? "Finish the chapter" : `Next: ${LEVELS[levelIndex + 1].title}`} →
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function ChapterCompleteOverlay({ onOpenMap }: { onOpenMap: () => void }) {
  const progress = useProgressStore((s) => s.levels);
  const golds = LEVELS.filter((l) => progress[l.id]?.gold).length;

  return (
    <Dialog label="Chapter complete" width="max-w-2xl">
      <div className="panel px-7 py-6 text-center">
        <Eyebrow>Chapter {CHAPTER_5.number} complete</Eyebrow>
        <h2 className="title-inscription mt-1 text-4xl font-black">{CHAPTER_5.title}</h2>
        <div className="mt-4 flex justify-center gap-3">
          {LEVELS.map((l) => (
            <div key={l.id} className="flex flex-col items-center gap-1">
              <Seal size={52} earned={!!progress[l.id]?.gold} />
              <span className="font-mono text-[11px] text-teal-300">{l.concept}</span>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-200">
          You can space a row with <code className="code-chip">gap</code>, spread it with{" "}
          <code className="code-chip">justify-content</code>, line it up with <code className="code-chip">align-items</code>, and turn it with{" "}
          <code className="code-chip">flex-direction</code>.
        </p>
        <p className="mt-2 text-[13px] text-ink-400">
          {golds === LEVELS.length
            ? "Every seal earned."
            : `${golds} of ${LEVELS.length} seals. Replay a quest and solve it with the property it teaches, without the answer hint, to earn the rest.`}
        </p>
        <div className="rule-ornament mx-auto my-5 max-w-sm" />
        <p className="font-serif text-[17px] italic text-gold-200">{CHAPTER_5.moral}</p>
        <p className="mt-4 text-[13px] text-ink-300">
          Try it on the real web: right-click any site&apos;s navigation bar, choose Inspect, and look for <code className="code-chip">display: flex</code>.
        </p>
        <p className="hud-label mt-2 text-[11px] text-ink-500">Chapter 6 — The Architect&apos;s Blueprint (CSS Grid) is not charted yet</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-ghost">
            Title screen
          </Link>
          <button data-autofocus className="btn btn-gold" onClick={onOpenMap}>
            Open the map
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function LevelMap({ onClose }: { onClose: () => void }) {
  const current = useLevelStore((s) => s.levelIndex);
  const load = useLevelStore((s) => s.loadLevel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Dialog label="World map" width="max-w-3xl">
      <div className="panel p-4">
        <div className="mb-3 flex items-center justify-between gap-4 px-1">
          <div>
            <Eyebrow>World map</Eyebrow>
            <div className="text-[13px] text-ink-300">Choose a quest. Each one unlocks the next.</div>
          </div>
          <button data-autofocus onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close map">
            Close <span className="keycap">Esc</span>
          </button>
        </div>
        <WorldMap
          currentIndex={current}
          onPick={(i) => {
            load(i);
            onClose();
          }}
        />
      </div>
    </Dialog>
  );
}
