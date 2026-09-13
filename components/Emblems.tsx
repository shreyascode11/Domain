/** Small hand-drawn SVG emblems used across the UI. */

export function DomFace({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M22 16 C 18 8, 12 6, 9 7" stroke="#101826" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M38 15 C 42 7, 49 5, 52 7" stroke="#101826" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="8.5" cy="7" r="3.2" fill="#3fe0c8" />
      <circle cx="52.5" cy="7" r="3.2" fill="#3fe0c8" />
      <ellipse cx="31" cy="34" rx="21" ry="19" fill="#fbbf57" />
      <ellipse cx="31" cy="40" rx="17" ry="11" fill="#f59e0b" opacity="0.35" />
      <ellipse cx="23" cy="31" rx="6.4" ry="7.6" fill="#fff" />
      <ellipse cx="38.5" cy="31" rx="6.4" ry="7.6" fill="#fff" />
      <ellipse cx="24.5" cy="32" rx="3.4" ry="4.4" fill="#101826" />
      <ellipse cx="40" cy="32" rx="3.4" ry="4.4" fill="#101826" />
      <circle cx="25.6" cy="30" r="1.2" fill="#fff" />
      <circle cx="41.1" cy="30" r="1.2" fill="#fff" />
      <ellipse cx="17" cy="41" rx="3" ry="1.8" fill="#fb7185" opacity="0.8" />
      <ellipse cx="45" cy="41" rx="3" ry="1.8" fill="#fb7185" opacity="0.8" />
      <path d="M27 44 Q 31 47 35 44" stroke="#7a3d0a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M12 52 Q 31 60 50 52 L 48 58 Q 31 64 14 58 Z" fill="#ef4444" />
    </svg>
  );
}

/** The Old Ant from the fable — the Guide. Spectacles, grey brows, a staff. */
export function OldAntFace({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M22 17 C 16 9, 10 9, 7 12" stroke="#2a1d10" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M40 16 C 45 8, 51 8, 55 11" stroke="#2a1d10" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="7" cy="12.5" r="3" fill="#e0b85f" />
      <circle cx="55" cy="11.5" r="3" fill="#e0b85f" />
      <ellipse cx="31" cy="35" rx="20" ry="18" fill="#b8753a" />
      <ellipse cx="31" cy="42" rx="15" ry="9" fill="#8a4f1f" opacity="0.4" />
      <path d="M15 25 Q 21 21 27 25" stroke="#e8edf6" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M35 25 Q 41 21 47 25" stroke="#e8edf6" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="33" r="6" fill="#f6ecd4" stroke="#c79a3e" strokeWidth="2" />
      <circle cx="40" cy="33" r="6" fill="#f6ecd4" stroke="#c79a3e" strokeWidth="2" />
      <path d="M28 33 L 34 33" stroke="#c79a3e" strokeWidth="2" />
      <circle cx="23" cy="34" r="2.4" fill="#101826" />
      <circle cx="41" cy="34" r="2.4" fill="#101826" />
      <path d="M24 46 Q 31 50 38 46" stroke="#e8edf6" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M25 47 Q 31 55 37 47" fill="#e8edf6" opacity="0.9" />
    </svg>
  );
}

/** A wax-and-gold seal medallion. */
export function Seal({ size = 72, earned = true }: { size?: number; earned?: boolean }) {
  const id = earned ? "seal-gold" : "seal-dim";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={earned ? "#fff3c4" : "#7c8aa6"} />
          <stop offset="45%" stopColor={earned ? "#e0b85f" : "#3a4c70"} />
          <stop offset="100%" stopColor={earned ? "#8a611d" : "#1b2843"} />
        </radialGradient>
      </defs>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <circle key={i} cx={50 + Math.cos(a) * 42} cy={50 + Math.sin(a) * 42} r="7" fill={`url(#${id})`} />;
      })}
      <circle cx="50" cy="50" r="40" fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="31" fill="none" stroke={earned ? "#6b4e1a" : "#0a1020"} strokeWidth="2" strokeDasharray="3 3" />
      <path
        d="M50 28 L 56 43 L 72 44 L 59 54 L 64 70 L 50 61 L 36 70 L 41 54 L 28 44 L 44 43 Z"
        fill={earned ? "#fff6d6" : "#6b7ea3"}
        stroke={earned ? "#6b4e1a" : "#0a1020"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Compass({ size = 110 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <g stroke="#c79a3e" strokeOpacity="0.55" fill="none">
        <circle cx="60" cy="60" r="52" />
        <circle cx="60" cy="60" r="44" strokeDasharray="2 4" />
      </g>
      <g fill="#c79a3e" fillOpacity="0.75">
        <path d="M60 6 L 66 60 L 60 54 L 54 60 Z" />
        <path d="M60 114 L 54 60 L 60 66 L 66 60 Z" fillOpacity="0.4" />
        <path d="M6 60 L 60 54 L 54 60 L 60 66 Z" fillOpacity="0.4" />
        <path d="M114 60 L 60 66 L 66 60 L 60 54 Z" fillOpacity="0.4" />
      </g>
      <text x="60" y="4" textAnchor="middle" fontSize="10" fill="#e0b85f" fontFamily="var(--font-display)">
        N
      </text>
    </svg>
  );
}

/** The Old Ant in a gilded frame. */
export function GuidePortrait({ size = 40 }: { size?: number }) {
  return (
    <div className="shrink-0 rounded-full border border-gold-500/60 bg-linear-to-b from-ink-600 to-ink-850 p-0.5 shadow-[0_0_14px_rgba(224,184,95,0.25)]">
      <OldAntFace size={size} />
    </div>
  );
}
