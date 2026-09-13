"use client";

import { useState, type ReactNode } from "react";
import { useLevelStore, useProgressStore } from "@/lib/store";
import { HINT_RUNGS, LEVELS, CHAPTER_5 } from "@/lib/levels";
import { Code } from "./Code";
import { GuidePortrait, Seal } from "./Emblems";

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="hud-label mb-2 flex items-center gap-2 text-[12px] text-gold-400">
      <span className="h-1.5 w-1.5 rotate-45 bg-gold-400" aria-hidden />
      {children}
      <span className="h-px flex-1 bg-linear-to-r from-gold-600/40 to-transparent" aria-hidden />
    </h3>
  );
}

export function LessonPanel() {
  const levelIndex = useLevelStore((s) => s.levelIndex);
  const hintRung = useLevelStore((s) => s.hintRung);
  const revealHint = useLevelStore((s) => s.revealHint);
  const setTab = useLevelStore((s) => s.setSidePanelTab);
  const done = useProgressStore((s) => s.levels);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const level = LEVELS[levelIndex];
  const record = done[level.id];
  const nextIsReveal = hintRung === 4;

  return (
    <div className="space-y-6 p-5 text-[15px] leading-relaxed text-ink-200">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="hud-label text-[11px] text-ink-400">
            Chapter {CHAPTER_5.number} · Quest {level.number} of {LEVELS.length}
          </div>
          <h2 className="title-inscription mt-0.5 text-2xl font-bold">{level.title}</h2>
          <div className="mt-1 font-mono text-[13px] text-teal-300">{level.reference.property}</div>
        </div>
        {record?.completed && (
          <div className="flex flex-col items-center" title={record.gold ? "Gold seal earned" : "Completed"}>
            <Seal size={46} earned={record.gold} />
            <span className="hud-label mt-0.5 text-[10px] text-ink-400">{record.gold ? "Sealed" : "Done"}</span>
          </div>
        )}
      </header>

      <section className="border-l-2 border-teal-400 bg-linear-to-r from-teal-400/10 to-transparent px-4 py-3">
        <div className="hud-label text-[11px] text-teal-300">Objective</div>
        <p className="text-ink-100">
          <Code text={level.objective} />
        </p>
      </section>

      <section>
        <Heading>The idea</Heading>
        <div className="space-y-2.5">
          {level.lesson.map((p, i) => (
            <p key={i}>
              <Code text={p} />
            </p>
          ))}
        </div>
      </section>

      <section>
        <Heading>Field guide</Heading>
        <div className="overflow-x-auto border border-ink-600">
          <table className="w-full text-left text-[13px]">
            <caption className="sr-only">Values of {level.reference.property}</caption>
            <thead>
              <tr className="bg-ink-800">
                <th className="px-3 py-2 font-mono font-normal text-gold-300" colSpan={2}>
                  {level.reference.syntax}
                </th>
              </tr>
            </thead>
            <tbody>
              {level.reference.entries.map((e, i) => (
                <tr key={e.value} className={i % 2 ? "bg-ink-850" : "bg-ink-900"}>
                  <td className="whitespace-nowrap px-3 py-1.5 font-mono text-ember-300">{e.value}</td>
                  <td className="px-3 py-1.5 text-ink-300">{e.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="guide-heading">
        <Heading>
          <span id="guide-heading">The Old Ant</span>
        </Heading>
        <div className="flex items-start gap-3">
          <GuidePortrait size={42} />
          <p className="text-[14px] italic text-ink-300">
            &ldquo;Ask, and I&apos;ll say a little more each time. The last thing I&apos;ll give you is the line itself — but you&apos;ll learn more if you never need it.&rdquo;
          </p>
        </div>

        <ol className="mt-3 space-y-2">
          {level.hints.slice(0, hintRung).map((h, i) => (
            <li key={i} className="rise-in panel-soft px-3.5 py-2.5 text-[14px]">
              <div className="hud-label mb-0.5 text-[11px] text-gold-400">
                {i + 1} · {HINT_RUNGS[i]}
              </div>
              <Code text={h} />
            </li>
          ))}
        </ol>

        {hintRung < 5 && !confirmReveal && (
          <button onClick={() => (nextIsReveal ? setConfirmReveal(true) : revealHint())} className="btn btn-ghost btn-sm mt-3">
            {hintRung === 0 ? "I'm stuck — give me a hint" : nextIsReveal ? "Show me the answer" : "I need a bit more"}
          </button>
        )}
        {confirmReveal && hintRung < 5 && (
          <div className="mt-3 border border-ember-500/50 bg-ember-700/15 p-3 text-[14px] text-ember-300">
            The next step shows the exact line. You can still finish, but it won&apos;t earn a seal.
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  revealHint();
                  setConfirmReveal(false);
                }}
                className="btn btn-gold btn-sm"
              >
                Show it
              </button>
              <button onClick={() => setConfirmReveal(false)} className="btn btn-ghost btn-sm">
                Let me try again
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="panel-soft p-3.5 text-[13px] text-ink-300">
        <div className="hud-label mb-1.5 text-[11px] text-ink-400">How to play</div>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="keycap">A</span>
            <span className="keycap">D</span> move
            <span className="keycap ml-2">Space</span> jump
          </li>
          <li className="flex items-center gap-2">
            <span className="keycap">F</span> flatten to the real page
            <span className="keycap ml-2">R</span> respawn
          </li>
          <li>Click any block in the world to inspect its element and CSS.</li>
        </ul>
      </section>

      <button onClick={() => setTab("css")} className="btn btn-gold w-full">
        Open the CSS →
      </button>
    </div>
  );
}
