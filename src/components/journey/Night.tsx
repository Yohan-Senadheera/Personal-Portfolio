import { useEffect, useRef, useState, type ReactNode } from "react";

/* The pieces of "The 3 AM Page": real objects (a terminal, a diagram, a phone, PR cards, a git log,
   a postmortem) that come alive when their chapter is on screen. */

/** Types lines out one character at a time while `on`; keeps them once typed. */
export function useTyped(lines: string[], on: boolean, speed = 16) {
  const [shown, setShown] = useState<string[]>([]);
  const done = useRef(false);
  const src = useRef(lines);
  src.current = lines;
  useEffect(() => {
    if (!on || done.current) return;
    const lines = src.current;
    let li = 0;
    let ci = 0;
    const out: string[] = [];
    const id = window.setInterval(() => {
      if (li >= lines.length) {
        done.current = true;
        window.clearInterval(id);
        return;
      }
      const line = lines[li];
      ci = Math.min(line.length, ci + 2);
      out[li] = line.slice(0, ci);
      setShown([...out]);
      if (ci >= line.length) {
        li++;
        ci = 0;
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [on, speed]);
  return done.current ? lines : shown;
}

/* ---------------------------------------------------------------- the on-call clock */

export const BEATS = [
  { time: "22:00", where: "Colombo", state: "ok", note: "on call" },
  { time: "23:40", where: "The office", state: "ok", note: "all green" },
  { time: "01:15", where: "In the cloud", state: "ok", note: "deploys flowing" },
  { time: "03:00", where: "Home", state: "page", note: "PAGED" },
  { time: "03:20", where: "The fix", state: "work", note: "mitigating" },
  { time: "09:30", where: "The lab", state: "ok", note: "resolved" },
  { time: "16:30", where: "Peradeniya", state: "ok", note: "postmortem" },
  { time: "18:10", where: "The rooftop", state: "ok", note: "all green" },
  { time: "18:30", where: "Hand-off", state: "ok", note: "resolved" },
] as const;

export function Clock({ active }: { active: number }) {
  const b = BEATS[Math.max(0, Math.min(BEATS.length - 1, active))];
  if (active <= 0) return null; // the cover stays clean
  return (
    <div className={`n-clock n-clock--${b.state}`} aria-hidden>
      <b key={b.time}>{b.time}</b>
      <span>
        <i /> {b.note}
      </span>
      <em>{b.where}</em>
    </div>
  );
}

/* ---------------------------------------------------------------- 23:40 · the terminal */

export function Terminal({ on, lines, title }: { on: boolean; lines: { cmd?: string; out?: string; ok?: boolean }[]; title: string }) {
  const flat = lines.map((l) => (l.cmd ? `$ ${l.cmd}` : l.out ?? ""));
  const typed = useTyped(flat, on, 14);
  return (
    <div className="n-term">
      <div className="n-term__bar">
        <i />
        <i />
        <i />
        <span>{title}</span>
      </div>
      <pre>
        {typed.map((t, i) => (
          <div key={i} className={lines[i].cmd ? "n-cmd" : lines[i].ok ? "n-ok" : "n-out"}>
            {lines[i].cmd || !/^\S+\s{2,}/.test(t) ? (
              t
            ) : (
              <>
                <strong>{t.split(/\s{2,}/)[0]}</strong>
                <span>{t.split(/\s{2,}/).slice(1).join("  ")}</span>
              </>
            )}
          </div>
        ))}
        <span className="n-caret" />
      </pre>
    </div>
  );
}

/* ---------------------------------------------------------------- 01:15 · the platform diagram */

export function Diagram({ on }: { on: boolean }) {
  return (
    <svg className={`n-diagram ${on ? "is-on" : ""}`} viewBox="0 0 560 300" role="img" aria-label="Pull-based platform: data planes dial out to the control plane">
      <defs>
        <marker id="n-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="currentColor" />
        </marker>
      </defs>
      <g className="n-d-links">
        <path d="M110 60 H185" markerEnd="url(#n-arr)" />
        <path d="M120 240 C 190 240, 220 170, 245 128" markerEnd="url(#n-arr)" className="n-d-flow" />
        <path d="M440 240 C 370 240, 340 170, 315 128" markerEnd="url(#n-arr)" className="n-d-flow" />
        <path d="M280 128 V 205" className="n-d-dash" />
      </g>
      <g className="n-d-nodes">
        <g transform="translate(20 38)">
          <rect width="90" height="44" rx="10" />
          <text x="45" y="27">Git</text>
        </g>
        <g transform="translate(185 30)" className="n-d-core">
          <rect width="190" height="98" rx="14" />
          <text x="95" y="34">Control plane</text>
          <text x="95" y="58" className="n-d-small">Argo Workflows · Events</text>
          <text x="95" y="78" className="n-d-small">Argo CD · External Secrets</text>
        </g>
        <g transform="translate(40 218)">
          <rect width="150" height="48" rx="10" />
          <text x="75" y="22">AKS data plane</text>
          <text x="75" y="38" className="n-d-small">Azure</text>
        </g>
        <g transform="translate(370 218)">
          <rect width="150" height="48" rx="10" />
          <text x="75" y="22">EKS data plane</text>
          <text x="75" y="38" className="n-d-small">AWS</text>
        </g>
        <g transform="translate(232 205)" className="n-d-badge">
          <rect width="96" height="30" rx="15" />
          <text x="48" y="20">0 inbound</text>
        </g>
      </g>
      <text x="190" y="190" className="n-d-label">dial out · mTLS</text>
    </svg>
  );
}

/* ---------------------------------------------------------------- 03:00 · the page */

export function Page({ on }: { on: boolean }) {
  const alerts = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className={`n-page ${on ? "is-on" : ""}`}>
      <div className="n-notif">
        <div className="n-notif__app">
          <span>PR</span> PageRewind · now
        </div>
        <b>CRITICAL · api latency p99 &gt; 2 s</b>
        <p>Incident #1 opened from 100 alerts. You are on call. Acknowledge?</p>
      </div>
      <div className="n-storm" aria-hidden>
        {alerts.map((i) => (
          <div key={i} className="n-alert" style={{ ["--i" as string]: i }}>
            <i /> HighLatency · pod api-{(7 * i + 3) % 97} · firing
          </div>
        ))}
        <div className="n-incident">
          <b>1 incident</b>
          <span>100 duplicate alerts · deduplicated</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 03:20 · the fix (real PRs) */

export function PRFeed({ on, items }: { on: boolean; items: { repo: string; ref: string; title: string; status: string; label: string; url: string }[] }) {
  return (
    <ul className={`n-prs ${on ? "is-on" : ""}`}>
      {items.map((c, i) => (
        <li key={c.repo + c.ref} style={{ ["--i" as string]: i }}>
          <a href={c.url} target="_blank" rel="noopener noreferrer">
            <span className={`n-badge n-badge--${c.status}`}>{c.label}</span>
            <span className="n-prs__repo">
              {c.repo} <em>{c.ref}</em>
            </span>
            <span className="n-prs__title">{c.title}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- 09:30 · git log of projects */

export function GitLog({ on, items }: { on: boolean; items: { sha: string; title: string; when: string; line: string; link?: string }[] }) {
  return (
    <div className={`n-log ${on ? "is-on" : ""}`}>
      <div className="n-term__bar">
        <i />
        <i />
        <i />
        <span>~/projects — git log --oneline</span>
      </div>
      <ul>
        {items.map((p, i) => (
          <li key={p.title} style={{ ["--i" as string]: i }}>
            <code>{p.sha}</code>
            <div>
              <b>
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noopener noreferrer">
                    {p.title} ↗
                  </a>
                ) : (
                  p.title
                )}
              </b>
              <span>{p.line}</span>
            </div>
            <em>{p.when}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- 16:30 · the postmortem */

export function Postmortem({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <article className={`n-doc ${on ? "is-on" : ""}`}>
      <header>
        <span>POSTMORTEM</span>
        <span>Status: resolved</span>
      </header>
      {children}
    </article>
  );
}

/* ---------------------------------------------------------------- 18:10 · kubectl get skills */

export function Skills({ on, groups }: { on: boolean; groups: [string, readonly string[]][] }) {
  return (
    <div className={`n-term n-skills ${on ? "is-on" : ""}`}>
      <div className="n-term__bar">
        <i />
        <i />
        <i />
        <span>kubectl get skills -n yohan</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>NAMESPACE</th>
            <th>READY</th>
            <th>SKILLS</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(([g, items], i) => (
            <tr key={g} style={{ ["--i" as string]: i }}>
              <td>{g.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</td>
              <td className="n-ok">
                {items.length}/{items.length}
              </td>
              <td>{items.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
