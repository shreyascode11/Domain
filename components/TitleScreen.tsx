"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { CHAPTERS, LEVELS, levelsIn } from "@/lib/levels";
import { firstIncompleteIndex, useProgressStore } from "@/lib/store";
import { DomFace, GuidePortrait } from "./Emblems";
import { IconArrow } from "./Icons";
import { DreamSky, PageStars } from "./DreamSky";
import { WorldMap } from "./WorldMap";
import { SiteShowcase } from "./SiteBuild";

const SUBJECT: Record<string, { chip: string; glow: string; bar: string }> = {
  HTML: { chip: "text-jade-400 border-jade-400/50", glow: "rgba(91,217,154,0.55)", bar: "from-[#5bd99a] to-[#9ff7ea]" },
  CSS: { chip: "text-gold-300 border-gold-400/50", glow: "rgba(238,208,138,0.55)", bar: "from-[#e0b85f] to-[#ffd3a1]" },
  Flexbox: { chip: "text-[#ffb3d4] border-[#ffb3d4]/50", glow: "rgba(255,160,210,0.55)", bar: "from-[#ff9f7a] to-[#f4a6cf]" },
  JavaScript: { chip: "text-teal-300 border-teal-400/50", glow: "rgba(125,243,225,0.55)", bar: "from-[#7df3e1] to-[#a89bff]" },
};

export function TitleScreen() {
  const progress = useProgressStore((s) => s.levels);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.resolve(useProgressStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);

  const completed = LEVELS.filter((l) => progress[l.id]?.completed).length;
  const started = hydrated && completed > 0;
  const next = firstIncompleteIndex(progress);

  return (
    <div className="dream-page relative min-h-screen overflow-hidden text-ink-100">
      <PageStars />

      <section className="relative flex min-h-[100svh] flex-col">
        <DreamSky />

        <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-4">
          <span className="hud-label text-[12px] text-[#d9ccff]/80">Learn to build the web by playing inside it</span>
          <Link href="/play" className="btn btn-ghost btn-sm">
            Play
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-28 text-center">
          <div className="float-y relative">
            <div className="absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd6f0]/25 blur-3xl" />
            <DomFace size={92} />
          </div>
          <div className="hud-label mt-4 text-[12px] tracking-[0.35em] text-[#ffd6ea]/90">A world dreamed out of web pages</div>
          <h1 className="title-inscription dream-title mt-2 font-display text-6xl font-black tracking-[0.2em] sm:text-8xl">DOMAIN</h1>
          <div className="rule-ornament mt-5 w-72" />
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#f1ecff] [text-shadow:0_2px_12px_rgba(20,10,50,0.8)]">
            Every level is a real web page raised into a floating world. Each one starts broken. Learn one idea, write the code that mends it, and walk across what you built — from your first HTML tag to your first line of JavaScript.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/play" className="btn btn-gold px-7! py-3! text-base! shadow-[0_0_40px_rgba(255,200,140,0.35)]">
              {started ? `Continue — ${LEVELS[next].title}` : "Start dreaming"} <IconArrow size={16} />
            </Link>
            <a href="#map" className="btn btn-ghost">
              View the map
            </a>
          </div>
          <p className="mt-3 text-[13px] text-[#e6dcff]/75">No experience needed. {LEVELS.length} short lessons, all open to explore.</p>
        </div>

        <a href="#course" className="dream-scroll-cue absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center" aria-label="Scroll to the course">
          <span className="hud-label block text-[11px] text-[#f3e6ff]/80">Drift down</span>
          <span className="mt-1 block text-xl text-[#f3e6ff]/80">⌄</span>
        </a>
      </section>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-20">
        <section id="course" className="w-full scroll-mt-6 pt-10 text-left" aria-labelledby="course-heading">
          <div className="mb-6 text-center">
            <h2 id="course-heading" className="hud-label text-[12px] tracking-[0.3em] text-[#ffc9e4]">
              Four islands, in order
            </h2>
            <p className="mt-2 font-display text-3xl font-bold text-gold-200">The course</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CHAPTERS.map((c) => {
              const lessons = levelsIn(c.number);
              const done = lessons.filter((l) => progress[l.id]?.completed).length;
              const look = SUBJECT[c.subject];
              return (
                <li key={c.number} className="dream-card dream-card-hover flex flex-col overflow-hidden px-5 pb-5 pt-6" style={{ "--glow": look.glow } as CSSProperties}>
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${look.bar}`} />
                  <div className="flex items-center justify-between">
                    <span className={`hud-label rounded-full border px-2.5 py-0.5 text-[12px] ${look.chip}`}>
                      {c.number} · {c.subject}
                    </span>
                    <span className="hud-label text-[11px] text-ink-300">
                      {hydrated ? `${done}/${lessons.length}` : `${lessons.length} lessons`}
                    </span>
                  </div>
                  <div className="mt-3 font-display text-[17px] font-bold leading-snug text-gold-200">{c.title}</div>
                  <p className="mt-2 flex-1 text-[14px] leading-snug text-ink-200">{c.outcome}</p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {lessons.slice(0, 6).map((l) => (
                      <code key={l.id} className="code-chip text-[11px]">
                        {l.concept}
                      </code>
                    ))}
                    {lessons.length > 6 && <span className="hud-label self-center px-1 text-[11px] text-ink-400">+{lessons.length - 6} more</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="dream-card mt-12 w-full px-6 py-8 sm:px-8" aria-label="The website you build">
          <SiteShowcase hydrated={hydrated} />
        </section>

        <section className="mt-12 grid w-full gap-4 text-left sm:grid-cols-3">
          {[
            { k: "Learn", n: "1", t: "Each lesson explains one idea in plain words, with an annotated example and step-by-step instructions." },
            { k: "Write code", n: "2", t: "Edit real HTML, CSS and JavaScript. The world rebuilds from your code — a half-typed line never breaks it." },
            { k: "Check it", n: "3", t: "Walk across what you built, inspect any block like DevTools, then answer a quick question to lock it in." },
          ].map((c) => (
            <div key={c.k} className="dream-card flex gap-4 px-5 py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ffe7c2] to-[#e0a0c8] font-display text-[15px] font-black text-[#3b1f4a]">
                {c.n}
              </span>
              <div>
                <div className="hud-label text-[12px] text-[#ffd3ea]">{c.k}</div>
                <p className="mt-1 text-[15px] leading-snug text-ink-200">{c.t}</p>
              </div>
            </div>
          ))}
        </section>

        <section id="map" className="mt-14 w-full scroll-mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 text-left">
            <div>
              <h2 className="font-display text-3xl font-bold text-gold-200">The map</h2>
              <p className="mt-1 text-[14px] text-ink-300">Scroll, drag, or use the arrows to explore. Every lesson is open.</p>
            </div>
            <div className="hud-label text-[13px] text-ink-300">{hydrated ? `${completed} of ${LEVELS.length} lessons complete` : ""}</div>
          </div>
          <div className="dream-card p-3">
            <WorldMap currentIndex={hydrated ? next : undefined} />
          </div>
        </section>

        <section className="dream-card mt-14 flex max-w-2xl items-start gap-4 px-6 py-5 text-left">
          <GuidePortrait size={56} />
          <div>
            <div className="hud-label text-[12px] text-[#ffd3ea]">The Old Ant</div>
            <p className="mt-1 font-serif text-[18px] italic leading-relaxed text-ink-100">
              &ldquo;Nobody learns to build by watching. Write one line, see what it does, then write the next.&rdquo;
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
