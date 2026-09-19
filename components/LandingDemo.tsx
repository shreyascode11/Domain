"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { DomFace } from "./Emblems";

/**
 * The landing page's proof: change a CSS property and the ground moves.
 * Same idea as a level — the blocks are laid out by the browser, and the
 * code above them is the only thing deciding where they sit.
 */

const DIRECTIONS = ["row", "column"] as const;
const JUSTIFY = ["flex-start", "center", "space-between"] as const;
const GAPS = [8, 28, 56] as const;

type Direction = (typeof DIRECTIONS)[number];
type Justify = (typeof JUSTIFY)[number];

const BLOCKS = [
  { label: "start", tone: "start" },
  { label: "", tone: "stone" },
  { label: "", tone: "stone" },
  { label: "goal", tone: "goal" },
];

export function LandingDemo() {
  const [direction, setDirection] = useState<Direction>("row");
  const [justify, setJustify] = useState<Justify>("flex-start");
  const [gap, setGap] = useState<number>(8);
  const [touched, setTouched] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const before = useRef<Map<Element, DOMRect>>(new Map());

  // Remember where every block was, so the next layout can be animated from it.
  const snapshot = () => {
    const el = stage.current;
    if (!el) return;
    before.current = new Map([...el.children].map((child) => [child, child.getBoundingClientRect()]));
  };

  // Play each block from its old position to its new one (a FLIP animation).
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el || before.current.size === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const child of el.children) {
      const first = before.current.get(child);
      if (!first) continue;
      const last = child.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      child.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 420, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
      );
    }
  }, [direction, justify, gap]);

  const change = (apply: () => void) => {
    snapshot();
    setTouched(true);
    apply();
  };

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} aria-pressed={active} className={`demo-chip ${active ? "is-on" : ""}`}>
      {children}
    </button>
  );

  return (
    <figure className="demo">
      <div className="demo-bar">
        <span className="hud-label text-[11px] text-teal-300">style.css</span>
        <span className="demo-hint">{touched ? "The browser re-laid it out. That's the whole game." : "Change a value →"}</span>
      </div>

      <pre className="demo-code" aria-label="The CSS driving the blocks below">
        <code>
          <span className="sel">.path</span> {"{"}
          {"\n  "}display: <span className="val">flex</span>;
          {"\n  "}flex-direction: <span className="val live">{direction}</span>;
          {"\n  "}justify-content: <span className="val live">{justify}</span>;
          {"\n  "}gap: <span className="val live">{gap}px</span>;
          {"\n"}
          {"}"}
        </code>
      </pre>

      <div className="demo-controls">
        <div className="demo-row">
          <span className="demo-prop">flex-direction</span>
          {DIRECTIONS.map((d) => (
            <Chip key={d} active={direction === d} onClick={() => change(() => setDirection(d))}>
              {d}
            </Chip>
          ))}
        </div>
        <div className="demo-row">
          <span className="demo-prop">justify-content</span>
          {JUSTIFY.map((j) => (
            <Chip key={j} active={justify === j} onClick={() => change(() => setJustify(j))}>
              {j}
            </Chip>
          ))}
        </div>
        <div className="demo-row">
          <span className="demo-prop">gap</span>
          {GAPS.map((g) => (
            <Chip key={g} active={gap === g} onClick={() => change(() => setGap(g))}>
              {g}px
            </Chip>
          ))}
        </div>
      </div>

      <div className="demo-stage-wrap">
        <div
          ref={stage}
          className="demo-stage"
          // A row of blocks rests on the ground; a column reads better centred.
          style={{ flexDirection: direction, justifyContent: justify, gap, alignItems: direction === "row" ? "flex-end" : "center" }}
        >
          {BLOCKS.map((b, i) => (
            <div key={i} className={`demo-block tone-${b.tone}`}>
              {b.tone === "start" && (
                <span className="demo-ant" aria-hidden>
                  <DomFace size={30} />
                </span>
              )}
              {b.label}
            </div>
          ))}
        </div>
        <span className="demo-tag">&lt;div class=&quot;path&quot;&gt;</span>
      </div>

      <figcaption className="demo-caption">
        In a lesson, these blocks are what you walk on. Move them into a wall and you can&apos;t cross; line them up and you can.
      </figcaption>
    </figure>
  );
}
