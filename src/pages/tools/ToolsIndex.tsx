import ToolLayout, { TOOLS, usePageMeta } from "./ToolLayout";

export default function ToolsIndex() {
  usePageMeta(
    "Free SRE and DevOps tools",
    "Free browser tools for Kubernetes, Prometheus SLOs and TLS certificates, plus everyday tools: take-home salary, real loan rates and a trip splitter. Built by Yohan Senadheera; nothing you enter leaves your browser.",
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
      {(["SRE & DevOps", "Everyday"] as const).map((g) => (
        <section key={g} className="t-group">
          <h2 className="t-group__title">{g === "Everyday" ? "Everyday tools" : "For SRE and DevOps engineers"}</h2>
          <div className="t-cards">
            {TOOLS.filter((t) => t.group === g).map((t) => (
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
        </section>
      ))}
    </ToolLayout>
  );
}
