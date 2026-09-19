"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CHAPTERS, LEVELS, levelsIn } from "@/lib/levels";
import { firstIncompleteIndex, useProgressStore } from "@/lib/store";
import { DomFace, GuidePortrait } from "./Emblems";
import { IconArrow, IconCube, IconLayers, IconSite } from "./Icons";
import { LandingDemo } from "./LandingDemo";
import { SiteShowcase } from "./SiteBuild";
import { WorldMap } from "./WorldMap";

const SUBJECT_RAIL: Record<string, string> = {
  HTML: "#5bd99a",
  CSS: "#e0b85f",
  Flexbox: "#ff9f43",
  JavaScript: "#7df3e1",
};

/** A section wrapped like an element under inspection: dashed frame, selector tag. */
function Framed({ tag, children, id }: { tag: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="framed scroll-mt-8">
      <span className="framed-tag">{tag}</span>
      {children}
    </section>
  );
}

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
    <div className="blueprint relative min-h-screen text-ink-100">
      <div className="mx-auto w-full max-w-295 px-5 sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-ink-700/70 py-5">
          <Link href="/" className="flex items-center gap-3">
            <DomFace size={34} />
            <span className="title-inscription font-display text-xl font-black tracking-[0.24em]">DOMAIN</span>
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#course" className="hud-label hidden px-3 text-[12px] text-ink-300 hover:text-gold-200 sm:inline">
              Course
            </a>
            <a href="#build" className="hud-label hidden px-3 text-[12px] text-ink-300 hover:text-gold-200 sm:inline">
              The website
            </a>
            <a href="#map" className="hud-label hidden px-3 text-[12px] text-ink-300 hover:text-gold-200 sm:inline">
              Map
            </a>
            <Link href="/play" className="btn btn-ghost btn-sm">
              Play
            </Link>
          </nav>
        </header>

        {/* ——— Hero: the claim on the left, the proof on the right ——— */}
        <div className="grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-20">
          <div className="min-w-0">
            <div className="measure-line hud-label text-[11px] text-teal-300">A game made of real web pages</div>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.4rem)] font-black leading-[1.02] tracking-[-0.01em] text-ink-100">
              Learn to build the web
              <span className="block text-gold-300">by walking through it.</span>
            </h1>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink-200">
              Every level is a live HTML document. The browser lays it out, and each element becomes a block you can stand on. The page starts broken — fix the code, and the ground rearranges under your feet.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/play" className="btn btn-gold px-7! py-3! text-base!">
                {started ? `Continue — ${LEVELS[next].title}` : "Start with your first element"} <IconArrow size={16} />
              </Link>
              <a href="#course" className="btn btn-ghost">
                See the 120 lessons
              </a>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-sm border border-ink-700 bg-ink-700">
              {[
                ["120", "lessons"],
                ["4", "chapters"],
                ["1", "real website"],
              ].map(([n, label]) => (
                <div key={label} className="bg-ink-900/80 px-4 py-3">
                  <dt className="font-display text-2xl font-bold text-gold-200">{n}</dt>
                  <dd className="hud-label text-[11px] text-ink-400">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="min-w-0">
            <LandingDemo />
          </div>
        </div>

        {/* ——— What makes it different ——— */}
        <Framed tag="<section class=&quot;how&quot;>">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <IconLayers size={18} />,
                title: "The browser is the rules engine",
                body: "Nothing about CSS is simulated. The page is measured with getBoundingClientRect, so if the browser renders it, the world matches it — flex, grid, position, the lot.",
              },
              {
                icon: <IconCube size={18} />,
                title: "Broken until your code says otherwise",
                body: "A bridge too short, a gate that won't open, stairs in the wrong order. The fix is the lesson, and the world tells you the moment the way is open.",
              },
              {
                icon: <IconSite size={18} />,
                title: "You leave with a real website",
                body: "Every lesson adds a piece to the Anthill Bakery: content from HTML, style from CSS, layout from flexbox, life from JavaScript.",
              },
            ].map((card) => (
              <article key={card.title} className="panel-soft flex flex-col gap-2 p-5">
                <span className="text-teal-300">{card.icon}</span>
                <h3 className="font-display text-[17px] font-bold text-gold-200">{card.title}</h3>
                <p className="text-[14.5px] leading-snug text-ink-300">{card.body}</p>
              </article>
            ))}
          </div>
        </Framed>

        {/* ——— The course ——— */}
        <Framed tag="<ol class=&quot;course&quot;>" id="course">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="hud-label text-[11px] text-teal-300">The course, in order</div>
              <h2 className="font-display text-3xl font-bold text-gold-200">Four chapters, 120 lessons</h2>
            </div>
            <p className="max-w-[42ch] text-[14px] text-ink-300">
              Each lesson: one idea, an annotated example, five hints when you want them, and a level you can only cross once the code is right.
            </p>
          </div>

          <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CHAPTERS.map((c) => {
              const lessons = levelsIn(c.number);
              const done = lessons.filter((l) => progress[l.id]?.completed).length;
              return (
                <li key={c.number} className="chapter-card" style={{ ["--rail" as string]: SUBJECT_RAIL[c.subject] }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="hud-label text-[12px]" style={{ color: SUBJECT_RAIL[c.subject] }}>
                      {String(c.number).padStart(2, "0")} · {c.subject}
                    </span>
                    <span className="font-mono text-[11px] text-ink-400">{hydrated ? `${done}/${lessons.length}` : `${lessons.length}`}</span>
                  </div>
                  <h3 className="mt-2 font-display text-[16px] font-bold leading-snug text-gold-200">{c.title}</h3>
                  <p className="mt-1.5 flex-1 text-[13.5px] leading-snug text-ink-300">{c.outcome}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {lessons.slice(0, 4).map((l) => (
                      <code key={l.id} className="code-chip text-[11px]" title={l.concept}>
                        {l.concept.length > 20 ? `${l.concept.slice(0, 19)}…` : l.concept}
                      </code>
                    ))}
                    {lessons.length > 4 && <span className="hud-label self-center px-1 text-[11px] text-ink-500">+{lessons.length - 4}</span>}
                  </div>
                  {hydrated && done > 0 && (
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-700">
                      <div className="h-full rounded-full" style={{ width: `${(done / lessons.length) * 100}%`, background: SUBJECT_RAIL[c.subject] }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </Framed>

        {/* ——— The website you build ——— */}
        <Framed tag="<section id=&quot;build&quot;>" id="build">
          <SiteShowcase hydrated={hydrated} />
        </Framed>

        {/* ——— The map ——— */}
        <Framed tag="<nav class=&quot;map&quot;>" id="map">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="hud-label text-[11px] text-teal-300">Every lesson, one chart</div>
              <h2 className="font-display text-3xl font-bold text-gold-200">The map</h2>
            </div>
            <div className="hud-label text-[12px] text-ink-400">{hydrated ? `${completed} of ${LEVELS.length} complete` : "Scroll, drag, or use the arrows"}</div>
          </div>
          <WorldMap currentIndex={hydrated ? next : undefined} />
        </Framed>

        {/* ——— Close ——— */}
        <section className="grid gap-8 border-t border-ink-700/70 py-14 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="flex items-start gap-4">
            <GuidePortrait size={52} />
            <div>
              <div className="hud-label text-[11px] text-gold-400">The Old Ant</div>
              <p className="mt-1 max-w-[46ch] font-serif text-[18px] italic leading-relaxed text-ink-200">
                &ldquo;Nobody learns to build by watching. Write one line, see what it does, then write the next.&rdquo;
              </p>
            </div>
          </div>
          <div className="md:justify-self-end">
            <Link href="/play" className="btn btn-gold px-7! py-3! text-base!">
              {started ? "Continue the course" : "Start from zero"} <IconArrow size={16} />
            </Link>
            <p className="mt-2 text-[13px] text-ink-400">Free, no account needed. Progress saves in this browser.</p>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-700/70 py-6 text-[12.5px] text-ink-500">
          <span>© {new Date().getFullYear()} Shreyas · All rights reserved</span>
          <span className="font-mono">the world is the document</span>
        </footer>
      </div>
    </div>
  );
}
