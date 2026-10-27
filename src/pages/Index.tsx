import "@/ops.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { OffCall, Values } from "@/components/ops/Extras";
import { SecretGame, Writing } from "@/components/ops/Chill";
import { OpenToWork } from "@/components/ops/Badge";
import { FileDown, Github, Linkedin } from "lucide-react";
import { medium } from "@/content/fun";
import {
  contributions,
  metrics,
  projectBadge,
  statusAsOf,
  statusLabel,
} from "@/content/ops";

const sections = [
  { id: "overview", label: "Home" },
  { id: "featured", label: "Featured" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "values", label: "Values" },
  { id: "contributions", label: "Contributions" },
  { id: "writing", label: "Writing" },
  { id: "skills", label: "Skills" },
  { id: "offcall", label: "Off-call" },
  { id: "contact", label: "Contact" },
];

type AnyRecord = Record<string, unknown>;
const field = (o: object, k: string) =>
  (o as AnyRecord)[k] as string | undefined;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return { ref, seen };
}

function useScrollState() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      let idx = 0;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4)
          idx = i;
      });
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return { active, progress };
}

function TopBar({ active, progress }: { active: number; progress: number }) {
  return (
    <header className="ops-bar">
      <div className="ops-wrap ops-bar-in">
        <a href="#overview" className="ops-prompt" aria-label="Back to top">
          yohan<i>@</i>sre<i>:~$</i>
          <span className="ops-caret" aria-hidden="true" />
        </a>
        <nav className="ops-nav" aria-label="Sections">
          {sections.map((n, i) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={i === active ? "on" : ""}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <OpenToWork />
      </div>
      <div
        className="ops-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
    </header>
  );
}

function BackgroundMesh() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const LINK = 150;
    type Node = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      hub: boolean;
      pulse: number;
    };
    type Packet = {
      a: number;
      b: number;
      t: number;
      speed: number;
      hops: number;
      color: string;
    };
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let packets: Packet[] = [];
    let raf = 0;
    let scroll = 0;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.max(28, Math.min(95, (w * h) / 15000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        hub: Math.random() < 0.12,
        pulse: Math.random() * Math.PI * 2,
      }));
      packets = [];
    };

    const neighbour = (i: number) => {
      const n = nodes[i];
      const near: number[] = [];
      nodes.forEach((m, j) => {
        if (j !== i && (m.x - n.x) ** 2 + (m.y - n.y) ** 2 < LINK * LINK)
          near.push(j);
      });
      return near.length ? near[Math.floor(Math.random() * near.length)] : -1;
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      const shift = (scroll * 0.08) % h;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y - shift;
        const d2 = dx * dx + dy * dy;
        if (d2 < 220 * 220) {
          n.x += dx * 0.0016;
          n.y += dy * 0.0016;
        }
        n.pulse += 0.03;
      }

      const py = (y: number) => {
        const v = y - shift;
        return v < -20 ? v + h + 40 : v;
      };

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (d2 < LINK * LINK) {
            const alpha = (1 - Math.sqrt(d2) / LINK) * 0.22;
            ctx.strokeStyle = `rgba(76,201,240,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, py(a.y));
            ctx.lineTo(b.x, py(b.y));
            ctx.stroke();
          }
        }
        const dx = mouse.x - a.x;
        const dy = mouse.y - py(a.y);
        const md = Math.sqrt(dx * dx + dy * dy);
        if (md < 190) {
          ctx.strokeStyle = `rgba(61,220,151,${(1 - md / 190) * 0.55})`;
          ctx.beginPath();
          ctx.moveTo(a.x, py(a.y));
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      if (packets.length < 16 && Math.random() < 0.09) {
        const a = Math.floor(Math.random() * nodes.length);
        const b = neighbour(a);
        if (b >= 0)
          packets.push({
            a,
            b,
            t: 0,
            speed: 0.012 + Math.random() * 0.02,
            hops: 2 + Math.floor(Math.random() * 5),
            color:
              Math.random() < 0.7
                ? "61,220,151"
                : Math.random() < 0.5
                  ? "76,201,240"
                  : "245,185,66",
          });
      }
      packets = packets.filter((p) => {
        p.t += p.speed;
        const A = nodes[p.a];
        const B = nodes[p.b];
        if (!A || !B) return false;
        if (p.t >= 1) {
          if (p.hops <= 0) return false;
          const next = neighbour(p.b);
          if (next < 0) return false;
          p.a = p.b;
          p.b = next;
          p.t = 0;
          p.hops -= 1;
          return true;
        }
        const x = A.x + (B.x - A.x) * p.t;
        const y = py(A.y + (B.y - A.y) * p.t);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, `rgba(${p.color},0.95)`);
        g.addColorStop(1, `rgba(${p.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      for (const n of nodes) {
        const y = py(n.y);
        if (n.hub) {
          const r = 2.6 + Math.sin(n.pulse) * 0.8;
          ctx.fillStyle = "rgba(61,220,151,0.12)";
          ctx.beginPath();
          ctx.arc(n.x, y, r * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(61,220,151,0.9)";
          ctx.beginPath();
          ctx.arc(n.x, y, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(160,190,215,0.45)";
          ctx.beginPath();
          ctx.arc(n.x, y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = () => {
      frame();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onScroll = () => {
      scroll = window.scrollY;
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) frame();
    else raf = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      <div className="ops-aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <canvas ref={ref} className="ops-bg" aria-hidden="true" />
    </>
  );
}

function Scramble({ text, delay = 0 }: { text: string; delay?: number }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = "!<>-_\\/[]{}=+*^?#01";
    const start = performance.now() + delay;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.max(0, (t - start) / 900);
      const done = Math.floor(p * text.length);
      setOut(
        text
          .split("")
          .map((c, i) =>
            i < done || c === " "
              ? c
              : chars[Math.floor(Math.random() * chars.length)],
          )
          .join(""),
      );
      if (done < text.length) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay]);
  return <>{out}</>;
}

type TermLine = { kind: "cmd" | "out" | "fetch"; text: string };
const script: TermLine[] = [
  { kind: "cmd", text: "neofetch" },
  { kind: "fetch", text: "" },
  { kind: "cmd", text: "kubectl get pods -n yohan" },
  { kind: "out", text: "NAME                   READY  STATUS" },
  { kind: "out", text: "multicloud-cicd        1/1    Completed" },
  { kind: "out", text: "pki-cert-automation    1/1    Completed" },
  { kind: "out", text: "reliability-lab        1/1    Running" },
  { kind: "out", text: "private-5g-core        1/1    Running" },
  { kind: "out", text: "cka                    0/1    ContainerCreating" },
];

const fetchInfo: [string, string][] = [
  ["Role", "Ex-SRE Intern @ WSO2"],
  ["Degree", "BSc Eng, Computer Eng."],
  ["Uni", "University of Peradeniya"],
  ["Focus", "Kubernetes · CI/CD · IaC"],
  ["Clouds", "AWS · Azure"],
  ["Location", "Colombo, LK"],
  ["Status", "open to SRE / DevOps"],
];

function colorize(text: string) {
  const parts = text.split(/(Running|Completed|ContainerCreating)/);
  return parts.map((p, i) =>
    p === "Running" || p === "Completed" ? (
      <span key={i} className="g">
        {p}
      </span>
    ) : p === "ContainerCreating" ? (
      <span key={i} className="a">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function Fetch() {
  return (
    <div className="ops-fetch">
      <div className="ops-fetch-img">
        <img src="/me.jpg" alt="Yohan Senadheera" width={686} height={744} />
      </div>
      <div className="ops-fetch-info">
        <div className="hd">
          <span className="c">yohan</span>@<span className="c">sre</span>
        </div>
        <div className="rule">-------------------</div>
        {fetchInfo.map(([k, v]) => (
          <div key={k}>
            <span className="k">{k}:</span> {v}
          </div>
        ))}
        <div className="ops-fetch-cols" aria-hidden="true">
          {["#ff6b6b", "#f5b942", "#3ddc97", "#4cc9f0", "#8c6eff", "#d8e0ea"].map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TypingTerminal() {
  const reduced = usePrefersReducedMotion();
  const [lineIdx, setLineIdx] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (reduced) {
      setLineIdx(script.length);
      return;
    }
    if (lineIdx >= script.length) return;
    const line = script[lineIdx];
    let t: number;
    if (line.kind === "cmd" && chars < line.text.length) {
      t = window.setTimeout(() => setChars((c) => c + 1), 45 + Math.random() * 45);
    } else {
      const pause = line.kind === "cmd" ? 450 : line.kind === "fetch" ? 900 : 140;
      t = window.setTimeout(() => {
        setLineIdx((i) => i + 1);
        setChars(0);
      }, pause);
    }
    return () => window.clearTimeout(t);
  }, [lineIdx, chars, reduced]);

  const done = lineIdx >= script.length;
  return (
    <div className="ops-term ops-hero-term">
      <div className="ops-term-h">
        <i />
        <i />
        <i />
        <span>yohan@sre: ~</span>
      </div>
      <div className="ops-term-b ops-pre" aria-label="Terminal introducing Yohan and his projects">
        {script.slice(0, Math.min(lineIdx + 1, script.length)).map((l, i) => {
          const typing = i === lineIdx && !done;
          if (l.kind === "cmd") {
            const text = typing ? l.text.slice(0, chars) : l.text;
            return (
              <div key={i}>
                <span className="g">$ </span>
                <span className="v">{text}</span>
                {typing && <span className="ops-caret" />}
              </div>
            );
          }
          if (typing) return null;
          if (l.kind === "fetch") return <Fetch key={i} />;
          return (
            <div key={i} className="o">
              {colorize(l.text)}
            </div>
          );
        })}
        {done && (
          <div>
            <span className="g">$ </span>
            <span className="ops-caret" />
          </div>
        )}
      </div>
    </div>
  );
}

function MediumIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="6.8" cy="12" r="6.2" />
      <ellipse cx="16.6" cy="12" rx="3.1" ry="5.8" />
      <ellipse cx="21.7" cy="12" rx="1.2" ry="5.2" />
    </svg>
  );
}

function Hero() {
  return (
    <section id="overview" className="ops-wrap ops-hero ops-sec">
      <div className="rv">
        <div className="ops-kicker">
          ● Colombo, Sri Lanka · Computer Engineering, University of Peradeniya
        </div>
        <h1 className="ops-name" aria-label="Yohan Senadheera">
          <Scramble text="Yohan" />{" "}
          <span>
            <Scramble text="Senadheera" delay={250} />
          </span>
        </h1>
        <p className="ops-intro">
          I like systems that run themselves: pipelines nobody has to babysit,
          certificates that renew on their own, clusters that heal after a crash.
          I've built that kind of thing at WSO2, run a private 5G core on
          Kubernetes, developed the app for an award-winning AI desk robot, taught
          40+ students, and started a university shooting team that went on to win
          the inter-university title.
        </p>
        <div className="ops-now" aria-label="Right now">
          <span className="t">now</span>
          <span>final year, Computer Engineering</span>
          <span>preparing for CKA</span>
          <span>open to SRE · DevOps · Cloud roles</span>
        </div>
        <div className="ops-cta">
          <a className="ops-btn primary" href={profile.cvUrl} target="_blank" rel="noopener noreferrer">
            <FileDown size={17} aria-hidden="true" /> CV
          </a>
          <a className="ops-btn ghost" href={profile.github} target="_blank" rel="noopener noreferrer">
            <Github size={17} aria-hidden="true" /> GitHub
          </a>
          <a className="ops-btn ghost" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin size={17} aria-hidden="true" /> LinkedIn
          </a>
          <a className="ops-btn ghost" href={medium.profile} target="_blank" rel="noopener noreferrer">
            <MediumIcon size={17} /> Medium
          </a>
        </div>
        <div className="ops-jump">
          <span>jump to</span>
          <a href="#skills">my skills →</a>
          <a href="#projects">projects &amp; labs →</a>
          <a href="#offcall">life off-call →</a>
        </div>
      </div>
      <div className="rv ops-hero-r" style={{ transitionDelay: "0.15s" }}>
        <TypingTerminal />
      </div>
    </section>
  );
}

function Counter({ value, run }: { value: string; run: boolean }) {
  const m = value.match(/^(\d+)(.*)$/);
  const target = m ? parseInt(m[1], 10) : 0;
  const suffix = m ? m[2] : "";
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!m) return;
    if (!run) return;
    if (reduced) {
      setN(target);
      return;
    }
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, target, reduced]);
  if (!m) return <>{value}</>;
  return (
    <>
      {n}
      {suffix}
    </>
  );
}

function Metrics() {
  const { ref, seen } = useInView<HTMLDivElement>(0.3);
  return (
    <div className="ops-bento" ref={ref} aria-label="Key numbers">
      {metrics.map((m) => {
        const big = "big" in m && m.big;
        return (
          <div className={`ops-metric rv ${big ? "big" : ""}`} key={m.label}>
            <div className="val">
              <Counter value={m.value} run={seen} />
            </div>
            <div className="lab">{m.label}</div>
            <div className="note">{m.note}</div>
            {big && (
              <div className="ops-spark" aria-hidden="true">
                {Array.from({ length: 28 }).map((_, i) => (
                  <i
                    key={i}
                    style={{ height: `${18 + ((i * 37) % 70)}%`, animationDelay: `${i * 0.04}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Head({
  n,
  tag,
  title,
  lead,
}: {
  n: string;
  tag: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="ops-head rv">
      <span className="ops-bignum" aria-hidden="true">
        {n}
      </span>
      <div className="ops-eyebrow">
        {n} <b>/</b> {tag}
      </div>
      <h2 className="ops-h2">{title}</h2>
      {lead && <p className="ops-lead">{lead}</p>}
    </div>
  );
}

const archInfo: Record<string, { t: string; d: string }> = {
  git: {
    t: "Git: the desired state",
    d: "Pipeline definitions and environment config live in Git. Argo CD syncs clusters from it, so a rollback is a revert.",
  },
  wf: {
    t: "Argo Workflows",
    d: "Runs the build and deploy steps. A generator I wrote produces the dispatcher, executor and sensor files from a single pipeline registry.",
  },
  ev: {
    t: "Argo Events",
    d: "Turns triggers into workflow runs, so pipelines start from events instead of someone pushing from outside.",
  },
  cd: {
    t: "Argo CD",
    d: "GitOps controller that keeps clusters matched to what is in Git.",
  },
  eso: {
    t: "External Secrets Operator",
    d: "Replaced 50+ inline sed-based secret injections. Secrets sync from Azure Key Vault and AWS Secrets Manager through workload identity.",
  },
  nats: {
    t: "NATS bus over mutual TLS",
    d: "The message bus between control plane and data planes. Both sides present certificates, and the data planes start the connection.",
  },
  aks: {
    t: "AKS data plane (Azure)",
    d: "Private cluster reached through Azure Bastion, with Entra ID SSO limited to approved groups. Dials out; accepts nothing inbound.",
  },
  eks: {
    t: "EKS data plane (AWS)",
    d: "Validated end to end like AKS, so the same pipelines run on both clouds.",
  },
  onprem: {
    t: "On-premises data plane (planned)",
    d: "Designed to plug in the same way. Not built yet.",
  },
};

function Architecture() {
  const [sel, setSel] = useState("nats");
  const reduced = usePrefersReducedMotion();
  const planeY = [34, 144, 254];
  const planes = [
    { id: "aks", name: "AKS data plane", note: "Azure", planned: false },
    { id: "eks", name: "EKS data plane", note: "AWS", planned: false },
    {
      id: "onprem",
      name: "On-prem data plane",
      note: "planned",
      planned: true,
    },
  ];
  const pick = (id: string) => ({
    onClick: () => setSel(id),
    onMouseEnter: () => setSel(id),
    onFocus: () => setSel(id),
    onKeyDown: (e: React.KeyboardEvent) =>
      (e.key === "Enter" || e.key === " ") && setSel(id),
    tabIndex: 0,
    role: "button",
    className: `hit ${sel === id ? "sel" : ""}`,
    "aria-label": archInfo[id].t,
  });
  const inner = [
    { id: "wf", t: "Argo Workflows" },
    { id: "ev", t: "Argo Events" },
    { id: "cd", t: "Argo CD" },
    { id: "eso", t: "External Secrets" },
  ];
  return (
    <section id="featured" className="ops-wrap ops-sec">
      <Head
        n="01"
        tag="featured"
        title="Featured work"
        lead="The highlights first. Every number here is backed by a public pull request, my CV or my writing."
      />
      <Metrics />
      <div className="ops-feat-sub rv">
        <span className="ops-eyebrow">featured build</span>
        <h3>A pull-based CI/CD platform where nothing opens inbound into production</h3>
        <p>
          Worked on at WSO2 to move deployment pipelines from Azure DevOps to Argo.
          Hover or tap any component to see what it does.
        </p>
      </div>
      <div className="ops-arch rv">
        <div className="ops-card ops-arch-svg">
          <div className="ops-hint">swipe to see the full diagram →</div>
          <div className="ops-diagram-scroll">
            <svg
              className="ops-diagram"
              viewBox="0 0 900 340"
              role="group"
              aria-label="Architecture diagram"
            >
              <defs>
                <marker
                  id="arr"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#3ddc97" />
                </marker>
                <marker
                  id="arrc"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#4cc9f0" />
                </marker>
              </defs>

              <g {...pick("git")}>
                <rect
                  className="box"
                  x="12"
                  y="140"
                  width="120"
                  height="62"
                  rx="10"
                />
                <text x="72" y="167" textAnchor="middle" fontWeight="700">
                  Git
                </text>
                <text x="72" y="187" textAnchor="middle" className="small">
                  desired state
                </text>
              </g>
              <path
                className="flow git"
                d="M132 171 L186 171"
                markerEnd="url(#arrc)"
              />

              <rect
                className="cp"
                x="190"
                y="24"
                width="300"
                height="296"
                rx="14"
              />
              <text x="340" y="52" textAnchor="middle" fontWeight="700">
                Control plane
              </text>
              <text x="340" y="70" textAnchor="middle" className="small">
                Kubernetes · multi-AZ · HA in Terraform
              </text>
              {inner.map((b, i) => (
                <g key={b.id} {...pick(b.id)}>
                  <rect
                    className="box"
                    x="218"
                    y={90 + i * 54}
                    width="244"
                    height="40"
                    rx="8"
                  />
                  <text
                    x="340"
                    y={115 + i * 54}
                    textAnchor="middle"
                    fontSize="14"
                  >
                    {b.t}
                  </text>
                </g>
              ))}

              <g {...pick("nats")}>
                <rect
                  className="bus"
                  x="530"
                  y="24"
                  width="40"
                  height="296"
                  rx="10"
                />
                <text
                  x="550"
                  y="176"
                  textAnchor="middle"
                  className="mono"
                  transform="rotate(-90 550 176)"
                >
                  NATS bus · mutual TLS
                </text>
              </g>
              <path className="flow git" d="M490 171 L526 171" />

              {planes.map((p, i) => (
                <g key={p.id}>
                  <g {...pick(p.id)}>
                    <rect
                      className={p.planned ? "planned" : "dp"}
                      x="650"
                      y={planeY[i]}
                      width="236"
                      height="66"
                      rx="10"
                    />
                    <text
                      x="768"
                      y={planeY[i] + 29}
                      textAnchor="middle"
                      fontWeight="700"
                      opacity={p.planned ? 0.6 : 1}
                    >
                      {p.name}
                    </text>
                    <text
                      x="768"
                      y={planeY[i] + 49}
                      textAnchor="middle"
                      className="small"
                    >
                      {p.note}
                    </text>
                  </g>
                  {!p.planned && (
                    <>
                      <path
                        className="flow"
                        d={`M648 ${planeY[i] + 33} L574 ${planeY[i] + 33}`}
                        markerEnd="url(#arr)"
                      />
                      <text
                        x="611"
                        y={planeY[i] + 25}
                        textAnchor="middle"
                        className="small"
                      >
                        dials out
                      </text>
                      {!reduced && (
                        <circle r="4" className="pkt">
                          <animateMotion
                            dur="1.6s"
                            begin={`${i * 0.5}s`}
                            repeatCount="indefinite"
                            path={`M648 ${planeY[i] + 33} L574 ${planeY[i] + 33}`}
                          />
                        </circle>
                      )}
                    </>
                  )}
                </g>
              ))}
              {!reduced && (
                <circle r="4" className="pkt c">
                  <animateMotion
                    dur="2.2s"
                    repeatCount="indefinite"
                    path="M132 171 L186 171"
                  />
                </circle>
              )}
            </svg>
          </div>
        </div>
        <div className="ops-card ops-arch-info" aria-live="polite">
          <div className="ops-eyebrow">component</div>
          <h3>{archInfo[sel].t}</h3>
          <p>{archInfo[sel].d}</p>
          <div className="ops-arch-facts">
            <div>
              <b>Zero inbound</b>data planes open every connection
            </div>
            <div>
              <b>Validated</b>end to end on EKS and AKS
            </div>
            <div>
              <b>Modules</b>Argo Terraform modules in review in WSO2's public
              repos
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Phase = "ready" | "terminating" | "pending" | "starting";
type Pod = { id: string; phase: Phase };
type Ev = { t: string; msg: string; kind: "kill" | "info" | "ok" | "alert" };

const rid = () => Math.random().toString(36).slice(2, 7);
const now = () => new Date().toLocaleTimeString([], { hour12: false });

function ChaosLab() {
  const [pods, setPods] = useState<Pod[]>(() =>
    [0, 1, 2].map(() => ({ id: `api-${rid()}`, phase: "ready" })),
  );
  const [events, setEvents] = useState<Ev[]>([
    { t: now(), msg: "deployment/api: 3/3 replicas ready", kind: "ok" },
  ]);
  const [served, setServed] = useState(0);
  const timers = useRef<number[]>([]);
  const alerting = useRef(false);

  const log = useCallback((msg: string, kind: Ev["kind"]) => {
    setEvents((e) => [{ t: now(), msg, kind }, ...e].slice(0, 9));
  }, []);

  useEffect(() => {
    const iv = window.setInterval(
      () => setServed((s) => s + 7 + Math.floor(Math.random() * 6)),
      250,
    );
    const ts = timers.current;
    return () => {
      window.clearInterval(iv);
      ts.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const ready = pods.filter((p) => p.phase === "ready").length;

  useEffect(() => {
    if (ready < 3 && !alerting.current) {
      alerting.current = true;
      const t = window.setTimeout(
        () =>
          log(`ALERT ApiReplicasDegraded firing (${ready}/3 ready)`, "alert"),
        500,
      );
      timers.current.push(t);
    }
    if (ready === 3 && alerting.current) {
      alerting.current = false;
      log("ALERT ApiReplicasDegraded resolved (3/3 ready)", "ok");
      log("no failed requests: traffic only reached Ready pods", "ok");
    }
  }, [ready, log]);

  const later = (ms: number, fn: () => void) =>
    timers.current.push(window.setTimeout(fn, ms));

  const kill = (id: string) => {
    const pod = pods.find((p) => p.id === id);
    if (!pod || pod.phase !== "ready") return;
    const fresh = `api-${rid()}`;
    setPods((ps) =>
      ps.map((p) => (p.id === id ? { ...p, phase: "terminating" } : p)),
    );
    log(`chaos: killed pod/${id}`, "kill");
    later(900, () => {
      setPods((ps) =>
        ps.map((p) => (p.id === id ? { id: fresh, phase: "pending" } : p)),
      );
      log(`replicaset/api created pod/${fresh}`, "info");
    });
    later(1700, () => {
      setPods((ps) =>
        ps.map((p) => (p.id === fresh ? { ...p, phase: "starting" } : p)),
      );
      log(
        `pod/${fresh}: container started, waiting for readiness probe`,
        "info",
      );
    });
    later(3000, () => {
      setPods((ps) =>
        ps.map((p) => (p.id === fresh ? { ...p, phase: "ready" } : p)),
      );
      log(`pod/${fresh}: readiness probe passed, added to service`, "ok");
    });
  };

  const killRandom = () => {
    const live = pods.filter((p) => p.phase === "ready");
    if (live.length) kill(live[Math.floor(Math.random() * live.length)].id);
  };

  const label: Record<Phase, string> = {
    ready: "Running",
    terminating: "Terminating",
    pending: "Pending",
    starting: "ContainerCreating",
  };

  return (
    <div id="chaos" className="ops-embed">
        <div className="ops-sub rv">lab · try it</div>
        <h3 className="ops-embed-h rv">Break something. Watch it heal.</h3>
        <p className="ops-embed-p rv">
          A simulation of the self-healing in my reliability lab: kill a pod and
          Kubernetes replaces it, the readiness probe keeps traffic away until it is
          ready, and the alert fires and resolves on its own.
        </p>
        <div className="ops-chaos rv">
          <div className="ops-card">
            <div className="ops-chaos-top">
              <div>
                <div className="ops-eyebrow">deployment/api</div>
                <div className={`ops-health ${ready === 3 ? "ok" : "bad"}`}>
                  {ready}/3 ready · {ready === 3 ? "healthy" : "degraded"}
                </div>
              </div>
              <button className="ops-btn danger" onClick={killRandom}>
                kill a random pod
              </button>
            </div>
            <div className="ops-pods">
              {pods.map((p) => (
                <button
                  key={p.id}
                  className={`ops-pod ${p.phase}`}
                  onClick={() => kill(p.id)}
                  disabled={p.phase !== "ready"}
                  aria-label={`${p.id} ${label[p.phase]}${p.phase === "ready" ? ", click to kill" : ""}`}
                >
                  <span className="pn">{p.id}</span>
                  <span className="ps">{label[p.phase]}</span>
                  {p.phase === "ready" && (
                    <span className="pk">click to kill ✕</span>
                  )}
                </button>
              ))}
            </div>
            <div className="ops-served">
              <span>requests served</span>
              <b>{served.toLocaleString()}</b>
              <span>failed</span>
              <b className="g">0</b>
            </div>
          </div>
          <div className="ops-card ops-events">
            <div className="ops-eyebrow" style={{ marginBottom: 8 }}>
              kubectl get events -w
            </div>
            <ul aria-live="polite">
              {events.map((e, i) => (
                <li key={`${e.t}-${i}-${e.msg}`} className={e.kind}>
                  <span className="t">{e.t}</span>
                  <span>{e.msg}</span>
                </li>
              ))}
            </ul>
            <div className="ops-note">
              simulation for illustration ·{" "}
              <a
                href="https://github.com/Yohan-Senadheera/cloud-reliability-platform"
                target="_blank"
                rel="noopener noreferrer"
              >
                the real lab is on GitHub ↗
              </a>
            </div>
          </div>
        </div>
    </div>
  );
}

function Projects() {
  const own = profile.projects.filter((p) => !String(p.subtitle).includes("WSO2"));
  const main = own.filter((p) => p.featured);
  const more = own.filter((p) => !p.featured);
  return (
    <section id="projects" className="ops-wrap ops-sec">
      <Head
        n="03"
        tag="projects & labs"
        title="Things I build outside work"
        lead="University projects, personal labs, and one lab you can break right here."
      />
      <div className="ops-pgrid">
        {main.map((p, i) => {
          const links = p.links as { repo?: string; demo?: string };
          return (
            <div className="rv" key={p.title} style={{ transitionDelay: `${i * 0.06}s` }}>
              <article className="ops-pcard">
                <div className="ops-pcard-top">
                  <span className="ops-badge">{projectBadge[p.title] ?? p.type}</span>
                  <span className="ops-meta">{p.timeframe}</span>
                </div>
                <h3>{p.title}</h3>
                <div className="ops-meta">
                  {p.subtitle} · {p.type}
                </div>
                <p>{p.description}</p>
                <p className="did">
                  <b>My part:</b> {p.whatIDid}
                </p>
                {p.result && <p className="res">→ {p.result}</p>}
                <div className="ops-tags">
                  {p.tech.slice(0, 7).map((t) => (
                    <span className="ops-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                {(links.repo || links.demo) && (
                  <div className="ops-links">
                    {links.repo && (
                      <a href={links.repo} target="_blank" rel="noopener noreferrer">
                        <Github size={14} aria-hidden="true" /> code ↗
                      </a>
                    )}
                    {links.demo && (
                      <a href={links.demo} target="_blank" rel="noopener noreferrer">
                        live site ↗
                      </a>
                    )}
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </div>

      <ChaosLab />

      {more.length > 0 && (
        <>
          <div className="ops-sub rv" style={{ marginTop: 40 }}>
            more projects
          </div>
          <div className="ops-more rv">
            {more.map((o) => {
              const l = o.links as { repo?: string };
              return (
                <a
                  className="ops-mini"
                  key={o.title}
                  href={l.repo ?? "#projects"}
                  target={l.repo ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  <b>{o.title}</b>
                  <span>
                    {o.subtitle} · {o.timeframe}
                  </span>
                </a>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function Contributions() {
  return (
    <section id="contributions" className="ops-band">
      <div className="ops-wrap ops-sec">
        <Head
          n="05"
          tag="public contributions"
          title="Public contributions"
          lead="Most of my internship work lives in private WSO2 repositories. These are the public pieces anyone can check: Terraform modules in WSO2's public libraries and fixes upstream in Argo Workflows."
        />
        <div className="ops-card rv" style={{ padding: 6, overflowX: "auto" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Title</th>
                <th className="hide-sm">Repository</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.repo + c.ref}>
                  <td className="ops-mono">
                    <a href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.ref}
                    </a>
                  </td>
                  <td>{c.title}</td>
                  <td className="ops-repo hide-sm">{c.repo}</td>
                  <td>
                    <span className={`ops-chip ${c.status}`}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ops-note">
          status as of {statusAsOf} · click a ref for the live state
        </div>
      </div>
    </section>
  );
}

function Stack() {
  const groups = Object.entries(profile.skills);
  return (
    <section id="skills" className="ops-wrap ops-sec">
      <Head
        n="07"
        tag="skills"
        title="Skills, layer by layer"
        lead={`Currently learning: ${profile.currentlyLearning.join(" · ")}.`}
      />
      <div className="ops-layers">
        {groups.map(([group, items], k) => (
          <div
            className="ops-layer rv"
            key={group}
            style={{ transitionDelay: `${k * 0.06}s` }}
          >
            <div className="ops-layer-l">
              <span className="ops-mono">L{groups.length - k}</span>
              <b>{group}</b>
            </div>
            <div className="ops-tags">
              {items.map((s) => (
                <span className="ops-tag" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Experience() {
  const work = profile.experience.filter((e) => e.type === "work" || e.type === "teaching");
  const intern = profile.projects.filter((p) => String(p.subtitle).includes("WSO2"));
  const edu = profile.education[0];
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section id="experience" className="ops-band">
      <div className="ops-wrap ops-sec">
        <Head
          n="02"
          tag="experience"
          title="Where I've worked"
          lead="Roles first, with the work behind them. Open a project to see the details."
        />
        <div className="ops-cols">
          <div className="ops-tl rv">
            {work.map((e, i) => (
              <div className={`ops-ev ${i === 0 ? "main" : ""}`} key={e.title + e.organization}>
                <h3>{e.title}</h3>
                <div className="org">{e.organization}</div>
                <div className="when">{e.timeframe}</div>
                <p>{e.description}</p>
                {i === 0 && intern.length > 0 && (
                  <div className="ops-xp">
                    {intern.map((p) => {
                      const isOpen = open === p.title;
                      const links = p.links as { repo?: string };
                      return (
                        <div className={`ops-xp-item ${isOpen ? "open" : ""}`} key={p.title}>
                          <button
                            className="ops-xp-h"
                            onClick={() => setOpen(isOpen ? null : p.title)}
                            aria-expanded={isOpen}
                          >
                            <span>
                              <b>{p.title}</b>
                              <small>{projectBadge[p.title] ?? p.timeframe}</small>
                            </span>
                            <span className="chev" aria-hidden="true">
                              {isOpen ? "−" : "+"}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="ops-xp-b">
                              <p>{p.description}</p>
                              <div className="ops-grid2">
                                <div className="ops-box">
                                  <div className="t">What I did</div>
                                  {p.whatIDid}
                                </div>
                                {p.result && (
                                  <div className="ops-box res">
                                    <div className="t">Result</div>
                                    {p.result}
                                  </div>
                                )}
                              </div>
                              <div className="ops-tags">
                                {p.tech.map((t) => (
                                  <span className="ops-tag" key={t}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                              {links.repo && (
                                <div className="ops-links">
                                  <a href={links.repo} target="_blank" rel="noopener noreferrer">
                                    view the public pull request ↗
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div className="ops-ev">
              <h3>{edu.degree}</h3>
              <div className="org">{edu.institution}</div>
              <div className="when">{edu.timeframe}</div>
              <p>Coursework: {edu.courses.join(", ")}.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
            <div className="ops-card rv">
              <div className="ops-eyebrow" style={{ marginBottom: 10 }}>
                certifications and courses
              </div>
              <ul className="ops-list">
                {profile.certifications
                  .filter((c) => !field(c, "subtitle"))
                  .map((c) => (
                    <li key={c.title}>
                      <span>
                        {c.title}
                        <span className="sub">
                          {c.issuer}
                          {c.status === "in-progress" ? " · in progress" : ""}
                        </span>
                      </span>
                      <small>{field(c, "date") ?? ""}</small>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="ops-wrap ops-sec">
      <Head
        n="09"
        tag="contact"
        title="Let's ship something reliable"
        lead="Open to SRE, DevOps and cloud infrastructure roles. Email is the fastest way to reach me."
      />
      <div className="ops-contact rv">
        <div className="ops-term">
          <div className="ops-term-h">
            <i />
            <i />
            <i />
            <span>contact.sh</span>
          </div>
          <div className="ops-term-b">
            <div className="ops-cmd">$ echo $EMAIL</div>
            <div>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </div>
            <div className="ops-cmd">$ echo $PHONE</div>
            <div>{profile.phone[0]}</div>
            <div className="ops-cmd">$ open github linkedin medium</div>
            <div>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/Yohan-Senadheera
              </a>
            </div>
            <div>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                linkedin.com/in/yohan-senadheera
              </a>
            </div>
            <div>
              <a
                href={medium.profile}
                target="_blank"
                rel="noopener noreferrer"
              >
                medium.com/@yohansenadheera
              </a>
            </div>
            <div>
              <a
                href="https://yohan.is-a.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                yohan.is-a.dev
              </a>
            </div>
            <div className="ops-cmd">
              $ <span className="ops-caret" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className="ops-card ops-deploy">
          <div className="ops-eyebrow">final stage</div>
          <div className="ops-deploy-t">Ready to deploy</div>
          <p>
            The CV has every role, project and course on two pages, with links
            to the code and pull requests.
          </p>
          <p className="ops-contact-hint">
            Looking for my personal socials? They are locked in a Kubernetes
            secret. <a href="#secret">Unlock them in the side quest →</a>
          </p>
          <div className="ops-cta">
            <a
              className="ops-btn primary"
              href={profile.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download CV
            </a>
            <a className="ops-btn" href={`mailto:${profile.email}`}>
              Send an email
            </a>
          </div>
        </div>
      </div>
      <footer className="ops-foot">
        <span>
          © {new Date().getFullYear()} Yohan Senadheera
        </span>
        <span>
          pipeline status:{" "}
          <span style={{ color: "var(--green)" }}>● passed</span> · deployed on
          Cloudflare Pages
        </span>
      </footer>
    </section>
  );
}

export default function Index() {
  const { active, progress } = useScrollState();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".ops-root .rv"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("on"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((e) => {
      if (!e.classList.contains("on")) io.observe(e);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="ops-root">
      <TopBar active={active} progress={progress} />
      <BackgroundMesh />
      <main className="ops-main">
        <Hero />
        <Architecture />
        <Experience />
        <Projects />
        <Values n="04" />
        <Contributions />
        <Writing n="06" />
        <Stack />
        <OffCall n="08">
          <SecretGame />
        </OffCall>
        <Contact />
      </main>
    </div>
  );
}
