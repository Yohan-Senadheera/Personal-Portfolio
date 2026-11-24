import { ReactNode, useEffect, useState } from "react";
import "./tools.css";

export const TOOLS = [
  {
    slug: "pod-doctor",
    group: "SRE & DevOps",
    name: "Pod Doctor",
    tag: "Kubernetes",
    title: "Pod Doctor: why is my Kubernetes pod failing?",
    blurb:
      "Paste kubectl describe pod. Get a plain-English diagnosis for Pending, CrashLoopBackOff, ImagePullBackOff, OOMKilled and probe failures, with the exact next commands.",
  },
  {
    slug: "slo-alerts",
    group: "SRE & DevOps",
    name: "SLO → Alert Rules",
    tag: "Prometheus",
    title: "SLO to Prometheus burn-rate alerts generator",
    blurb:
      "Turn an SLO into an error budget and ready-to-paste multi-window, multi-burn-rate Prometheus alert rules, as a rules file or a PrometheusRule.",
  },
  {
    slug: "cert-inspector",
    group: "SRE & DevOps",
    name: "Cert Inspector",
    tag: "TLS / PKI",
    title: "Certificate chain inspector (runs in your browser)",
    blurb:
      "Paste PEM certificates. See expiry, SANs and keys, catch a missing intermediate or wrong order, and get the fixed bundle and openssl commands.",
  },
  {
    slug: "salary-lk",
    group: "Sri Lanka",
    name: "Take-home Salary",
    tag: "Sri Lanka",
    title: "Sri Lanka take-home salary calculator: EPF, ETF and APIT",
    blurb:
      "See your real monthly take-home after EPF and APIT tax, what your employer adds to EPF and ETF, and compare up to three job offers side by side.",
  },
] as const;

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const url = `https://yohan.is-a.dev${path}`;
    document.title = `${title} | Yohan Senadheera`;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [title, description, path]);
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="t-btn t-btn--ghost"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        });
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="t-code">
      <div className="t-code__bar">
        <span>{title ?? ""}</span>
        <CopyButton text={code} />
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ToolLayout({
  slug,
  children,
}: {
  slug?: (typeof TOOLS)[number]["slug"];
  children: ReactNode;
}) {
  const tool = TOOLS.find((t) => t.slug === slug);
  return (
    <div className="t-root">
      <header className="t-top">
        <a className="t-logo" href="/">
          <span>YS</span> Yohan Senadheera
        </a>
        <nav className="t-nav" aria-label="Tools">
          <a href="/tools" className={!slug ? "is-on" : ""}>
            All tools
          </a>
          {TOOLS.map((t) => (
            <a key={t.slug} href={`/tools/${t.slug}`} className={t.slug === slug ? "is-on" : ""}>
              {t.name}
            </a>
          ))}
        </nav>
      </header>
      <main className="t-main">
        {tool && (
          <div className="t-head">
            <span className="t-tag">{tool.tag}</span>
            <h1>{tool.name}</h1>
            <p>{tool.blurb}</p>
            <p className="t-private">
              <i /> Runs entirely in your browser. Nothing you enter is uploaded or stored.
            </p>
          </div>
        )}
        {children}
      </main>
      <footer className="t-foot">
        Free tools by <a href="/">Yohan Senadheera</a>, Site Reliability &amp; DevOps engineer ·{" "}
        <a href="https://www.linkedin.com/in/yohan-senadheera" target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>{" "}
        ·{" "}
        <a href="https://github.com/Yohan-Senadheera" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
