"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CHAPTER_5, LEVELS } from "@/lib/levels";
import { firstIncompleteIndex, useProgressStore } from "@/lib/store";
import { DomFace, GuidePortrait } from "./Emblems";
import { WorldMap } from "./WorldMap";

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
    <div className="bg-night-map relative min-h-screen overflow-hidden text-ink-100">
      {/* dusk horizon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-130"
        style={{
          background:
            "radial-gradient(900px 260px at 50% 100%, rgba(217,119,74,0.45), transparent 70%), linear-gradient(180deg, #060b1c 0%, #13224a 55%, rgba(26,44,82,0) 100%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <span className="hud-label text-[12px] text-ink-400">A game where the world is a web page</span>
        <Link href="/play" className="btn btn-ghost btn-sm">
          Play
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 pt-6 text-center">
        <div className="float-y">
          <DomFace size={88} />
        </div>
        <h1 className="title-inscription mt-2 font-display text-6xl font-black tracking-[0.22em] sm:text-7xl">DOMAIN</h1>
        <div className="rule-ornament mt-4 w-72" />
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-200">
          Every level is a real web page, raised into a 3D world. The ground under your feet is laid out by the browser&apos;s own
          CSS engine — and each level starts broken. The only way forward is to write the CSS that fixes it.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/play" className="btn btn-gold px-7! py-3! text-base!">
            {started ? `Continue — ${LEVELS[next].title}` : "Begin the adventure"}
          </Link>
          <a href="#map" className="btn btn-ghost">
            View the map
          </a>
        </div>

        <section className="mt-12 grid w-full gap-4 text-left sm:grid-cols-3">
          {[
            { k: "Learn", t: "Each quest opens with the idea, in plain words, and a field guide to the property." },
            { k: "Fix the world", t: "Edit real CSS. The world reshapes as you type — and never breaks on a half-typed line." },
            { k: "Understand", t: "Inspect any block like DevTools. Finish with a debrief of the rule you just used." },
          ].map((c) => (
            <div key={c.k} className="panel px-5 py-4">
              <div className="hud-label text-[12px] text-gold-400">{c.k}</div>
              <p className="mt-1 text-[15px] text-ink-200">{c.t}</p>
            </div>
          ))}
        </section>

        <section id="map" className="mt-12 w-full scroll-mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 text-left">
            <div>
              <div className="hud-label text-[12px] text-gold-400">
                Chapter {CHAPTER_5.number} · {CHAPTER_5.teaches}
              </div>
              <h2 className="font-display text-3xl font-bold text-gold-200">{CHAPTER_5.title}</h2>
            </div>
            <div className="hud-label text-[13px] text-ink-300">
              {hydrated ? `${completed} of ${LEVELS.length} quests complete` : ""}
            </div>
          </div>
          <div className="panel p-3">
            <WorldMap currentIndex={hydrated ? next : undefined} />
          </div>
        </section>

        <section className="mt-10 flex max-w-2xl items-start gap-4 text-left">
          <GuidePortrait size={56} />
          <div>
            <div className="hud-label text-[12px] text-gold-400">The Old Ant</div>
            <p className="mt-1 font-serif text-[18px] italic leading-relaxed text-ink-200">
              &ldquo;Stop talking to the ants one at a time. Talk to the line.&rdquo;
            </p>
            <p className="mt-1 text-[14px] text-ink-400">{CHAPTER_5.moral}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
