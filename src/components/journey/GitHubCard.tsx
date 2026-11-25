import { useEffect, useState } from "react";

type Day = { d: string; c: number; l: number };
type Data = {
  login: string;
  name: string;
  avatar: string;
  since: string;
  total: number;
  days: Day[];
};

const LEVEL = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const CELL = 9;
const GAP = 2;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Live GitHub card: profile and last year's contribution graph, from /api/github (cached on the edge). */
export function GitHubCard() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let alive = true;
    const get = () => fetch("/api/github").then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    // One retry: GitHub occasionally fails a request.
    get()
      .catch(() => new Promise((ok) => setTimeout(ok, 1500)).then(get))
      .then((d) => alive && d && Array.isArray(d.days) && d.days.length && setData(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return null; // no card rather than a broken one

  // Columns are weeks (Sunday first), like GitHub's own graph.
  const first = new Date(data.days[0].d + "T00:00:00Z").getUTCDay();
  const cells = data.days.map((day, i) => ({ ...day, x: Math.floor((i + first) / 7), y: (i + first) % 7 }));
  const weeks = cells[cells.length - 1].x + 1;
  const w = weeks * (CELL + GAP);
  const h = 7 * (CELL + GAP) + 12;
  const labels: { x: number; m: string }[] = [];
  let last = -1;
  for (const c of cells) {
    const m = Number(c.d.slice(5, 7)) - 1;
    if (c.y === 0 && m !== last && c.x < weeks - 2) {
      labels.push({ x: c.x, m: MONTHS[m] });
      last = m;
    }
  }

  return (
    <a className="n-gh" href={`https://github.com/${data.login}`} target="_blank" rel="noopener noreferrer">
      <div className="n-gh__head">
        <img src={data.avatar} alt="" width={36} height={36} loading="lazy" />
        <div>
          <b>{data.name}</b>
          <span>
            @{data.login} · on GitHub since {data.since}
          </span>
        </div>
        <em>GitHub ↗</em>
      </div>
      <div className="n-gh__graph">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={`${data.total} contributions in the last year`}>
          {labels.map((l) => (
            <text key={l.x} x={l.x * (CELL + GAP)} y={8} className="n-gh__m">
              {l.m}
            </text>
          ))}
          {cells.map((c) => (
            <rect key={c.d} x={c.x * (CELL + GAP)} y={12 + c.y * (CELL + GAP)} width={CELL} height={CELL} rx={2} fill={LEVEL[c.l] ?? LEVEL[0]}>
              <title>
                {c.c === 0 ? "No" : c.c} contribution{c.c === 1 ? "" : "s"} on {c.d}
              </title>
            </rect>
          ))}
        </svg>
      </div>
      <p className="n-gh__foot">
        <b>{data.total.toLocaleString("en")}</b> contributions in the last year
      </p>
    </a>
  );
}
