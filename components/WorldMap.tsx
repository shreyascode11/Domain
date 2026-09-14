"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { CHAPTERS, LEVELS, levelsIn } from "@/lib/levels";
import { isUnlocked, useProgressStore } from "@/lib/store";
import { Compass, DomFace } from "./Emblems";

const H = 760;
const TOP = 108;
const BOTTOM = H - 34;

/** Each chapter is a region of the chart, tinted like its world. */
const REGION: Record<
  (typeof CHAPTERS)[number]["biome"],
  { fill: string; ink: string; label: string }
> = {
  meadow: { fill: "#c9d6a0", ink: "#4d6a2c", label: "The Meadow of Elements" },
  desert: { fill: "#e6c78e", ink: "#8a5a1e", label: "The Tailor's Dunes" },
  canyon: { fill: "#dba888", ink: "#8a3d22", label: "The Conveyor Canyon" },
  crystal: { fill: "#b7c8e6", ink: "#3b4f86", label: "The Crystal Reaches" },
};

/** Wide chapters (many lessons) get more columns, so no chapter is ever a tall wall of nodes — aim for at most ~7 rows. */
function colsFor(n: number) {
  return Math.max(1, Math.ceil(n / 7));
}
/** A fixed width per column, so a small chapter is never squeezed by a huge one — the map scrolls horizontally instead. */
const COL_WIDTH = 220;
/** A one-column chapter labels its lessons beside the node, so it needs room for the title. */
const SINGLE_COL_WIDTH = 330;
/** How far the map pans per unit of wheel movement. */
const WHEEL_SPEED = 0.45;

type Band = { chapter: number; cols: number; width: number; x0: number };
const BANDS: Band[] = (() => {
  let x = 0;
  return CHAPTERS.map((c) => {
    const cols = colsFor(levelsIn(c.number).length);
    const width = cols === 1 ? SINGLE_COL_WIDTH : cols * COL_WIDTH;
    const band = { chapter: c.number, cols, width, x0: x };
    x += width;
    return band;
  });
})();
const W = BANDS.reduce((sum, b) => sum + b.width, 0);
const bandOf = (chapter: number) => BANDS.find((b) => b.chapter === chapter)!;

/**
 * Node positions: a single column snakes left-right-alternating down a
 * narrow chapter; a wide chapter (many lessons) fills a boustrophedon grid
 * of columns instead, so a long chapter reads as a real path, not a wall.
 */
const SPOTS = LEVELS.map((level) => {
  const inChapter = levelsIn(level.chapter);
  const i = inChapter.indexOf(level);
  const n = inChapter.length;
  const b = bandOf(level.chapter);
  if (b.cols === 1) {
    const x = b.x0 + b.width * (i % 2 === 0 ? 0.36 : 0.64);
    const y = TOP + 30 + ((BOTTOM - TOP - 60) * (i + 0.5)) / n;
    return { x, y };
  }
  const rows = Math.ceil(n / b.cols);
  const row = Math.floor(i / b.cols);
  const posInRow = i % b.cols;
  const col = row % 2 === 0 ? posInRow : b.cols - 1 - posInRow;
  const x = b.x0 + (col + 0.5) * (b.width / b.cols);
  const y = TOP + 30 + ((BOTTOM - TOP - 60) * (row + 0.5)) / rows;
  return { x, y };
});

function route(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const bend = a.x < b.x ? -22 : 22;
  return `M${a.x} ${a.y} Q ${mx + bend} ${my + bend * 0.4}, ${b.x} ${b.y}`;
}

/** A soft, hand-drawn looking landmass filling a chapter's band. */
function regionPath(bx0: number, bx1: number, seed: number) {
  const w = bx1 - bx0;
  const wob = (k: number) => ((seed * 37 + k * 53) % 22) - 11;
  return `M${bx0 + 18} ${TOP + wob(1)}
    C ${bx0 + w * 0.3} ${TOP - 14 + wob(2)}, ${bx0 + w * 0.7} ${TOP + 12 + wob(3)}, ${bx1 - 16} ${TOP + wob(4)}
    C ${bx1 + 10 + wob(5)} ${TOP + 160}, ${bx1 - 12 + wob(6)} ${BOTTOM - 160}, ${bx1 - 10} ${BOTTOM + wob(7)}
    C ${bx0 + w * 0.65} ${BOTTOM + 14 + wob(8)}, ${bx0 + w * 0.35} ${BOTTOM - 10 + wob(9)}, ${bx0 + 12} ${BOTTOM + wob(10)}
    C ${bx0 - 8 + wob(11)} ${BOTTOM - 170}, ${bx0 + 10 + wob(12)} ${TOP + 150}, ${bx0 + 18} ${TOP + wob(1)} Z`;
}

/** Is part of the map hidden in the wheel's direction, in an ancestor that can still scroll that way? */
function mapCutOff(map: HTMLElement, deltaY: number) {
  const rect = map.getBoundingClientRect();
  for (let node = map.parentElement; node; node = node.parentElement) {
    const isRoot = node === document.documentElement;
    const overflowY = getComputedStyle(node).overflowY;
    if (!isRoot && overflowY !== "auto" && overflowY !== "scroll") continue;
    const canScroll = deltaY > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 1;
    if (canScroll) {
      const view = isRoot ? { top: 0, bottom: window.innerHeight } : node.getBoundingClientRect();
      if (deltaY > 0 ? rect.bottom > view.bottom + 1 : rect.top < view.top - 1) return true;
    }
    if (isRoot) break;
  }
  return false;
}

type Props = {
  currentIndex?: number;
  /** Without onPick, nodes link to /play?level=N. */
  onPick?: (index: number) => void;
};

export function WorldMap({ currentIndex, onPick }: Props) {
  const progress = useProgressStore((s) => s.levels);
  const [hover, setHover] = useState<number | null>(null);
  const router = useRouter();
  const focus = hover ?? currentIndex ?? null;
  const scrollerRef = useRef<HTMLDivElement>(null);

  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const [edges, setEdges] = useState({ start: true, end: false });

  const pick = (i: number) => {
    if (justDragged.current || !isUnlocked(i, progress)) return;
    if (onPick) onPick(i);
    else router.push(`/play?level=${i + 1}`);
  };

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  };

  // React's onWheel is passive, so preventDefault() there is ignored and the
  // page scrolls at the same time. A native listener can claim the wheel —
  // but only while the map can still move that way, so the page scrolls on
  // once you reach either end.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0 || e.ctrlKey) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = horizontal ? e.deltaX : e.deltaY;
      if (delta === 0) return;
      const atEnd = delta > 0 ? el.scrollLeft >= max - 1 : el.scrollLeft <= 1;
      if (atEnd && !horizontal) return;
      // A vertical wheel first scrolls the page (or dialog) until the whole
      // map is in view; only then does it pan the map sideways.
      if (!horizontal && mapCutOff(el, delta)) return;
      e.preventDefault();
      const px = e.deltaMode === 1 ? delta * 32 : e.deltaMode === 2 ? delta * el.clientWidth : delta;
      // Ease toward the target instead of jumping, and move at a readable pace.
      target = Math.min(max, Math.max(0, (frame ? target : el.scrollLeft) + px * WHEEL_SPEED));
      if (!frame) frame = requestAnimationFrame(glide);
    };
    let target = 0;
    let frame = 0;
    const glide = () => {
      const diff = target - el.scrollLeft;
      // scrollLeft snaps to whole pixels, so never step by less than one.
      const step = Math.sign(diff) * Math.max(1, Math.abs(diff) * 0.16);
      if (Math.abs(diff) <= 1) {
        el.scrollLeft = target;
        frame = 0;
        return;
      }
      el.scrollLeft += step;
      frame = requestAnimationFrame(glide);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    updateEdges();
    return () => {
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Open with the current lesson in view rather than always at chapter 1.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || currentIndex === undefined) return;
    const scale = el.scrollWidth / W;
    el.scrollLeft = SPOTS[currentIndex].x * scale - el.clientWidth / 2;
    updateEdges();
  }, [currentIndex]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = {
      x: e.clientX,
      left: e.currentTarget.scrollLeft,
      moved: false,
    };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 5) return;
    if (!d.moved) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    e.currentTarget.scrollLeft = d.left - dx;
  };
  const onPointerUp = () => {
    justDragged.current = !!drag.current?.moved;
    drag.current = null;
    if (justDragged.current) setTimeout(() => (justDragged.current = false), 0);
  };

  const nudge = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {!edges.start && (
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Scroll map left"
          className="map-nudge left-2"
        >
          ‹
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Scroll map right"
          className="map-nudge right-2"
        >
          ›
        </button>
      )}
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative w-full cursor-grab select-none overflow-x-auto overscroll-x-contain active:cursor-grabbing"
      >
        <div
          className="parchment relative overflow-hidden rounded-md p-2"
          style={{ width: W, maxWidth: "none" }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            role="group"
            aria-label="Course map: HTML, CSS, Flexbox, JavaScript"
          >
            <defs>
              <pattern
                id="hatch"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(35)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#6b4e1a"
                  strokeOpacity="0.16"
                  strokeWidth="1.2"
                />
              </pattern>
              <radialGradient id="node-glow">
                <stop offset="0%" stopColor="#3fe0c8" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#3fe0c8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="medal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff0c2" />
                <stop offset="50%" stopColor="#e0b85f" />
                <stop offset="100%" stopColor="#8a611d" />
              </linearGradient>
            </defs>

            <rect
              x="8"
              y="8"
              width={W - 16}
              height={H - 16}
              fill="none"
              stroke="#6b4e1a"
              strokeWidth="3"
            />
            <rect
              x="18"
              y="18"
              width={W - 36}
              height={H - 36}
              fill="none"
              stroke="#6b4e1a"
              strokeOpacity="0.45"
              strokeWidth="1"
              strokeDasharray="6 5"
            />

            {CHAPTERS.map((c, i) => {
              const r = REGION[c.biome];
              const b = bandOf(c.number);
              const first = LEVELS.findIndex((l) => l.chapter === c.number);
              const open = isUnlocked(first, progress);
              const cx = b.x0 + b.width / 2;
              return (
                <g key={c.number} opacity={open ? 1 : 0.6}>
                  <path
                    d={regionPath(b.x0 + 14, b.x0 + b.width - 14, i)}
                    fill={r.fill}
                    stroke={r.ink}
                    strokeWidth="2.5"
                    strokeOpacity="0.8"
                  />
                  <path
                    d={regionPath(b.x0 + 14, b.x0 + b.width - 14, i)}
                    fill="url(#hatch)"
                  />
                  <text
                    x={cx}
                    y={52}
                    textAnchor="middle"
                    fontFamily="var(--font-hud)"
                    fontSize="13"
                    letterSpacing="3"
                    fill={r.ink}
                    fontWeight="700"
                  >
                    CHAPTER {c.number} · {c.subject.toUpperCase()}
                  </text>
                  <text
                    x={cx}
                    y={78}
                    textAnchor="middle"
                    fontFamily="var(--font-display)"
                    fontWeight="700"
                    fontSize="16"
                    fill="#3b2a10"
                  >
                    {r.label}
                  </text>
                </g>
              );
            })}

            {SPOTS.slice(0, -1).map((s, i) => {
              const done = !!progress[LEVELS[i].id]?.completed;
              const sameChapter = LEVELS[i].chapter === LEVELS[i + 1].chapter;
              return (
                <path
                  key={`route-${i}`}
                  d={route(s, SPOTS[i + 1])}
                  fill="none"
                  stroke={done ? "#8a3d0b" : "#6b4e1a"}
                  strokeOpacity={done ? 0.9 : sameChapter ? 0.45 : 0.25}
                  strokeWidth={done ? 3 : 2}
                  strokeDasharray={done ? "9 6" : "4 7"}
                  strokeLinecap="round"
                />
              );
            })}

            {LEVELS.map((level, i) => {
              const s = SPOTS[i];
              const b = bandOf(level.chapter);
              const dense = b.cols > 1;
              const unlocked = isUnlocked(i, progress);
              const p = progress[level.id];
              const isCurrent = i === currentIndex;
              const labelLeft = s.x > b.x0 + b.width / 2;
              const label = `${level.title} — ${level.concept}${!unlocked ? " (locked)" : p?.gold ? " (gold seal)" : p?.completed ? " (complete)" : ""}`;
              const r = dense ? 12 : 16;
              const concept =
                level.concept.length > 16
                  ? level.concept.slice(0, 15) + "…"
                  : level.concept;
              return (
                <g
                  key={level.id}
                  role="button"
                  tabIndex={unlocked ? 0 : -1}
                  aria-label={label}
                  aria-disabled={!unlocked}
                  style={{
                    cursor: unlocked ? "pointer" : "not-allowed",
                    outline: "none",
                  }}
                  onClick={() => pick(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pick(i);
                    }
                  }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                >
                  <title>{label}</title>
                  {unlocked && !p?.completed && (i === 0 || !!progress[LEVELS[i - 1].id]?.completed) && (
                    <>
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={r + 10}
                        fill="url(#node-glow)"
                      />
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={r}
                        fill="none"
                        stroke="#18b8a3"
                        strokeWidth="3"
                        className="pulse-ring"
                      />
                    </>
                  )}
                  <circle
                    cx={s.x}
                    cy={s.y + 3}
                    r={r}
                    fill="#000"
                    opacity="0.22"
                  />
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={r}
                    fill={unlocked ? "url(#medal)" : "#8c8474"}
                    stroke={focus === i ? "#0d5d55" : "#4a3410"}
                    strokeWidth={focus === i ? 4 : 2}
                  />
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={r - 5}
                    fill={
                      unlocked ? (p?.gold ? "#fff3c4" : "#f6ecd4") : "#b1a78f"
                    }
                    stroke="#6b4e1a"
                    strokeWidth="1.2"
                  />
                  {!unlocked ? (
                    <g transform={`translate(${s.x - 6} ${s.y - 8})`}>
                      <rect
                        x="0"
                        y="6"
                        width="12"
                        height="9"
                        rx="1.5"
                        fill="#5b4f3a"
                      />
                      <path
                        d="M2 6 V 4 a 4 4 0 0 1 8 0 V 6"
                        fill="none"
                        stroke="#5b4f3a"
                        strokeWidth="2"
                      />
                    </g>
                  ) : p?.gold ? (
                    <path
                      transform={`translate(${s.x} ${s.y}) scale(${dense ? 0.28 : 0.36})`}
                      d="M0 -22 L 6 -7 L 22 -6 L 9 4 L 14 20 L 0 11 L -14 20 L -9 4 L -22 -6 L -6 -7 Z"
                      fill="#c79a3e"
                      stroke="#6b4e1a"
                      strokeWidth="3"
                    />
                  ) : p?.completed ? (
                    <path
                      d={`M${s.x - 5} ${s.y} l3.5 3.5 l7 -8`}
                      fill="none"
                      stroke="#2a6a3c"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <text
                      x={s.x}
                      y={s.y + (dense ? 4 : 5)}
                      textAnchor="middle"
                      fontFamily="var(--font-display)"
                      fontWeight="900"
                      fontSize={dense ? 11 : 13}
                      fill="#4a3410"
                    >
                      {level.number}
                    </text>
                  )}

                  {dense ? (
                    <text
                      x={s.x}
                      y={s.y + r + 12}
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      fontSize="9"
                      fill={unlocked ? "#6a4d1e" : "#8c8474"}
                    >
                      {concept}
                    </text>
                  ) : (
                    <>
                      <text
                        x={labelLeft ? s.x - r - 6 : s.x + r + 6}
                        y={s.y - 2}
                        textAnchor={labelLeft ? "end" : "start"}
                        fontFamily="var(--font-display)"
                        fontWeight="700"
                        fontSize="12.5"
                        fill={unlocked ? "#3b2a10" : "#7d7160"}
                      >
                        {level.title.length > 22
                          ? level.title.slice(0, 21) + "…"
                          : level.title}
                      </text>
                      <text
                        x={labelLeft ? s.x - r - 6 : s.x + r + 6}
                        y={s.y + 13}
                        textAnchor={labelLeft ? "end" : "start"}
                        fontFamily="var(--font-mono)"
                        fontSize="10.5"
                        fill={unlocked ? "#8a3d0b" : "#8c8474"}
                      >
                        {level.concept}
                      </text>
                    </>
                  )}

                  {isCurrent && (
                    <g className="float-y">
                      <svg
                        x={s.x - 16}
                        y={s.y - (dense ? 46 : 58)}
                        width="32"
                        height="32"
                        overflow="visible"
                      >
                        <DomFace size={32} />
                      </svg>
                      <path
                        d={`M${s.x - 4} ${s.y - r - 5} L ${s.x} ${s.y - r + 1} L ${s.x + 4} ${s.y - r - 5}`}
                        fill="#8a3d0b"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute bottom-3 right-4 opacity-70">
            <Compass size={70} />
          </div>
        </div>
      </div>
    </div>
  );
}
