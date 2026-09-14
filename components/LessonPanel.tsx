"use client";

import { useState, type ReactNode } from "react";
import { useLevelStore, useProgressStore } from "@/lib/store";
import { HINT_RUNGS, LEVELS, chapterOf, levelsIn } from "@/lib/levels";
import { Code } from "./Code";
import { GuidePortrait, Seal } from "./Emblems";
import { IconArrow, IconBulb } from "./Icons";

const FILE_LABEL = { html: "HTML", css: "CSS", js: "JavaScript" } as const;

function Heading({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <h3 className="hud-label mb-2.5 flex items-center gap-2 text-[12px] text-gold-400">
      {n !== undefined ? (
        <span className="flex h-5 w-5 items-center justify-center border border-gold-500/60 bg-gold-400/10 font-mono text-[11px] text-gold-300">{n}</span>
      ) : (
        <span className="h-1.5 w-1.5 rotate-45 bg-gold-400" aria-hidden />
      )}
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
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const level = LEVELS[levelIndex];
  const chapter = chapterOf(level);
  const inChapter = levelsIn(chapter.number).length;
  const record = done[level.id];
  const nextIsReveal = hintRung === 4;
  const editName = FILE_LABEL[level.edit];

  return (
    <div className="space-y-7 p-5 text-[15px] leading-relaxed text-ink-200">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="hud-label flex flex-wrap items-center gap-x-2 text-[11px] text-ink-400">
            <span className="text-gold-400">
              Chapter {chapter.number} · {chapter.subject}
            </span>
            <span className="text-ink-600">◆</span>
            <span>
              Lesson {level.number} of {inChapter}
            </span>
          </div>
          <h2 className="title-inscription mt-0.5 text-2xl font-bold">{level.title}</h2>
          <div className="mt-1 inline-block rounded-sm bg-teal-400/10 px-1.5 font-mono text-[13px] text-teal-300">{level.concept}</div>
        </div>
        {record?.completed && (
          <div className="flex shrink-0 flex-col items-center" title={record.gold ? "Gold seal earned" : "Completed"}>
            <Seal size={46} earned={record.gold} />
            <span className="hud-label mt-0.5 text-[10px] text-ink-400">{record.gold ? "Sealed" : "Done"}</span>
          </div>
        )}
      </header>

      <section className="grid gap-2">
        <div className="flex gap-3 border-l-2 border-gold-400 bg-linear-to-r from-gold-400/10 to-transparent px-4 py-2.5">
          <IconBulb size={18} className="mt-0.5 shrink-0 text-gold-300" />
          <div>
            <div className="hud-label text-[11px] text-gold-300">You will learn</div>
            <p className="text-ink-100">
              <Code text={level.learn} />
            </p>
          </div>
        </div>
        <div className="border-l-2 border-teal-400 bg-linear-to-r from-teal-400/10 to-transparent px-4 py-2.5">
          <div className="hud-label text-[11px] text-teal-300">Your task</div>
          <p className="text-ink-100">
            <Code text={level.objective} />
          </p>
        </div>
      </section>

      <section>
        <Heading n={1}>Read the idea</Heading>
        <div className="space-y-3">
          {level.lesson.map((p, i) => (
            <p key={i}>
              <Code text={p} />
            </p>
          ))}
        </div>
      </section>

      <section>
        <Heading n={2}>Study the example</Heading>
        <div className="overflow-x-auto border border-ink-600 bg-ink-950">
          <div className="flex items-center justify-between border-b border-ink-700 bg-ink-850 px-3 py-1">
            <span className="hud-label text-[10.5px] text-ink-400">Example · {FILE_LABEL[level.example.lang]}</span>
          </div>
          <table className="w-full text-left text-[13px]">
            <tbody>
              {level.example.lines.map((l, i) => (
                <tr key={i} className="align-top">
                  <td className="w-6 select-none py-1 pl-3 pr-2 text-right font-mono text-[11px] text-ink-600">{i + 1}</td>
                  <td className="whitespace-pre py-1 pr-4 font-mono text-gold-200">{l.code}</td>
                  <td className="py-1 pr-3 text-[12.5px] text-ink-400">{l.note && <span className="text-teal-300/90">← {l.note}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <Heading n={3}>Do it, step by step</Heading>
        <ol className="space-y-1.5">
          {level.steps.map((step, i) => {
            const id = `${level.id}:${i}`;
            const on = !!checked[id];
            return (
              <li key={id}>
                <label className={`flex cursor-pointer items-start gap-3 border px-3 py-2 transition-colors ${on ? "border-jade-400/40 bg-jade-600/10 text-ink-400" : "border-ink-700 bg-ink-850/60 hover:border-ink-500"}`}>
                  <input type="checkbox" checked={on} onChange={() => setChecked((c) => ({ ...c, [id]: !on }))} className="mt-1 accent-jade-400" />
                  <span className={`text-[14px] ${on ? "line-through decoration-ink-500" : ""}`}>
                    <span className="mr-1.5 font-mono text-[12px] text-gold-400">{i + 1}.</span>
                    <Code text={step} />
                  </span>
                </label>
              </li>
            );
          })}
        </ol>
        <button onClick={() => setTab(level.edit)} className="btn btn-gold mt-3 w-full">
          Open the {editName} and try it <IconArrow size={15} />
        </button>
      </section>

      <section>
        <Heading>Quick reference · {level.reference.title}</Heading>
        <div className="overflow-x-auto border border-ink-600">
          <table className="w-full text-left text-[13px]">
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
                  <td className="px-3 py-1.5 text-ink-300">
                    <Code text={e.meaning} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="guide-heading">
        <Heading>
          <span id="guide-heading">Stuck? Ask the Old Ant</span>
        </Heading>
        <div className="flex items-start gap-3">
          <GuidePortrait size={42} />
          <p className="text-[14px] italic text-ink-300">
            &ldquo;Each time you ask, I&apos;ll say a little more. The last thing I give you is the line itself — try to finish before then.&rdquo;
          </p>
        </div>

        <ol className="mt-3 space-y-2">
          {level.hints.slice(0, hintRung).map((h, i) => (
            <li key={i} className="rise-in panel-soft px-3.5 py-2.5 text-[14px]">
              <div className="hud-label mb-0.5 text-[11px] text-gold-400">
                Hint {i + 1} · {HINT_RUNGS[i]}
              </div>
              <Code text={h} />
            </li>
          ))}
        </ol>

        {hintRung < 5 && !confirmReveal && (
          <button onClick={() => (nextIsReveal ? setConfirmReveal(true) : revealHint())} className="btn btn-ghost btn-sm mt-3">
            {hintRung === 0 ? "Give me a hint" : nextIsReveal ? "Show me the answer" : "I need a bit more"}
          </button>
        )}
        {confirmReveal && hintRung < 5 && (
          <div className="mt-3 border border-ember-500/50 bg-ember-700/15 p-3 text-[14px] text-ember-300">
            The next hint shows the exact code. You can still finish the level, but it won&apos;t earn a gold seal.
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
        <div className="hud-label mb-1.5 text-[11px] text-ink-400">Controls</div>
        <ul className="space-y-1.5">
          <li className="flex flex-wrap items-center gap-1.5">
            <span className="keycap">A</span>
            <span className="keycap">D</span> move
            <span className="keycap ml-2">Space</span> jump
            <span className="keycap ml-2">Esc</span> leave the editor
          </li>
          <li className="flex flex-wrap items-center gap-1.5">
            <span className="keycap">F</span> see the flat web page
            <span className="keycap ml-2">V</span> camera
            <span className="keycap ml-2">R</span> respawn
          </li>
          <li>Right-drag to look around, scroll to zoom. Click a block to inspect its element.</li>
        </ul>
      </section>
    </div>
  );
}
