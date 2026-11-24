import ToolLayout, { TOOLS, usePageMeta } from "./ToolLayout";

export default function ToolsIndex() {
  usePageMeta(
    "Free SRE and DevOps tools",
    "Free browser tools for Kubernetes, Prometheus SLOs and TLS certificates, built by Yohan Senadheera. Nothing you paste leaves your browser.",
    "/tools",
  );
  return (
    <ToolLayout>
      <div className="t-hero">
        <span className="t-tag">free · no sign-up · runs in your browser</span>
        <h1>Tools for the on-call shift</h1>
        <p>
          Small tools I built for problems I kept running into as an SRE: a pod that will not start, alerts that page for
          nothing, and a certificate chain that works in the browser but not in curl.
        </p>
        <p className="t-private">
          <i /> Nothing you paste is uploaded. Every tool runs entirely on this page.
        </p>
      </div>
      <div className="t-cards">
        {TOOLS.map((t) => (
          <a key={t.slug} className="t-card" href={`/tools/${t.slug}`}>
            <span className="t-tag" style={{ alignSelf: "flex-start" }}>
              {t.tag}
            </span>
            <h2>{t.name}</h2>
            <p>{t.blurb}</p>
            <em>Open {t.name} →</em>
          </a>
        ))}
      </div>
    </ToolLayout>
  );
}
