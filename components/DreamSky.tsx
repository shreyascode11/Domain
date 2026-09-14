import type { CSSProperties } from "react";

/** Deterministic pseudo-random numbers, so server and client render the same sky. */
function seeded(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Star = { left: number; top: number; size: number; dur: number; delay: number; sparkle: boolean };
function makeStars(count: number, seed: number, maxTop: number): Star[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => ({
    left: rand() * 100,
    top: rand() * maxTop,
    size: 1 + rand() * 1.8,
    dur: 2.4 + rand() * 3.6,
    delay: rand() * -6,
    sparkle: rand() > 0.93,
  }));
}

const SKY_STARS = makeStars(120, 7, 62);
const MOTES = (() => {
  const rand = seeded(42);
  return Array.from({ length: 26 }, () => ({
    left: rand() * 100,
    bottom: rand() * 45,
    size: 2 + rand() * 3,
    dur: 8 + rand() * 9,
    delay: rand() * -16,
    dx: (rand() - 0.5) * 120,
  }));
})();

function Stars({ stars }: { stars: Star[] }) {
  return (
    <>
      {stars.map((s, i) =>
        s.sparkle ? (
          <span
            key={i}
            className="dream-sparkle"
            style={{ left: `${s.left}%`, top: `${s.top}%`, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
          />
        ) : (
          <span
            key={i}
            className="dream-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ),
      )}
    </>
  );
}

/** A floating island: a grassy top, a rocky underside, a blossom tree and a lit window. */
function Island({ id, flip = false, house = true }: { id: string; flip?: boolean; house?: boolean }) {
  return (
    <svg viewBox="0 0 260 230" className="h-auto w-full" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <defs>
        <linearGradient id={`${id}-rock`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b4f9e" />
          <stop offset="55%" stopColor="#3a2a6b" />
          <stop offset="100%" stopColor="#1b1440" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${id}-grass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b6f5d2" />
          <stop offset="100%" stopColor="#4fb392" />
        </linearGradient>
        <radialGradient id={`${id}-bloom`}>
          <stop offset="0%" stopColor="#ffe3f1" />
          <stop offset="70%" stopColor="#f4a6cf" />
          <stop offset="100%" stopColor="#c86fa6" />
        </radialGradient>
        <linearGradient id={`${id}-fall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dff6ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#dff6ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="92" rx="118" ry="26" fill="#f7b6d9" opacity="0.18" />
      <path d="M22 88 C 70 78, 190 78, 238 88 C 222 128, 176 170, 132 226 C 96 176, 44 130, 22 88 Z" fill={`url(#${id}-rock)`} />
      <path d="M60 110 L 70 150 M 104 118 L 110 176 M 176 114 L 168 160" stroke="#8d74c4" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <rect x="206" y="92" width="5" height="110" rx="2.5" fill={`url(#${id}-fall)`} className="dream-fall" />
      <path d="M14 88 C 52 66, 208 66, 246 88 C 204 101, 58 101, 14 88 Z" fill={`url(#${id}-grass)`} />
      <path d="M26 86 C 70 72, 190 72, 234 86" stroke="#eafff4" strokeOpacity="0.7" strokeWidth="2" fill="none" />
      <rect x="74" y="44" width="6" height="36" rx="3" fill="#6a4a7c" />
      <circle cx="77" cy="40" r="22" fill={`url(#${id}-bloom)`} />
      <circle cx="60" cy="50" r="14" fill={`url(#${id}-bloom)`} />
      <circle cx="94" cy="52" r="13" fill={`url(#${id}-bloom)`} />
      {house && (
        <g>
          <rect x="140" y="58" width="36" height="26" rx="2" fill="#efe3ff" />
          <path d="M134 60 L 158 40 L 182 60 Z" fill="#8f6fd1" />
          <rect x="152" y="66" width="11" height="11" rx="1.5" fill="#ffd98a" className="dream-window" />
        </g>
      )}
    </svg>
  );
}

/** A soft cumulus puff: overlapping circles, lit from above, edges softened. */
function Cloud({ className, style, id }: { className?: string; style?: CSSProperties; id: string }) {
  return (
    <svg viewBox="0 0 220 100" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4fb" />
          <stop offset="60%" stopColor="#e3c8f2" />
          <stop offset="100%" stopColor="#a888d6" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <circle cx="58" cy="60" r="30" />
        <circle cx="100" cy="44" r="38" />
        <circle cx="148" cy="56" r="30" />
        <circle cx="182" cy="66" r="20" />
        <rect x="28" y="60" width="174" height="32" rx="16" />
      </g>
    </svg>
  );
}

/** The dreamy twilight backdrop behind the landing hero. */
export function DreamSky() {
  return (
    <div aria-hidden className="dream-sky pointer-events-none absolute inset-0 overflow-hidden">
      <div className="dream-aurora dream-aurora-a" />
      <div className="dream-aurora dream-aurora-b" />
      <Stars stars={SKY_STARS} />
      <span className="dream-shooting" />

      <div className="dream-moon" />

      <Cloud id="cl-a" className="dream-cloud absolute left-[4%] top-[18%] hidden w-52 opacity-40 blur-[3px] md:block" style={{ animationDuration: "46s" }} />
      <Cloud id="cl-b" className="dream-cloud absolute right-[27%] top-[8%] hidden w-36 opacity-35 blur-[3px] md:block" style={{ animationDuration: "58s", animationDelay: "-20s" }} />

      <div className="dream-island absolute left-[3%] top-[34%] hidden w-[17rem] md:block" style={{ animationDuration: "9s" }}>
        <Island id="isl-a" />
      </div>
      <div className="dream-island absolute right-[4%] top-[48%] hidden w-[13rem] md:block" style={{ animationDuration: "11s", animationDelay: "-4s" }}>
        <Island id="isl-b" flip house={false} />
      </div>
      <div className="dream-island absolute left-[19%] top-[12%] hidden w-[6rem] opacity-60 blur-[1px] lg:block" style={{ animationDuration: "13s", animationDelay: "-7s" }}>
        <Island id="isl-c" house={false} />
      </div>
      <div className="dream-island absolute right-[20%] top-[26%] hidden w-[5rem] opacity-50 blur-[1.5px] lg:block" style={{ animationDuration: "15s", animationDelay: "-2s" }}>
        <Island id="isl-d" flip />
      </div>

      {MOTES.map((m, i) => (
        <span
          key={i}
          className="dream-mote"
          style={
            {
              left: `${m.left}%`,
              bottom: `${m.bottom}%`,
              width: m.size,
              height: m.size,
              animationDuration: `${m.dur}s`,
              animationDelay: `${m.delay}s`,
              "--dx": `${m.dx}px`,
            } as CSSProperties
          }
        />
      ))}

      <div className="dream-cloudsea dream-cloudsea-back" />
      <div className="dream-cloudsea dream-cloudsea-front" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#16134a]" />
    </div>
  );
}

const PAGE_STARS = makeStars(90, 99, 100);

/** Faint stars scattered over the rest of the page. */
export function PageStars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
      <Stars stars={PAGE_STARS} />
    </div>
  );
}
