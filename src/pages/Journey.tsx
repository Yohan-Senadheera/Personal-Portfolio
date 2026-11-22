import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { useProgress } from "@react-three/drei";
import { CHAPTERS, flashAt, isDark, journey } from "@/components/journey/store";
import { CanvasErrorBoundary } from "@/components/three/CanvasErrorBoundary";
import { contributions, statusLabel } from "@/content/ops";
import { profile } from "@/content/profile";
import { medium } from "@/content/fun";
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
    <div className={`j-root ${dark ? "is-dark" : ""}`}>
      <div className="j-stage" aria-hidden>
        <CanvasErrorBoundary fallback={<div className="j-stage__fallback" />}>
          <Suspense fallback={null}>
            <JourneyCanvas />
          </Suspense>
        </CanvasErrorBoundary>
      </div>
      <div className="j-flash" ref={flash} aria-hidden />
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
        {/* 0 · cover */}
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
                Start the tour ↓
              </button>
              <Ext href={LINKS.linkedin}>LinkedIn</Ext>
              <Ext href={LINKS.github}>GitHub</Ext>
            </div>
          </div>
          <div className="j-scrollcue" aria-hidden>
            <span>scroll</span>
            <i />
          </div>
        </section>

        {/* 1 · at a glance */}
        <section id="glance" ref={reg(1)} className="j-ch j-ch--glance">
          <div className="j-panel j-panel--left j-panel--glance j-reveal">
            <p className="j-kicker">01 · At a glance</p>
            <h2 className="j-h2">Real systems, real numbers.</h2>
            <div className="j-stats">
              <article className="j-stat">
                <b>20+</b>
                <p>microservices moved to automated, CA-signed certificates. <strong>Running in production</strong> at WSO2.</p>
              </article>
              <article className="j-stat">
                <b>50+</b>
                <p>inline secret injections removed from pipelines with External Secrets Operator.</p>
              </article>
              <article className="j-stat">
                <b>0</b>
                <p>inbound connections into production. A pull-based Argo CI/CD platform on AKS and EKS.</p>
              </article>
              <article className="j-stat">
                <b>{contributions.length}</b>
                <p>public open-source contributions: Argo Workflows, Kubernetes and Prometheus clients, WSO2 Terraform.</p>
              </article>
            </div>
            <div className="j-chips">
              <span className="j-chip j-chip--green">PageRewind · live on AWS · v0.1.0</span>
              <span className="j-chip">Terraform · top 10% globally (TestDome)</span>
              <span className="j-chip">Kubernetes · Terraform · Argo · AWS · Azure</span>
            </div>
          </div>
        </section>

        {/* 2 · WSO2 platform */}
        <section id="platform" ref={reg(2)} className="j-ch">
          <div className="j-panel j-panel--left j-reveal">
            <p className="j-kicker">02 · WSO2 · Apr – Oct 2026</p>
            <h2 className="j-h2">CI/CD that never reaches into production.</h2>
            <p>
              As an SRE intern I worked on a pull-based platform on Argo Workflows, Events and CD. Every AKS and EKS data plane
              dials out to the control plane over a mutual-TLS NATS bus, so nothing opens inbound.
            </p>
            <ul className="j-list">
              <li>
                <b>Production-ready</b> for teams to adopt, with the whole Argo setup provisioned in Terraform (multi-AZ,
                replicated controllers).
              </li>
              <li>
                <b>Certificates:</b> automated CA-signed issuance and rotation across 20+ microservices, now running in production.
              </li>
              <li>
                <b>Secrets:</b> 50+ inline injections replaced with External Secrets Operator; Workload Identity Federation instead
                of stored tokens.
              </li>
              <li>
                <b>Terraform:</b> 3 PRs merged into WSO2&rsquo;s public module library; the Argo modules for Azure and AWS are in
                review.
              </li>
            </ul>
            <div className="j-actions">
              <Ext href="https://medium.com/@yohansenadheera/how-i-went-cloud-agnostic-with-the-argo-ecosystem-4725b08290a9">
                Read: going cloud-agnostic with Argo
              </Ext>
              <Ext href="https://medium.com/@yohansenadheera/replaced-manual-certificate-signing-across-20-microservices-with-a-pipeline-f166a00d63f6">
                Read: certificates for 20+ services
              </Ext>
            </div>
          </div>
        </section>

        {/* 3 · PageRewind */}
        <section id="pagerewind" ref={reg(3)} className="j-ch">
          <div className="j-panel j-panel--left j-reveal">
            <p className="j-kicker">03 · PageRewind · Nov 2026 – now</p>
            <h2 className="j-h2">100 alerts. One incident. The right person paged.</h2>
            <p>
              My open-source on-call platform: five Java (Spring Boot) services that turn alerts into incidents, page the on-call
              engineer on Telegram or email, and escalate when nobody answers.
            </p>
            <ul className="j-list">
              <li>
                <b>No lost alerts:</b> transactional outbox, idempotent consumers and quorum queues. 100 duplicates become one
                incident.
              </li>
              <li>
                <b>Live on AWS:</b> Terraform builds a k3s cluster and Argo CD deploys every change through GitOps.
              </li>
              <li>
                <b>Tested:</b> 160+ tests, a full-stack end-to-end test in CI, and 8 architecture decision records.
              </li>
            </ul>
            <div className="j-actions">
              <Ext href={LINKS.status} solid>
                See it live
              </Ext>
              <Ext href={LINKS.pagerewind}>Code on GitHub</Ext>
            </div>
          </div>
        </section>

        {/* 4 · open source */}
        <section id="opensource" ref={reg(4)} className="j-ch">
          <div className="j-panel j-panel--left j-panel--wide j-reveal">
            <p className="j-kicker">04 · Open source</p>
            <h2 className="j-h2">Fixing things at the source.</h2>
            <p>
              {merged} merged, {review} in review, {issues} issues. My Argo Workflows docs PR was merged and backported to two
              release branches.
            </p>
            <ul className="j-prs">
              {contributions.map((c) => (
                  <li key={c.repo + c.ref}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer">
                      <span className={`j-pill j-pill--${c.status}`}>{statusLabel[c.status]}</span>
                      <span className="j-prs__repo">
                        {c.repo} <em>{c.ref}</em>
                      </span>
                      <span className="j-prs__title">{c.title}</span>
                    </a>
                  </li>
                ))}
            </ul>
            <div className="j-actions">
              <Ext href="https://github.com/pulls?q=is%3Apr+author%3AYohan-Senadheera+is%3Apublic">All my pull requests</Ext>
            </div>
          </div>
        </section>

        {/* 5 · experience */}
        <section id="projects" ref={reg(5)} className="j-ch">
          <div className="j-panel j-panel--left j-panel--caption j-reveal">
            <p className="j-kicker">05 · Projects</p>
            <h2 className="j-h2">More things I&rsquo;ve built.</h2>
            <ul className="j-plist">
              {PROJECTS.map((p) => (
                <li key={p.title}>
                  <div>
                    <b>{p.title}</b>
                    <span>{p.when}</span>
                  </div>
                  <p>{p.line}</p>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer">
                      View code <Arrow />
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <div className="j-actions">
              <Ext href={LINKS.github}>All code on GitHub</Ext>
            </div>
          </div>
        </section>

        {/* 6 · experience */}
        <section id="path" ref={reg(6)} className="j-ch">
          <div className="j-panel j-panel--right j-panel--wide j-reveal">
            <p className="j-kicker">06 · Experience</p>
            <h2 className="j-h2">The path so far.</h2>
            <div className="j-scrollbox">
            <ol className="j-timeline">
              <li>
                <span>Apr – Oct 2026</span>
                <b>SRE Intern · WSO2</b>
                <p>Customer Success. Multi-cloud CI/CD on Argo, PKI certificate automation, Terraform modules.</p>
              </li>
              <li>
                <span>Nov 2024 – Aug 2025</span>
                <b>Undergraduate Teaching Assistant · University of Peradeniya</b>
                <p>Database Systems and Programming Methodology. Taught and mentored 40+ students.</p>
              </li>
              <li>
                <span>Feb 2022 – Oct 2026</span>
                <b>BSc Eng (Hons) Computer Engineering · University of Peradeniya</b>
                <p>Final-year project: a four-agent LLM grading pipeline in Moodle; the rubric agent cut grading error by 47%.</p>
              </li>
            </ol>
            <div className="j-grid2">
              <div>
                <h3>Leadership</h3>
                <ul className="j-mini">
                  {LEADERSHIP.slice(0, 4).map((e) => (
                    <li key={e.title + e.organization}>
                      <span className="j-mini__t">{e.title}</span>
                      <span>
                        {e.organization} · {e.timeframe}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Awards &amp; competitions</h3>
                <ul className="j-mini">
                  {AWARDS.slice(0, 4).map((a) => (
                    <li key={a.title + a.sub}>
                      <span className="j-mini__t">{a.title}</span>
                      <span>{a.sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* 7 · toolbox */}
        <section id="toolbox" ref={reg(7)} className="j-ch">
          <div className="j-panel j-panel--left j-panel--wide j-reveal">
            <p className="j-kicker">07 · Toolbox</p>
            <h2 className="j-h2">What I work with.</h2>
            <div className="j-skills">
              {Object.entries(profile.skills).map(([group, items]) => (
                <div key={group}>
                  <h3>{group}</h3>
                  <p>{(items as readonly string[]).join(" · ")}</p>
                </div>
              ))}
            </div>
            <div className="j-scrollbox">
            <div className="j-grid2">
              <div>
                <h3>Courses &amp; certificates</h3>
                <ul className="j-mini">
                  {COURSES.slice(0, 6).map((c) => (
                    <li key={c.title}>
                      <span className="j-mini__t">{c.title}</span>
                      <span>
                        {c.issuer} · {c.date}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Writing</h3>
                <ul className="j-mini">
                  {medium.articles.map((a) => (
                    <li key={a.url}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        {a.title} <Arrow />
                      </a>
                      <span>
                        {a.tag} · {a.date}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* 8 · contact */}
        <section id="contact" ref={reg(8)} className="j-ch j-ch--contact">
          <div className="j-contact j-reveal">
            <p className="j-status">
              <i /> Open to SRE, DevOps and platform roles · can start immediately
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
              © 2026 Yohan Senadheera · built with React Three Fiber · <a href="/classic">classic site</a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
