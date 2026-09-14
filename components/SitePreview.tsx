"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildSite, SITE_URL } from "@/lib/site";
import { IconLock } from "./Icons";

/** The width the café page is laid out at, before being scaled to fit the frame. */
const PAGE_WIDTH = 1024;

type Props = {
  /** Ids of the finished lessons. */
  done: string[];
  /** Outline this lesson's piece and scroll to it. */
  spotlight?: string;
  /** Visible height of the page area, in CSS pixels. */
  height?: number;
  className?: string;
};

/** A little browser window showing the café site as built so far. */
export function SitePreview({ done, spotlight, height = 360, className = "" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const key = done.join(",");
  const site = useMemo(() => {
    const set = new Set(key ? key.split(",") : []);
    return buildSite((id) => set.has(id), spotlight);
  }, [key, spotlight]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / PAGE_WIDTH)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`overflow-hidden rounded-xl border border-white/15 bg-[#1c1a2e] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#2a2740] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 max-w-[40%] truncate rounded-t-md bg-[#1c1a2e] px-3 py-1 text-[11px] text-ink-200" title={site.title}>
          {site.title}
        </span>
        <span className="ml-auto flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-full bg-[#1c1a2e] px-3 py-1 font-mono text-[11px] text-ink-300 sm:max-w-[45%]">
          <IconLock size={10} className="shrink-0 text-jade-400" /> {SITE_URL}
        </span>
      </div>
      <div ref={box} className="relative w-full overflow-hidden bg-white" style={{ height }}>
        <iframe
          title="Your website"
          sandbox="allow-scripts"
          srcDoc={site.srcdoc}
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{ width: PAGE_WIDTH, height: height / scale, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
