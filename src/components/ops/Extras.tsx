import { useMemo, useRef, useState, type ReactNode } from "react";

function SectionHead({ n, tag, title, lead }: { n: string; tag: string; title: string; lead?: string }) {
  return (
    <div className="ops-head rv">
      <span className="ops-bignum" aria-hidden="true">{n}</span>
      <div className="ops-eyebrow">
        {n} <b>/</b> {tag}
      </div>
      <h2 className="ops-h2">{title}</h2>
      {lead && <p className="ops-lead">{lead}</p>}
    </div>
  );
}

const values = [
  {
    icon: "⚙",
    title: "Make operations boring",
    line: "The best incident is the one automation already handled.",
    evidence: [
      "Replaced manual, per-service certificate signing with an automated CA-signed pipeline for 20+ microservices.",
      "Wrote a generator that builds the Argo pipeline files from one registry instead of editing each by hand.",
    ],
  },
  {
    icon: "🔒",
    title: "Secure by default",
    line: "Least privilege on day one, not after the audit.",
    evidence: [
      "Designed the CI/CD platform so production accepts no inbound connections.",
      "Swapped personal access tokens for Workload Identity Federation, and inline secrets for External Secrets Operator.",
    ],
  },
  {
    icon: "📖",
    title: "If it isn't written down, it isn't done",
    line: "Someone else should be able to run what I build.",
    evidence: [
      "Closed the internship with a knowledge-transfer session and a handover document.",
      "Wrote runbooks for my reliability lab and four engineering articles on Medium.",
    ],
  },
  {
    icon: "🔁",
    title: "Fix it at the source",
    line: "When a tool has a gap, I report it and send the fix upstream.",
    evidence: [
      "Filed two issues and opened two pull requests to Argo Workflows; the docs fix is approved.",
      "Contributed Terraform modules to WSO2's public module libraries (3 merged).",
    ],
  },
  {
    icon: "🎓",
    title: "Teach what I learn",
    line: "Explaining something is how I check I really understand it.",
    evidence: [
      "Taught and mentored 40+ students in database systems and C programming.",
      "Ran content for a 200+ member technical community as Hackers' Club editor.",
    ],
  },
  {
    icon: "🎯",
    title: "Start before it's easy",
    line: "If the thing doesn't exist yet, build it.",
    evidence: [
      "Founded air gun shooting as a university sport and built a team from every faculty.",
      "Captained it for two years and led it to the 2024 Inter-University Air Rifle Championship title.",
    ],
  },
];

export function Values({ n }: { n: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  return (
    <section id="values" className="ops-wrap ops-sec">
      <SectionHead
        n={n}
        tag="how i work"
        title="Values, with receipts"
        lead="Anyone can list values. Open a card to see the evidence behind each one."
      />
      <div className="ops-values-bar rv">
        <button className={`ops-toggle ${all ? "on" : ""}`} onClick={() => setAll((a) => !a)} aria-pressed={all}>
          <span className="sw" aria-hidden="true" />
          show all evidence
        </button>
      </div>
      <div className="ops-values">
        {values.map((v, i) => {
          const isOpen = all || open === i;
          return (
            <div className="rv" key={v.title} style={{ transitionDelay: `${i * 0.05}s` }}>
            <button
              className={`ops-value ${isOpen ? "open" : ""}`}
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="ic" aria-hidden="true">{v.icon}</span>
              <span className="tt">{v.title}</span>
              <span className="ln">{v.line}</span>
              <span className="ev">
                <span className="cmd">$ cat evidence.log</span>
                {v.evidence.map((e) => (
                  <span className="it" key={e}>
                    <span className="ok">✓</span> {e}
                  </span>
                ))}
              </span>
              <span className="hint">{isOpen ? "hide evidence ▴" : "show evidence ▾"}</span>
            </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const trophies = [
  { tier: "gold", place: "Champions", title: "Inter-University Air Rifle Championship", sub: "Men's team · plus Magam Shooting Sports Colours", date: "Aug 2024" },
  { tier: "bronze", place: "3rd Place", title: "ICIIS 2025 (I-To-I)", sub: "P-E-BO desk companion", date: "2025" },
  { tier: "final", place: "Top 10", title: "IESL Undergraduate Inventor of the Year", sub: "Finalist · P-E-BO desk companion", date: "2025" },
  { tier: "plain", place: "9th Place", title: "Coders V11.0", sub: "ACES, University of Peradeniya", date: "Oct 2024" },
  { tier: "plain", place: "27th Place", title: "MoraExtreme 9.0", sub: "IEEE, University of Moratuwa", date: "Oct 2024" },
  { tier: "plain", place: "Award", title: "Best Event Marketer", sub: "AIESEC, University of Peradeniya", date: "Feb 2024" },
];

const roles = [
  { stat: "40+", unit: "students", title: "Casual Instructor", org: "Dept. of Computer Engineering, Peradeniya", when: "Nov 2024 – Aug 2025" },
  { stat: "200+", unit: "members", title: "Editor", org: "Hackers' Club, Peradeniya", when: "Aug 2025 – Jul 2026" },
  { stat: "3", unit: "roles", title: "Brand Manager · OC Vice President · Team Leader", org: "AIESEC in Kandy", when: "Feb 2022 – Nov 2024" },
  { stat: "Rs", unit: "finances", title: "Finance Vice Chair", org: "Career Compass, IEEE Young Professionals Sri Lanka", when: "Apr – Sep 2025" },
  { stat: "★", unit: "workshops", title: "Programming Team Member", org: "IEEE CS Student Chapter, Peradeniya", when: "Jul 2024 – Nov 2025" },
  { stat: "⛰", unit: "expeditions", title: "Senior Member", org: "University Explorers' Club, Peradeniya", when: "Jul 2024 – Present" },
];

const journey = [
  { y: "2023", t: "Started it", d: "Founded air gun shooting as a university sport and recruited from every faculty." },
  { y: "2023–25", t: "Captained it", d: "Team Captain of the Shooting Sports Association for two years." },
  { y: "2024", t: "Won it", d: "Inter-University Air Rifle Championship, men's team champions, plus Magam Shooting Sports Colours." },
];

function TargetGame() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shots, setShots] = useState<{ x: number; y: number; s: number }[]>([]);
  const max = 5;

  const shoot = (cx: number, cy: number) => {
    const el = ref.current;
    if (!el || shots.length >= max) return;
    const r = el.getBoundingClientRect();
    const x = (cx - r.left) / r.width + (Math.random() - 0.5) * 0.12;
    const y = (cy - r.top) / r.height + (Math.random() - 0.5) * 0.12;
    const d = Math.hypot(x - 0.5, y - 0.5) / 0.5;
    const score = d >= 1 ? 0 : Math.round(10.9 * Math.pow(1 - d, 1.35) * 10) / 10;
    setShots((v) => [...v, { x, y, s: score }]);
  };

  const total = shots.reduce((a, b) => a + b.s, 0);
  const done = shots.length >= max;
  const last = shots[shots.length - 1];
  const great = done && total >= 40;
  const confetti = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.6 + Math.random() * 1.2,
        rot: Math.random() * 360,
        color: ["#3ddc97", "#4cc9f0", "#f5b942", "#ff6b6b", "#8c6eff"][i % 5],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [great],
  );

  return (
    <div className="ops-tgame">
      {great && (
        <div className="ops-confetti" aria-hidden="true">
          {confetti.map((p, i) => (
            <i
              key={i}
              style={{
                left: `${p.left}%`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.dur}s`,
                transform: `rotate(${p.rot}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <div
        className={`ops-target ${done ? "done" : ""}`}
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label="Air rifle target. Click to shoot."
        onClick={(e) => shoot(e.clientX, e.clientY)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          const r = ref.current?.getBoundingClientRect();
          if (r) shoot(r.left + r.width * (0.5 + (Math.random() - 0.5) * 0.3), r.top + r.height * (0.5 + (Math.random() - 0.5) * 0.3));
        }}
      >
        <div className="ring r1" />
        <div className="ring r2" />
        <div className="ring r3" />
        <div className="ring r4" />
        <div className="bull" />
        {shots.map((h, i) => (
          <span key={i} className="hole" style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }} />
        ))}
      </div>
      <div className="ops-tgame-score">
        <div>
          <span>shots {shots.length}/{max}</span>
          <b>{total.toFixed(1)}</b>
        </div>
        <small>
          {shots.length === 0
            ? "Click the target to shoot. It sways and your hand shakes, like the real thing."
            : done
              ? great
                ? "🎯 Sharpshooter! You should try out for the team."
                : total >= 28
                  ? "Solid grouping. Score 40+ to unlock the celebration."
                  : "Harder than it looks, right? Score 40+ to win."
              : `last shot: ${last.s.toFixed(1)}`}
        </small>
        {done && (
          <button className="ops-reload" onClick={() => setShots([])}>
            reload ↺
          </button>
        )}
      </div>
    </div>
  );
}

export function OffCall({ n, children }: { n: string; children?: ReactNode }) {
  const [step, setStep] = useState(2);
  return (
    <section id="offcall" className="ops-band">
      <div className="ops-wrap ops-sec">
        <SectionHead
          n={n}
          tag="off-call"
          title="Life off-call"
          lead="A sport I started from nothing, a few trophies, the communities I help run, and a side quest. Take a shot at the target while you are here."
        />

        <div className="ops-feature rv">
          <div className="ops-feature-l">
            <div className="ops-eyebrow">featured story</div>
            <h3>From zero to champions</h3>
            <p>
              There was no air gun shooting at the university, so I started it. I built a team from
              every faculty, captained it for two years, and in 2024 we won the Inter-University Air
              Rifle Championship.
            </p>
            <div className="ops-steps" role="tablist" aria-label="Shooting team journey">
              {journey.map((j, i) => (
                <button
                  key={j.y}
                  role="tab"
                  aria-selected={step === i}
                  className={i <= step ? "on" : ""}
                  onClick={() => setStep(i)}
                >
                  <span className="dot" />
                  <span className="y">{j.y}</span>
                  <span className="t">{j.t}</span>
                </button>
              ))}
            </div>
            <p className="ops-step-d" key={step}>{journey[step].d}</p>
          </div>
          <TargetGame />
        </div>

        <div className="ops-sub rv">trophy cabinet</div>
        <div className="ops-trophies">
          {trophies.map((t, i) => (
            <div className={`ops-trophy ${t.tier} rv`} key={t.title} style={{ transitionDelay: `${i * 0.05}s` }}>
              <div className="pl">
                {t.tier === "gold" ? "🏆 " : t.tier === "bronze" ? "🥉 " : t.tier === "final" ? "🏅 " : ""}
                {t.place}
              </div>
              <div className="tt">{t.title}</div>
              <div className="sb">{t.sub}</div>
              <div className="dt">{t.date}</div>
            </div>
          ))}
        </div>

        <div className="ops-sub rv">leadership and community</div>
        <div className="ops-roles">
          {roles.map((r, i) => (
            <div className="ops-role rv" key={r.title} style={{ transitionDelay: `${i * 0.05}s` }}>
              <div className="st">
                <b>{r.stat}</b>
                <span>{r.unit}</span>
              </div>
              <div>
                <div className="tt">{r.title}</div>
                <div className="og">{r.org}</div>
                <div className="wh">{r.when}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="ops-interests rv">
          <span>also into</span>
          <b>🥾 hiking and expeditions</b>
          <b>📷 photography</b>
          <b>🎬 video editing</b>
          <b>🔧 building hardware</b>
        </div>

        {children}
      </div>
    </section>
  );
}
