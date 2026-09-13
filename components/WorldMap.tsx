"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CHAPTER_5, LEVELS } from "@/lib/levels";
import { isUnlocked, useProgressStore } from "@/lib/store";
import { Compass, DomFace } from "./Emblems";

/** Where each level sits on the chart, and the island drawn under it. */
const SPOTS: { x: number; y: number; island: string; labelDy: number }[] = [
  {
    x: 190,
    y: 390,
    labelDy: 62,
    island: "M95 395 C 90 340, 150 320, 200 330 C 260 338, 300 360, 292 405 C 286 450, 230 470, 175 462 C 120 455, 100 440, 95 395 Z",
  },
  {
    x: 420,
    y: 240,
    labelDy: -48,
    island: "M330 250 C 320 200, 380 175, 440 180 C 505 186, 530 220, 518 262 C 506 300, 455 318, 400 312 C 350 306, 336 290, 330 250 Z",
  },
  {
    x: 640,
    y: 390,
    labelDy: 62,
    island: "M548 402 C 540 350, 590 322, 648 326 C 712 330, 742 362, 730 408 C 720 450, 668 470, 612 462 C 565 455, 552 440, 548 402 Z",
  },
  {
    x: 840,
    y: 205,
    labelDy: -52,
    island: "M760 212 C 752 160, 800 128, 855 132 C 915 138, 940 176, 925 222 C 912 262, 865 282, 815 272 C 775 264, 764 248, 760 212 Z",
  },
];

/** The dotted route between consecutive levels. */
function routeBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = Math.min(a.y, b.y) - 70;
  return `M${a.x} ${a.y} Q ${mx} ${my}, ${b.x} ${b.y}`;
}

type Props = {
  currentIndex?: number;
  onPick?: (index: number) => void;
  /** Without onPick, nodes link to /play?level=N. */
  compact?: boolean;
};

export function WorldMap({ currentIndex, onPick, compact }: Props) {
  const progress = useProgressStore((s) => s.levels);
  const [hover, setHover] = useState<number | null>(null);
  const router = useRouter();
  const focus = hover ?? currentIndex ?? null;

  const pick = (i: number) => {
    if (!isUnlocked(i, progress)) return;
    if (onPick) onPick(i);
    else router.push(`/play?level=${i + 1}`);
  };

  return (
    <div className="relative w-full">
      <div className="parchment relative overflow-hidden rounded-[6px] p-2">
        <svg viewBox="0 0 1000 560" className="block h-auto w-full" role="group" aria-label={`Map of chapter ${CHAPTER_5.number}: ${CHAPTER_5.title}`}>
          <defs>
            <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#8a6a3a" strokeOpacity="0.25" strokeWidth="1.2" />
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

          {/* frame */}
          <rect x="12" y="12" width="976" height="536" fill="none" stroke="#6b4e1a" strokeWidth="3" />
          <rect x="22" y="22" width="956" height="516" fill="none" stroke="#6b4e1a" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="6 5" />

          {/* sea marks */}
          {[
            [120, 150], [300, 470], [560, 150], [760, 470], [940, 360], [60, 300], [480, 510],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} q 10 -8 20 0 q 10 8 20 0`} stroke="#6b4e1a" strokeOpacity="0.35" strokeWidth="1.6" fill="none" />
          ))}

          {/* islands */}
          {SPOTS.map((s, i) => {
            const unlocked = isUnlocked(i, progress);
            return (
              <g key={`island-${i}`} opacity={unlocked ? 1 : 0.55}>
                <path d={s.island} fill="#d8c090" stroke="#7a5a2a" strokeWidth="2.5" />
                <path d={s.island} fill="url(#hatch)" />
                <path d={s.island} fill="none" stroke="#7a5a2a" strokeOpacity="0.35" strokeWidth="10" style={{ filter: "blur(4px)" }} />
              </g>
            );
          })}

          {/* routes */}
          {SPOTS.slice(0, -1).map((s, i) => {
            const done = !!progress[LEVELS[i].id]?.completed;
            return (
              <path
                key={`route-${i}`}
                d={routeBetween(s, SPOTS[i + 1])}
                fill="none"
                stroke={done ? "#8a3d0b" : "#6b4e1a"}
                strokeOpacity={done ? 0.9 : 0.5}
                strokeWidth={done ? 3.5 : 2.5}
                strokeDasharray={done ? "10 7" : "4 8"}
                strokeLinecap="round"
              />
            );
          })}

          {/* nodes */}
          {LEVELS.map((level, i) => {
            const s = SPOTS[i];
            const unlocked = isUnlocked(i, progress);
            const p = progress[level.id];
            const isCurrent = i === currentIndex;
            const label = `Level ${level.number}: ${level.title}${!unlocked ? " (locked)" : p?.gold ? " (gold seal)" : p?.completed ? " (complete)" : ""}`;
            return (
              <g
                key={level.id}
                role="button"
                tabIndex={unlocked ? 0 : -1}
                aria-label={label}
                aria-disabled={!unlocked}
                style={{ cursor: unlocked ? "pointer" : "not-allowed", outline: "none" }}
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
                {unlocked && !p?.completed && (
                  <>
                    <circle cx={s.x} cy={s.y} r="46" fill="url(#node-glow)" />
                    <circle cx={s.x} cy={s.y} r="30" fill="none" stroke="#18b8a3" strokeWidth="3" className="pulse-ring" />
                  </>
                )}
                <circle cx={s.x} cy={s.y + 3} r="30" fill="#000" opacity="0.25" />
                <circle cx={s.x} cy={s.y} r="30" fill={unlocked ? "url(#medal)" : "#8c8474"} stroke={focus === i ? "#0d5d55" : "#4a3410"} strokeWidth={focus === i ? 4 : 2.5} />
                <circle cx={s.x} cy={s.y} r="22" fill={unlocked ? (p?.gold ? "#fff3c4" : "#f6ecd4") : "#b1a78f"} stroke="#6b4e1a" strokeWidth="1.5" />
                {!unlocked ? (
                  <g transform={`translate(${s.x - 9} ${s.y - 11})`}>
                    <rect x="0" y="9" width="18" height="13" rx="2" fill="#5b4f3a" />
                    <path d="M3 9 V 6 a 6 6 0 0 1 12 0 V 9" fill="none" stroke="#5b4f3a" strokeWidth="3" />
                  </g>
                ) : p?.gold ? (
                  <path
                    transform={`translate(${s.x} ${s.y}) scale(0.55)`}
                    d="M0 -22 L 6 -7 L 22 -6 L 9 4 L 14 20 L 0 11 L -14 20 L -9 4 L -22 -6 L -6 -7 Z"
                    fill="#c79a3e"
                    stroke="#6b4e1a"
                    strokeWidth="3"
                  />
                ) : (
                  <text x={s.x} y={s.y + 8} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="900" fontSize="22" fill="#4a3410">
                    {p?.completed ? "✓" : level.number}
                  </text>
                )}

                <text
                  x={s.x}
                  y={s.y + s.labelDy}
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontWeight="700"
                  fontSize="19"
                  fill={unlocked ? "#3b2a10" : "#7d7160"}
                >
                  {level.title}
                </text>
                <text
                  x={s.x}
                  y={s.y + s.labelDy + 20}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="13"
                  fill={unlocked ? "#8a3d0b" : "#8c8474"}
                >
                  {level.concept}
                </text>

                {isCurrent && (
                  <g className="float-y">
                    {/* "You are here": Dom stands beside the level he's on. */}
                    <svg x={s.x - 92} y={s.y - 24} width="48" height="48" overflow="visible">
                      <DomFace size={48} />
                    </svg>
                    <path d={`M${s.x - 42} ${s.y - 6} L ${s.x - 33} ${s.y} L ${s.x - 42} ${s.y + 6}`} fill="#8a3d0b" />
                  </g>
                )}
              </g>
            );
          })}

          {/* cartouche */}
          {!compact && (
            <g>
              <path d="M40 40 H 380 L 400 62 L 380 84 H 40 L 56 62 Z" fill="#2b2012" opacity="0.9" />
              <path d="M40 40 H 380 L 400 62 L 380 84 H 40 L 56 62 Z" fill="none" stroke="#c79a3e" strokeWidth="1.5" />
              <text x="72" y="58" fontFamily="var(--font-hud)" fontSize="13" letterSpacing="3" fill="#e0b85f">
                CHAPTER {CHAPTER_5.number} · {CHAPTER_5.teaches.toUpperCase()}
              </text>
              <text x="72" y="77" fontFamily="var(--font-display)" fontWeight="700" fontSize="18" fill="#f6ecd4">
                {CHAPTER_5.title}
              </text>
            </g>
          )}
        </svg>
        <div className="pointer-events-none absolute bottom-3 right-4 opacity-80">
          <Compass size={compact ? 70 : 100} />
        </div>
      </div>
    </div>
  );
}
