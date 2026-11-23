import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { useProgress } from "@react-three/drei";
import { CHAPTERS, flashAt, isDark, journey } from "@/components/journey/store";
import { CanvasErrorBoundary } from "@/components/three/CanvasErrorBoundary";
import { contributions, statusLabel } from "@/content/ops";
import { profile } from "@/content/profile";
import { medium } from "@/content/fun";
import { Clock, Diagram, Page, PRFeed, Skills, Terminal } from "@/components/journey/Night";
import { monthValue, PodBoard, Rotation, type Marker, type Pod, type Shift } from "@/components/journey/Interactive";
import "@/journey.css";

const JourneyCanvas = lazy(() =>
  import("@/components/journey/PhotoScene").then((m) => ({ default: m.PhotoCanvas })),
);

const EMAIL = "yohansenadheera@gmail.com";
const LINKS = {
  linkedin: "https://linkedin.com/in/yohan-senadheera",
  github: "https://github.com/Yohan-Senadheera",
  medium: "https://medium.com/@yohansenadheera",
  pagerewind: "https://github.com/Yohan-Senadheera/pagerewind",
  status: "https://status.pagerewind.dev",
};

// The CV no longer lists the bank traineeship or the explorers' club; keep the site in step.
const LEADERSHIP = profile.experience.filter(
  (e) => (e.type === "leadership" || e.type === "technical") && !e.organization.includes("Explorers"),
);
const AWARDS = [
  ...profile.awards.map((a) => ({
    title: a.title,
    sub: [("subtitle" in a ? a.subtitle : ""), ("project" in a ? a.project : "") || ("organization" in a ? a.organization : ""), a.date]
      .filter(Boolean)
      .join(" · "),
  })),
  ...profile.certifications
    .filter((c) => "subtitle" in c)
    .map((c) => ({ title: c.title, sub: [("subtitle" in c ? c.subtitle : ""), c.issuer, c.date].filter(Boolean).join(" · ") })),
];
const COURSES = profile.certifications.filter((c) => !("subtitle" in c));

const PROJECT_LINES: Record<string, string> = {
  "Cloud Reliability Platform (SRE Lab)": "Kubernetes lab with Prometheus, Grafana and Alertmanager; self-healing proven by chaos tests.",
  "Private 5G Network Implementation": "5G core (Aether SD-Core) on Kubernetes and an edge UPF on a Raspberry Pi, with SLTMobitel.",
  "Mini 5G Edge Network Testbed (Cloud-Native Networking)": "Containerised network functions with Prometheus and Grafana monitoring.",
  "P-E-BO Desk Companion": "AI desk robot: React Native app, Firebase and AWS Rekognition. ICIIS 2025 3rd place.",
  "MONA Dashboard": "Machine production-rate dashboard: React, Node.js and MongoDB.",
  "AI-Driven Automated Feedback and Tutoring System": "Four-agent LLM grading pipeline in Moodle; the rubric agent cut grading error by 47%.",
  "Smart Home Energy Automation": "React Native app with Firebase real-time sync for an ESP32 home-energy system.",
};
const PROJECTS = profile.projects
  .filter((p) => !["Pull-Based Multi-Cloud CI/CD Platform", "PKI Certificate Automation", "PageRewind"].includes(p.title))
  .map((p) => ({
    title: p.title.replace(/\s*\(.*\)$/, ""),
    when: p.timeframe,
    line: PROJECT_LINES[p.title] ?? p.description,
    link: (p.links as { repo?: string; demo?: string }).repo ?? (p.links as { demo?: string }).demo,
  }));

/** A short, stable fake commit hash for the project git log. */
function sha(t: string) {
  let h = 2166136261;
  for (const ch of t) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

const MERGED = contributions.filter((c) => c.status === "merged").length;
const REVIEW = contributions.filter((c) => c.status === "review").length;
const GLANCE_LINES = [
  { cmd: "kubectl get certificates -A | grep -c Ready" },
  { out: "20+  services on CA-signed certs · auto-rotated · in production", ok: true },
  { cmd: "grep -rc 'inline secret' pipelines/" },
  { out: "0    inline secrets left · 50+ moved to External Secrets Operator", ok: true },
  { cmd: "argo-platform inbound --env prod" },
  { out: "0    inbound connections · AKS + EKS data planes dial out over mTLS", ok: true },
  { cmd: "gh pr list --author Yohan-Senadheera --state all | wc -l" },
  { out: `${contributions.length}   public contributions · ${MERGED} merged · ${REVIEW} in review`, ok: true },
  { cmd: "curl -s status.pagerewind.dev" },
  { out: "PageRewind v0.1.0 · operational · live on AWS", ok: true },
];

/* ---------------- 09:30 · projects as pods */
const SLUGS: Record<string, string> = {
  "Cloud Reliability Platform (SRE Lab)": "reliability-lab",
  "Private 5G Network Implementation": "private-5g-core",
  "Mini 5G Edge Network Testbed (Cloud-Native Networking)": "5g-edge-testbed",
  "P-E-BO Desk Companion": "pebo-robot",
  "MONA Dashboard": "mona-dashboard",
  "AI-Driven Automated Feedback and Tutoring System": "ai-grader",
  "Smart Home Energy Automation": "smart-home",
};
const PODS: Pod[] = profile.projects
  .filter((p) => p.title in SLUGS)
  .map((p) => ({
    slug: SLUGS[p.title],
    title: p.title.replace(/\s*\(.*\)$/, ""),
    when: p.timeframe,
    kind: p.type,
    running: /present/i.test(p.timeframe),
    description: p.description,
    did: p.whatIDid,
    result: p.result,
    tech: p.tech,
    link: (p.links as { repo?: string; demo?: string }).repo ?? (p.links as { demo?: string }).demo,
  }));

/* ---------------- 16:30 · experience as an on-call rotation */
const LANES = ["Work", "Teaching", "Leadership", "Education", "Awards"];
const laneOf = (t: string) => (t === "work" ? "Work" : t === "teaching" ? "Teaching" : "Leadership");
const range = (tf: string) => {
  const [a, b] = tf.split(/–|-/).map((x) => x.trim());
  const start = monthValue(a);
  const end = b ? monthValue(b) : start;
  return start !== null && end !== null ? { start, end: Math.max(end, start + 1 / 12) } : null;
};
const SHIFTS: Shift[] = [
  ...profile.experience
    .filter((e) => !e.organization.includes("Explorers") && !e.organization.includes("People"))
    .flatMap((e) => {
      const r = range(e.timeframe);
      const note = e.organization === "WSO2"
        ? "Customer Success SRE. Built the Argo pipeline layer of a pull-based multi-cloud CI/CD platform (AKS and EKS), automated CA-signed certificate rotation across 20+ microservices (in production), replaced 50+ inline secrets with External Secrets Operator, and wrote Terraform modules for WSO2's public library."
        : e.description;
      return r ? [{ lane: laneOf(e.type), title: e.title, org: e.organization, ...r, note }] : [];
    }),
  ...profile.education
    .filter((ed) => ed.institution === "University of Peradeniya")
    .flatMap((ed) => {
      const r = range(ed.timeframe);
      return r
        ? [{ lane: "Education", title: "BSc Eng (Hons) Computer Engineering", org: ed.institution, ...r, note: "Final-year project: a four-agent LLM grading pipeline in Moodle; the rubric agent cut grading error by 47%." }]
        : [];
    }),
];
const MARKERS: Marker[] = AWARDS.flatMap((a) => {
  const m = a.sub.match(/([A-Z][a-z]{2} \d{4})/);
  const at = m ? monthValue(m[1]) : null;
  return at ? [{ lane: "Awards", title: a.title, at, note: a.sub }] : [];
});

/* ------------------------------------------------------------------ hooks */

function useJourneyScroll(
  sections: React.MutableRefObject<(HTMLElement | null)[]>,
  flash: React.MutableRefObject<HTMLDivElement | null>,
) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const calm =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      new URLSearchParams(window.location.search).has("calm");
    journey.calm = calm;
    const lenis = calm ? null : new Lenis({ duration: 1.25, smoothWheel: true, wheelMultiplier: 0.9 });

    const update = () => {
      const y = window.scrollY + window.innerHeight * 0.35;
      const tops = sections.current.map((el) => (el ? el.offsetTop : 0));
      let i = 0;
      while (i < tops.length - 1 && y >= tops[i + 1]) i++;
      const start = tops[i];
      const end = i < tops.length - 1 ? tops[i + 1] : start + 1;
      const frac = i < tops.length - 1 ? Math.min(1, Math.max(0, (y - start) / (end - start))) : 0;
      // Hold on each chapter for a moment, then travel.
      const hold = 0.38;
      const eased = frac < hold ? 0 : (frac - hold) / (1 - hold);
      journey.t = i + eased;
      // Each chapter's text fades out while the camera travels, so the flight owns the screen.
      sections.current.forEach((el, k) => {
        if (!el) return;
        const o = Math.min(1, Math.max(0, 1 - (Math.abs(journey.t - k) - 0.12) / 0.28));
        el.style.opacity = o.toFixed(3);
        el.style.pointerEvents = "none";
        const panel = el.firstElementChild as HTMLElement | null;
        if (panel) panel.style.pointerEvents = o < 0.05 ? "none" : "auto";
      });
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      setActive(Math.round(journey.t));
      setDark(isDark(journey.t));
      if (flash.current) {
        const f = flashAt(journey.t);
        flash.current.style.background = f.color;
        flash.current.style.opacity = (f.o * 0.92).toFixed(3);
      }
    };

    let raf = 0;
    const loop = (time: number) => {
      lenis?.raf(time);
      update();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      journey.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      journey.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    (window as unknown as { __lenis?: Lenis | null }).__lenis = lenis;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      lenis?.destroy();
    };
  }, [sections, flash]);
  return { active, progress, dark };
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".j-reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { threshold: 0.18 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: Lenis | null }).__lenis;
  if (lenis) lenis.scrollTo(el, { duration: 2.2 });
  else el.scrollIntoView();
}

/* ------------------------------------------------------------------ pieces */

function Loader() {
  const { progress, active } = useProgress();
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (progress >= 100 || !active) {
      const t = setTimeout(() => setGone(true), progress >= 100 ? 600 : 1500);
      return () => clearTimeout(t);
    }
  }, [active, progress]);
  // Never hold the page hostage: the world keeps streaming in behind the text.
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 9000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`j-loader ${gone ? "is-gone" : ""}`} aria-hidden={gone}>
      <div className="j-loader__mark">YS</div>
      <div className="j-loader__bar">
        <span style={{ width: `${Math.max(6, progress)}%` }} />
      </div>
      <div className="j-loader__label">warming up the cluster · {Math.round(progress)}%</div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Ext({ href, children, solid }: { href: string; children: React.ReactNode; solid?: boolean }) {
  return (
    <a className={`j-btn ${solid ? "j-btn--solid" : ""}`} href={href} target="_blank" rel="noopener noreferrer">
      {children} <Arrow />
    </a>
  );
}

/* ------------------------------------------------------------------ page */

export default function Journey() {
  const sections = useRef<(HTMLElement | null)[]>([]);
  const flash = useRef<HTMLDivElement | null>(null);
  const { active, progress, dark } = useJourneyScroll(sections, flash);
  useReveal();

  // Deep links: /#platform, /#pagerewind ... jump straight to a chapter.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) window.scrollTo(0, el.offsetTop + window.innerHeight * 0.1);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.title = "Yohan Senadheera · SRE & DevOps Engineer";
    return () => document.documentElement.classList.add("dark");
  }, []);

  const reg = (i: number) => (el: HTMLElement | null) => (sections.current[i] = el);

  const merged = contributions.filter((c) => c.status === "merged").length;
  const review = contributions.filter((c) => c.status === "review").length;
  const issues = contributions.filter((c) => c.status === "issue").length;

  return (
    <div className="j-root is-dark n-night">
      <div className="j-stage" aria-hidden>
        <CanvasErrorBoundary fallback={<div className="j-stage__fallback" />}>
          <Suspense fallback={null}>
            <JourneyCanvas />
          </Suspense>
        </CanvasErrorBoundary>
      </div>
      <div className="j-flash" ref={flash} aria-hidden />
      <Clock active={active} />
      <Loader />

      <header className="j-top">
        <button className="j-logo" onClick={() => goTo("cover")} aria-label="Back to top">
          <span>YS</span> Yohan Senadheera
        </button>
        <nav className="j-nav" aria-label="Chapters">
          {CHAPTERS.slice(1).map((c, i) => (
            <button key={c.id} className={active === i + 1 ? "is-on" : ""} onClick={() => goTo(c.id)}>
              {c.label}
            </button>
          ))}
        </nav>
        <a className="j-btn j-btn--solid j-top__cta" href={`mailto:${EMAIL}`}>
          Hire me
        </a>
        <div className="j-top__progress" style={{ transform: `scaleX(${progress})` }} />
      </header>

      <aside className="j-rail" aria-hidden>
        {CHAPTERS.map((c, i) => (
          <button key={c.id} className={active === i ? "is-on" : ""} onClick={() => goTo(c.id)} tabIndex={-1}>
            <i />
            <span>{c.label}</span>
          </button>
        ))}
      </aside>

      <main className="j-scroll">
        {/* 0 · 22:00 · cover */}
        <section id="cover" ref={reg(0)} className="j-ch j-ch--cover">
          <div className="j-cover">
            <p className="j-status">
              <i /> Available now · Colombo, Sri Lanka
            </p>
            <h1 className="j-title">
              Yohan
              <br />
              Senadheera
            </h1>
            <p className="j-role">Site Reliability &amp; DevOps Engineer</p>
            <p className="j-lede">
              I build platforms that don&rsquo;t wake people up at <em>3&nbsp;AM</em>.
            </p>
            <p className="j-meta">
              Computer Engineering graduate, University of Peradeniya · former SRE Intern at WSO2
            </p>
            <div className="j-actions">
              <button className="j-btn j-btn--solid" onClick={() => goTo("glance")}>
                Live through one night ↓
              </button>
              <Ext href={LINKS.linkedin}>LinkedIn</Ext>
              <Ext href={LINKS.github}>GitHub</Ext>
            </div>
            <p className="n-disclaimer">A night like this, dramatized. Every number and link in it is real.</p>
          </div>
          <div className="j-scrollcue" aria-hidden>
            <span>scroll</span>
            <i />
          </div>
        </section>

        {/* 1 · 23:40 · the office */}
        <section id="glance" ref={reg(1)} className="j-ch">
          <div className="j-panel j-panel--left n-panel">
            <p className="j-kicker">23:40 · The office</p>
            <h2 className="j-h2">Before the night: everything is green.</h2>
            <Terminal
              on={active === 1}
              title="yohan@on-call: ~"
              lines={GLANCE_LINES}
            />
          </div>
        </section>

        {/* 2 · 01:15 · the platform */}
        <section id="platform" ref={reg(2)} className="j-ch">
          <div className="j-panel j-panel--left n-panel">
            <p className="j-kicker">01:15 · In the cloud · WSO2, Apr – Oct 2026</p>
            <h2 className="j-h2">Production pulls its own deploys. Nothing gets in.</h2>
            <p className="n-copy">
              At WSO2 I built the pipeline layer of a CI/CD platform where each production cluster pulls its own
              deployments, so no pipeline or outside system ever needs a way in.
            </p>
            <Diagram on={active === 2} />
            <ul className="n-facts">
              <li>Pull-based CI/CD on Argo: every data plane dials out, nothing opens inbound. Production-ready, provisioned in Terraform.</li>
              <li>CA-signed certificates for 20+ microservices, rotated automatically, running in production.</li>
              <li>3 Terraform PRs merged into WSO2&rsquo;s public Azure module library.</li>
            </ul>
            <div className="j-actions">
              <Ext href="https://medium.com/@yohansenadheera/how-i-went-cloud-agnostic-with-the-argo-ecosystem-4725b08290a9">Read: going cloud-agnostic</Ext>
              <Ext href="https://medium.com/@yohansenadheera/replaced-manual-certificate-signing-across-20-microservices-with-a-pipeline-f166a00d63f6">Read: certs for 20+ services</Ext>
            </div>
          </div>
        </section>

        {/* 3 · 03:00 · the page */}
        <section id="pagerewind" ref={reg(3)} className="j-ch">
          <div className="j-panel j-panel--left n-panel">
            <p className="j-kicker n-kicker--red">03:00 · The page</p>
            <h2 className="j-h2">100 alerts. One incident. One person paged.</h2>
            <Page on={active === 3} />
            <p className="n-copy">
              That&rsquo;s <b>PageRewind</b>, my open-source on-call platform: Java (Spring Boot) services with an outbox,
              idempotent consumers and quorum queues, so no alert is lost and duplicates collapse. Live on AWS (Terraform, k3s,
              Argo CD).
            </p>
            <div className="j-actions">
              <Ext href={LINKS.status} solid>
                See it live
              </Ext>
              <Ext href={LINKS.pagerewind}>Code</Ext>
            </div>
          </div>
        </section>

        {/* 4 · 03:20 · the fix */}
        <section id="opensource" ref={reg(4)} className="j-ch">
          <div className="j-panel j-panel--left j-panel--wide n-panel">
            <p className="j-kicker">03:20 · The fix</p>
            <h2 className="j-h2">Fix it at the source.</h2>
            <p className="n-copy">
              {merged} merged, {review} in review, {issues} issues, upstream in Argo, Kubernetes, Prometheus, OpenAPI Generator
              and WSO2.
            </p>
            <PRFeed on={active === 4} items={contributions.map((c) => ({ ...c, label: statusLabel[c.status] }))} />
          </div>
        </section>

        {/* 5 · 09:30 · the lab */}
        <section id="projects" ref={reg(5)} className="j-ch">
          <div className="j-panel j-panel--left j-panel--wide n-panel">
            <p className="j-kicker">09:30 · The lab</p>
            <h2 className="j-h2">Things I built on the way here.</h2>
            <p className="n-copy">Each project is a pod. Pick one to describe it.</p>
            <PodBoard pods={PODS} />
          </div>
        </section>

        {/* 6 · 16:30 · postmortem */}
        <section id="path" ref={reg(6)} className="j-ch">
          <div className="j-panel j-panel--left j-panel--wide n-panel">
            <p className="j-kicker">16:30 · Peradeniya</p>
            <h2 className="j-h2">The path so far.</h2>
            <p className="n-copy">Four years as a rotation schedule. Tap a shift or a star.</p>
            <Rotation lanes={LANES} shifts={SHIFTS} markers={MARKERS} />
            <p className="n-next">
              <b>Next shift:</b> take the CKA exam, and join a team that runs real production.
            </p>
          </div>
        </section>

        {/* 7 · 18:10 · the rooftop */}
        <section id="toolbox" ref={reg(7)} className="j-ch">
          <div className="j-panel j-panel--left j-panel--wide n-panel">
            <p className="j-kicker">18:10 · The rooftop</p>
            <h2 className="j-h2">The tools I reach for.</h2>
            <Skills on={active === 7} groups={Object.entries(profile.skills) as [string, readonly string[]][]} />
            <div className="n-reading">
              <b>Writing</b>
              {medium.articles.map((a) => (
                <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer">
                  {a.title} <Arrow />
                </a>
              ))}
              <b>Courses</b>
              <span>{COURSES.slice(0, 5).map((c) => c.title).join(" · ")}</span>
            </div>
          </div>
        </section>

        {/* 8 · 18:30 · hand-off */}
        <section id="contact" ref={reg(8)} className="j-ch j-ch--contact">
          <div className="j-contact">
            <div className="n-contact-card">
            <p className="j-status">
              <i /> 18:30 · Incident resolved · open to SRE, DevOps and platform roles · can start immediately
            </p>
            <h2 className="j-title j-title--sm">
              Let&rsquo;s keep your
              <br />
              systems boring.
            </h2>
            <a className="j-email" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <p className="j-meta">+94 76 802 2347 · Colombo, Sri Lanka</p>
            <div className="j-actions">
              <Ext href={LINKS.linkedin} solid>
                LinkedIn
              </Ext>
              <Ext href={LINKS.github}>GitHub</Ext>
              <Ext href={LINKS.medium}>Medium</Ext>
            </div>
            <p className="j-foot">
              © 2026 Yohan Senadheera · <a href="/classic">classic site</a>
            </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
