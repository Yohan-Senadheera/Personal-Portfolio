import { useMemo, useState } from "react";

/* ================================================================ 09:30 · projects as a live cluster of pods */

export type Pod = {
  slug: string;
  title: string;
  when: string;
  kind: string;
  running: boolean;
  description: string;
  did: string;
  result: string;
  tech: readonly string[];
  link?: string;
};

export function PodBoard({ pods }: { pods: Pod[] }) {
  const [sel, setSel] = useState(0);
  const p = pods[sel];
  return (
    <div className="i-pods">
      <div className="i-pods__grid" role="tablist" aria-label="Projects">
        {pods.map((pod, i) => (
          <button
            key={pod.slug}
            role="tab"
            aria-selected={i === sel}
            className={`i-pod ${i === sel ? "is-sel" : ""} ${pod.running ? "is-run" : ""}`}
            onClick={() => setSel(i)}
            onMouseEnter={() => setSel(i)}
          >
            <span className="i-pod__dot" />
            <b>{pod.slug}</b>
            <em>{pod.running ? "Running" : "Completed"}</em>
          </button>
        ))}
      </div>
      <div className="i-describe" key={p.slug}>
        <div className="n-term__bar">
          <i />
          <i />
          <i />
          <span>kubectl describe pod {p.slug}</span>
        </div>
        <dl>
          <dt>Name</dt>
          <dd className="i-hl">{p.title}</dd>
          <dt>Status</dt>
          <dd className={p.running ? "i-run" : "i-done"}>
            {p.running ? "Running" : "Completed"} · {p.when}
          </dd>
          <dt>Kind</dt>
          <dd>{p.kind}</dd>
          <dt>Image</dt>
          <dd>{p.tech.slice(0, 6).join(", ")}</dd>
          <dt>Spec</dt>
          <dd>{p.description}</dd>
          <dt>Events</dt>
          <dd>
            <span className="i-ev">Normal</span> {p.did}
          </dd>
          <dt>Result</dt>
          <dd className="i-ok">{p.result}</dd>
        </dl>
        {p.link && (
          <a className="i-open" href={p.link} target="_blank" rel="noopener noreferrer">
            open {p.slug} ↗
          </a>
        )}
      </div>
    </div>
  );
}

/* ================================================================ 16:30 · experience as an on-call rotation schedule */

export type Shift = { lane: string; title: string; org: string; start: number; end: number; note: string };
export type Marker = { lane: string; title: string; at: number; note: string };

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** "Nov 2024" -> 2024 + 10/12; "Present" -> now. */
export function monthValue(s: string, now = 2026 + 10 / 12): number | null {
  const t = s.trim().toLowerCase();
  if (t.startsWith("present")) return now;
  const m = t.match(/([a-z]{3})[a-z]*\s+(\d{4})/);
  if (!m || !(m[1] in MONTHS)) return null;
  return Number(m[2]) + MONTHS[m[1]] / 12;
}

export function Rotation({ lanes, shifts, markers }: { lanes: string[]; shifts: Shift[]; markers: Marker[] }) {
  const items = useMemo(
    () => [...shifts.map((s) => ({ ...s, type: "shift" as const })), ...markers.map((m) => ({ ...m, type: "marker" as const }))],
    [shifts, markers],
  );
  const [sel, setSel] = useState(0);
  const from = 2022;
  const to = 2027;
  const x = (v: number) => ((v - from) / (to - from)) * 100;
  const years = [2022, 2023, 2024, 2025, 2026];
  const cur = items[sel];
  // Stack overlapping shifts (and stars that would touch) into sub-rows so nothing hides another.
  const rows = useMemo(() => {
    const row = new Map<number, number>();
    const count: Record<string, number> = {};
    lanes.forEach((lane) => {
      const ends: number[] = [];
      items
        .map((it, i) => ({ it, i, a: it.type === "shift" ? it.start : it.at - 0.12, b: it.type === "shift" ? it.end : it.at + 0.12 }))
        .filter((o) => o.it.lane === lane)
        .sort((p, q) => p.a - q.a)
        .forEach((o) => {
          let r = ends.findIndex((e) => e <= o.a);
          if (r === -1) r = ends.length;
          ends[r] = o.b;
          row.set(o.i, r);
        });
      count[lane] = Math.max(1, ends.length);
    });
    return { row, count };
  }, [items, lanes]);
  return (
    <div className="i-rot">
      <div className="i-rot__chart">
        <div className="i-rot__years">
          {years.map((y) => (
            <span key={y} style={{ left: `${x(y)}%` }}>
              {y}
            </span>
          ))}
          <i className="i-rot__now" style={{ left: `${x(2026 + 10 / 12)}%` }}>
            now
          </i>
        </div>
        {lanes.map((lane) => (
          <div className="i-rot__lane" key={lane}>
            <label>{lane}</label>
            <div className="i-rot__track" style={{ height: `${rows.count[lane] * 32 + 10}px` }}>
              {years.map((y) => (
                <i key={y} className="i-rot__grid" style={{ left: `${x(y)}%` }} />
              ))}
              {items.map((it, i) =>
                it.lane !== lane ? null : it.type === "shift" ? (
                  <button
                    key={i}
                    className={`i-shift ${i === sel ? "is-sel" : ""}`}
                    style={{ left: `${x(it.start)}%`, width: `${Math.max(1.6, x(it.end) - x(it.start))}%`, top: `${6 + (rows.row.get(i) ?? 0) * 32}px` }}
                    onClick={() => setSel(i)}
                    onMouseEnter={() => setSel(i)}
                    title={it.title}
                  >
                    <span>{it.title}</span>
                  </button>
                ) : (
                  <button
                    key={i}
                    className={`i-mark ${i === sel ? "is-sel" : ""}`}
                    style={{ left: `${x(it.at)}%`, top: `${5 + (rows.row.get(i) ?? 0) * 32}px` }}
                    onClick={() => setSel(i)}
                    onMouseEnter={() => setSel(i)}
                    title={it.title}
                    aria-label={it.title}
                  >
                    ★
                  </button>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="i-rot__card" key={sel}>
        <em>{cur.type === "shift" ? "On shift" : "Paged with good news"}</em>
        <b>{cur.title}</b>
        <span>{cur.type === "shift" ? cur.org : ""}</span>
        <p>{cur.note}</p>
      </div>
    </div>
  );
}
