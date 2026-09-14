"use client";

import { useLevelStore } from "@/lib/store";
import { LEVELS } from "@/lib/levels";
import { listenersFor } from "@/lib/stage";
import { IconX } from "./Icons";

const round = (n: number) => Math.round(n * 10) / 10;

function sides([t, r, b, l]: [number, number, number, number]) {
  if (t === r && r === b && b === l) return `${round(t)}px`;
  return `${round(t)} ${round(r)} ${round(b)} ${round(l)}px`;
}

function toHtmlOpen(selector: string) {
  const [tag, ...rest] = selector.split(/(?=[.#])/);
  const id = rest.find((p) => p.startsWith("#"))?.slice(1);
  const classes = rest.filter((p) => p.startsWith(".")).map((p) => p.slice(1));
  return { tag, id, classes };
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 px-2 py-0.5 ${highlight ? "bg-teal-400/15 text-teal-300 shadow-[inset_2px_0_0_#3fe0c8]" : ""}`}>
      <span className={highlight ? "" : "text-ink-400"}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-3">
      <div className="hud-label mb-1 text-[10.5px] text-gold-400">{title}</div>
      {children}
    </section>
  );
}

/**
 * The in-world inspector (blueprint §7.4): point at any object and see the
 * element, its box, and the rules that shape it — laid out like the
 * browser's own DevTools so the skill transfers.
 */
export function Inspector() {
  const key = useLevelStore((s) => s.selectedKey);
  const object = useLevelStore((s) => s.worldObjects.find((o) => o.key === s.selectedKey));
  const concept = useLevelStore((s) => LEVELS[s.levelIndex].concept);
  const select = useLevelStore((s) => s.select);
  const jumpTo = useLevelStore((s) => s.jumpTo);
  // Re-read listeners whenever the script runs again.
  useLevelStore((s) => s.jsRunToken);
  const hasJs = useLevelStore((s) => LEVELS[s.levelIndex].js !== undefined);

  if (!key || !object) return null;
  const listeners = hasJs ? listenersFor(key) : [];
  const info = object.inspect;
  const el = toHtmlOpen(info.selector);
  const flexRows = (f: { flexDirection: string; justifyContent: string; alignItems: string; gap: string }) => [
    ["flex-direction", f.flexDirection],
    ["justify-content", f.justifyContent],
    ["align-items", f.alignItems],
    ["gap", f.gap],
  ];

  return (
    <aside aria-label="Inspector" className="rise-in pointer-events-auto absolute bottom-3 right-3 z-10 max-h-[72%] w-84 overflow-y-auto">
      <div className="panel px-3 py-2.5 text-[12px] text-ink-100">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="hud-label flex items-center gap-1.5 text-[11px] text-teal-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" aria-hidden />
              Inspector
            </div>
            <div className="mt-0.5 break-all font-mono text-[13px]">
              <span className="text-ink-500">&lt;</span>
              <span className="text-gold-300">{el.tag}</span>
              {el.id && (
                <>
                  {" "}
                  <span className="text-teal-300">id</span>=<span className="text-jade-400">&quot;{el.id}&quot;</span>
                </>
              )}
              {el.classes.length > 0 && (
                <>
                  {" "}
                  <span className="text-teal-300">class</span>=<span className="text-jade-400">&quot;{el.classes.join(" ")}&quot;</span>
                </>
              )}
              <span className="text-ink-500">&gt;</span>
            </div>
          </div>
          <button onClick={() => select(null)} className="btn btn-ghost btn-sm px-2!" aria-label="Close inspector">
            <IconX size={14} />
          </button>
        </div>
        <div className="mt-1 break-all font-mono text-[10.5px] text-ink-500">{info.breadcrumb.join(" › ")}</div>

        {hasJs && (
          <Section title="JavaScript listening">
            {listeners.length === 0 ? (
              <div className="text-ink-400">No event listeners on this element.</div>
            ) : (
              listeners.map((type) => <Row key={type} label="addEventListener" value={`"${type}"`} highlight />)
            )}
            {listeners.includes("click") && <div className="mt-1 text-[11px] text-teal-300">Click the block in the world to fire it.</div>}
          </Section>
        )}

        <Section title="Box">
          <Row label="size" value={`${round(info.width)} × ${round(info.height)}px`} />
          <Row label="box-sizing" value={info.box.boxSizing} />
          {info.box.padding.some(Boolean) && <Row label="padding" value={sides(info.box.padding)} />}
          {info.box.border.some(Boolean) && <Row label="border" value={sides(info.box.border)} />}
          {info.box.margin.some(Boolean) && <Row label="margin" value={sides(info.box.margin)} />}
          {info.position !== "static" && <Row label="position" value={info.position} />}
        </Section>

        {info.flexParent && (
          <Section
            title={
              <>
                Placed by its flex container <span className="font-mono normal-case tracking-normal text-teal-300">{info.flexParent.selector}</span>
              </>
            }
          >
            {flexRows(info.flexParent).map(([k, v]) => (
              <Row key={k} label={k} value={v} highlight={k === concept} />
            ))}
          </Section>
        )}

        {info.flexSelf && (
          <Section title="Arranges its own children">
            <Row label="display" value={info.display} />
            {flexRows(info.flexSelf).map(([k, v]) => (
              <Row key={k} label={k} value={v} highlight={k === concept} />
            ))}
          </Section>
        )}

        <Section title="Rules that match">
          {info.rules.length === 0 && <div className="text-ink-400">No rules in your CSS select this element.</div>}
          <div className="space-y-1.5">
            {info.rules.map((r, i) => (
              <div key={i} className="border border-ink-600 bg-ink-950/80 p-2 font-mono text-[11.5px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gold-300">
                    {r.selector} <span className="text-ink-500">{"{"}</span>
                  </span>
                  <button onClick={() => jumpTo("css", r.line)} className="hud-label text-[10px] text-teal-300 hover:text-teal-300 hover:underline">
                    Edit · line {r.line}
                  </button>
                </div>
                {r.decls.map((d, j) => (
                  <div key={j} className={`pl-3 ${d.prop === concept ? "bg-teal-400/10" : ""}`}>
                    <span className="text-teal-300">{d.prop}</span>
                    <span className="text-ink-500">: </span>
                    <span className="text-ember-300">{d.value}</span>
                    <span className="text-ink-500">;</span>
                  </div>
                ))}
                <div className="text-ink-500">{"}"}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}
