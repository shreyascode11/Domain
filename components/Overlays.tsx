"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLevelStore, useProgressStore, type Change } from "@/lib/store";
import { CHAPTERS, LEVELS, chapterOf, levelsIn } from "@/lib/levels";
import { Code } from "./Code";
import { DomFace, Seal } from "./Emblems";
import { IconArrow, IconCheck, IconSite, IconX } from "./Icons";
import { WorldMap } from "./WorldMap";
import { SiteGrowth } from "./SiteBuild";
import { SITE_NAME, SITE_STEPS } from "@/lib/site";

const FILE_LABEL = { html: "HTML", css: "CSS", js: "JavaScript" } as const;

function Dialog({ label, children, width = "max-w-xl" }: { label: string; children: ReactNode; width?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);
  return (
    <div className="absolute inset-0 z-20 flex overflow-y-auto bg-ink-950/75 p-4 backdrop-blur-[3px]">
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

/** The path through the four subjects, with the current one lit. */
function SubjectTrail({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Course path">
      {CHAPTERS.map((c, i) => (
        <li key={c.number} className="flex items-center gap-1.5">
          {i > 0 && <span className={`h-px w-5 ${c.number <= current ? "bg-ember-700" : "bg-[#8a6a3a]/40"}`} />}
          <span
            className={`hud-label rounded-sm border px-2 py-0.5 text-[11px] ${
              c.number === current ? "border-ember-700 bg-ember-700 text-parchment-100" : c.number < current ? "border-ember-700/60 text-[#6b2f0a]" : "border-[#8a6a3a]/40 text-[#8a6a3a]"
            }`}
          >
            {c.subject}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function IntroOverlay() {
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const start = useLevelStore((s) => s.startLevel);
  const setTab = useLevelStore((s) => s.setSidePanelTab);
  const level = LEVELS[levelIndex];
  const chapter = chapterOf(level);
  const seen = useProgressStore((s) => s.seenChapterIntro[chapter.number]);
  const markSeen = useProgressStore((s) => s.markChapterIntroSeen);
  const [fableRead, setFableRead] = useState(false);
  const showFable = level.number === 1 && !seen && !fableRead;

  if (showFable) {
    return (
      <Dialog label={`Chapter ${chapter.number}: ${chapter.title}`} width="max-w-2xl">
        <div className="parchment rounded-sm px-8 py-6">
          <SubjectTrail current={chapter.number} />
          <div className="mt-4 text-center">
            <div className="hud-label text-[11px] text-parchment-700">
              Chapter {chapter.number} · {chapter.subject}
            </div>
            <h2 className="mt-1 font-display text-[26px] font-bold text-[#3b2a10]">{chapter.title}</h2>
            <div className="mx-auto mt-2 h-px w-40 bg-linear-to-r from-transparent via-[#8a6a3a] to-transparent" />
          </div>
          <div className="mt-3 space-y-2.5 font-serif text-[15.5px] leading-relaxed text-[#3b2a10]">
            {chapter.fable.map((p, i) => (
              <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-display first-letter:text-[42px] first-letter:leading-[0.8] first-letter:text-ember-700" : ""}>
                {p}
              </p>
            ))}
          </div>
          <p className="mt-4 border-t border-[#8a6a3a]/40 pt-3 text-center font-serif text-[15.5px] italic text-[#6b2f0a]">{chapter.moral}</p>
          <div className="mt-3 rounded-sm border border-[#8a6a3a]/40 bg-[#fff8e6]/40 px-4 py-2.5 text-[14px] text-[#3b2a10]">
            <span className="hud-label text-[11px] text-ember-700">By the end of this chapter you can</span>
            <p>{chapter.outcome}</p>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              data-autofocus
              className="btn btn-gold"
              onClick={() => {
                markSeen(chapter.number);
                setFableRead(true);
              }}
            >
              Begin the chapter <IconArrow size={15} />
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog label={`Lesson ${level.number}: ${level.title}`}>
      <div className="panel px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>
              {chapter.subject} · Lesson {level.number} of {levelsIn(chapter.number).length} · <span className="font-mono normal-case tracking-normal text-teal-300">{level.concept}</span>
            </Eyebrow>
            <h2 className="title-inscription mt-1 text-3xl font-bold">{level.title}</h2>
          </div>
          <div className="hidden shrink-0 sm:block">
            <DomFace size={56} />
          </div>
        </div>
        <div className="rule-ornament my-4" />
        <div className="grid gap-3">
          <div className="border-l-2 border-gold-400 bg-gold-400/5 px-4 py-2.5">
            <div className="hud-label text-[11px] text-gold-300">You will learn</div>
            <p className="mt-0.5 text-[15px] text-ink-100">
              <Code text={level.learn} />
            </p>
          </div>
          <p className="text-[15px] leading-relaxed text-ink-200">
            <Code text={level.lesson[0]} />
          </p>
          {SITE_STEPS[level.id] && (
            <div className="flex items-center gap-3 rounded-md border border-jade-400/30 bg-jade-400/5 px-4 py-2.5">
              <IconSite size={22} className="shrink-0 text-jade-400" />
              <div>
                <div className="hud-label text-[11px] text-jade-400">This lesson builds on {SITE_NAME}</div>
                <p className="text-[15px] text-ink-100">
                  <b>+ {SITE_STEPS[level.id].label}</b> <span className="text-ink-300">— {SITE_STEPS[level.id].detail}</span>
                </p>
              </div>
            </div>
          )}
          <div className="border-l-2 border-teal-400 bg-teal-400/5 px-4 py-2.5">
            <div className="hud-label text-[11px] text-teal-300">Your task</div>
            <p className="mt-0.5 text-[15px] text-ink-100">
              <Code text={level.objective} />
            </p>
          </div>
        </div>
        <ol className="mt-4 grid gap-1.5 text-[13.5px] text-ink-300 sm:grid-cols-3">
          {[
            ["Read", "The Learn tab explains the idea with an example."],
            ["Edit", `Change the ${FILE_LABEL[level.edit]} — the world rebuilds from it.`],
            ["Walk", "Reach the gold ledge to finish."],
          ].map(([k, t], i) => (
            <li key={k} className="panel-soft px-3 py-2">
              <div className="hud-label text-[11px] text-gold-400">
                {i + 1} · {k}
              </div>
              {t}
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button data-autofocus className="btn btn-gold" onClick={start}>
            Start the lesson <IconArrow size={15} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              start();
              setTab("learn");
            }}
          >
            Read the full lesson first
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function ChangeRow({ c }: { c: Change }) {
  if (c.kind === "css") {
    return (
      <li>
        <span className="text-gold-300">{c.selector}</span> <span className="text-teal-300">{c.prop}</span>
        <span className="text-ink-500">: </span>
        {c.before !== null && <span className="text-blood-400 line-through decoration-2">{c.before}</span>}
        {c.before !== null && c.after !== null && <span className="text-ink-500"> → </span>}
        {c.after !== null ? <span className="text-jade-400">{c.after}</span> : <span className="text-ink-500"> removed</span>}
      </li>
    );
  }
  return (
    <li className={`whitespace-pre-wrap break-all ${c.op === "added" ? "text-jade-400" : "text-blood-400 line-through decoration-1"}`}>
      <span className="select-none text-ink-500">{c.op === "added" ? "+ " : "− "}</span>
      {c.text}
    </li>
  );
}

function Quiz() {
  const level = useLevelStore((s) => LEVELS[s.levelIndex]);
  const [picked, setPicked] = useState<number | null>(null);
  const { quiz } = level;
  const right = picked === quiz.answer;

  return (
    <section className="mt-5 border border-teal-400/30 bg-teal-400/5 p-4">
      <Eyebrow>Check your understanding</Eyebrow>
      <p className="mt-1 text-[15px] text-ink-100">
        <Code text={quiz.question} />
      </p>
      <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
        {quiz.options.map((o, i) => {
          const chosen = picked === i;
          const reveal = picked !== null && i === quiz.answer;
          return (
            <button
              key={i}
              onClick={() => setPicked(i)}
              disabled={picked !== null && right}
              className={`flex items-center gap-2 border px-3 py-2 text-left font-mono text-[13px] transition-colors ${
                reveal && right
                  ? "border-jade-400 bg-jade-600/20 text-jade-400"
                  : chosen
                    ? "border-blood-400 bg-blood-600/15 text-blood-400"
                    : "border-ink-600 bg-ink-900 text-ink-100 hover:border-teal-400"
              }`}
            >
              <span className="hud-label w-4 text-[11px] text-ink-400">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1 break-all">{o}</span>
              {reveal && right && <IconCheck size={15} />}
              {chosen && !right && <IconX size={15} />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p role="status" className={`mt-2.5 text-[14px] leading-relaxed ${right ? "text-jade-400" : "text-ember-300"}`}>
          {right ? "Correct. " : "Not quite — try another. "}
          {right && <Code text={quiz.explain} />}
        </p>
      )}
    </section>
  );
}

export function DebriefOverlay() {
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const result = useLevelStore((s) => s.result);
  const next = useLevelStore((s) => s.nextLevel);
  const replay = useLevelStore((s) => s.resetLevel);
  const level = LEVELS[levelIndex];
  if (!result) return null;
  const following = LEVELS[levelIndex + 1];
  const endsChapter = !following || following.chapter !== level.chapter;

  return (
    <Dialog label="Lesson complete" width="max-w-3xl">
      <div className="panel px-7 py-6">
        <div className="flex items-center gap-5">
          <div className="seal-in shrink-0">
            <Seal size={84} earned={result.gold} />
          </div>
          <div>
            <div className="hud-label text-[12px] text-jade-400">Lesson complete</div>
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

        <SiteGrowth levelId={level.id} />

        <div className="rule-ornament my-5" />

        <section>
          <Eyebrow>What you changed in the {FILE_LABEL[level.edit]}</Eyebrow>
          {result.changes.length === 0 ? (
            <p className="mt-1 text-sm text-ink-300">Nothing — you found a way across without changing the code.</p>
          ) : (
            <ul className="mt-2 space-y-1 border border-ink-600 bg-ink-950/80 p-3 font-mono text-[13px]">
              {result.changes.map((c, i) => (
                <ChangeRow key={i} c={c} />
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
            <Eyebrow>The rule to remember</Eyebrow>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-100">
              <Code text={level.debrief.rule} />
            </p>
          </div>
          <div className="panel-soft p-3">
            <Eyebrow>On real websites</Eyebrow>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-100">
              <Code text={level.debrief.seenIn} />
            </p>
          </div>
        </section>

        <Quiz key={level.id} />

        <blockquote className="mt-5 text-center font-serif text-[17px] italic text-gold-200/90">{level.debrief.fableLine}</blockquote>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button className="btn btn-ghost btn-sm" onClick={replay}>
            Replay lesson
          </button>
          <button data-autofocus className="btn btn-gold" onClick={next}>
            {endsChapter ? "Finish the chapter" : `Next: ${following.title}`} <IconArrow size={15} />
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function ChapterCompleteOverlay({ onOpenMap }: { onOpenMap: () => void }) {
  const progress = useProgressStore((s) => s.levels);
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const load = useLevelStore((s) => s.loadLevel);
  const chapter = chapterOf(LEVELS[levelIndex]);
  const levels = levelsIn(chapter.number);
  const golds = levels.filter((l) => progress[l.id]?.gold).length;
  const nextChapter = CHAPTERS.find((c) => c.number === chapter.number + 1);

  return (
    <Dialog label="Chapter complete" width="max-w-2xl">
      <div className="panel px-7 py-6 text-center">
        <Eyebrow>
          Chapter {chapter.number} · {chapter.subject} complete
        </Eyebrow>
        <h2 className="title-inscription mt-1 text-4xl font-black">{chapter.title}</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {levels.map((l) => (
            <div key={l.id} className="flex flex-col items-center gap-1">
              <Seal size={52} earned={!!progress[l.id]?.gold} />
              <span className="font-mono text-[11px] text-teal-300">{l.concept}</span>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-200">
          <span className="hud-label block text-[11px] text-gold-400">You can now</span>
          {chapter.outcome}
        </p>
        <p className="mt-2 text-[13px] text-ink-400">
          {golds === levels.length
            ? "Every seal in this chapter earned."
            : `${golds} of ${levels.length} seals. Replay a lesson without the answer hint to earn the rest.`}
        </p>
        <div className="rule-ornament mx-auto my-5 max-w-sm" />
        <p className="font-serif text-[17px] italic text-gold-200">{chapter.moral}</p>

        {nextChapter ? (
          <div className="panel-soft mx-auto mt-5 max-w-md px-4 py-3 text-left">
            <div className="hud-label text-[11px] text-teal-300">Up next · Chapter {nextChapter.number} · {nextChapter.subject}</div>
            <div className="font-display text-[17px] font-bold text-gold-200">{nextChapter.title}</div>
            <p className="mt-0.5 text-[13.5px] text-ink-300">{nextChapter.outcome}</p>
          </div>
        ) : (
          <p className="mx-auto mt-5 max-w-md text-[15px] text-ink-200">
            That&apos;s the whole course: HTML to build the page, CSS to shape it, flexbox to arrange it and JavaScript to make it change. Open any site, right-click, choose Inspect — you can read it now.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-ghost">
            Title screen
          </Link>
          <button className="btn btn-ghost" onClick={onOpenMap}>
            Open the map
          </button>
          {nextChapter && (
            <button data-autofocus className="btn btn-gold" onClick={() => load(levelIndex + 1)}>
              Start {nextChapter.subject} <IconArrow size={15} />
            </button>
          )}
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
    <Dialog label="World map" width="max-w-4xl">
      <div className="panel p-4">
        <div className="mb-3 flex items-center justify-between gap-4 px-1">
          <div>
            <Eyebrow>World map</Eyebrow>
            <div className="text-[13px] text-ink-300">HTML, then CSS, then flexbox, then JavaScript. Scroll, drag, or use the arrows to explore.</div>
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
