import { useEffect, useMemo, useState } from "react";
import ToolLayout, { CodeBlock, TOOLS, usePageMeta } from "./ToolLayout";
import { DEFAULTS, SloInput, budget, duration, round, rulesYaml, tiers } from "./sloEngine";

const META = TOOLS[1];

function fromQuery(): SloInput {
  const q = new URLSearchParams(window.location.search);
  const num = (k: string, d: number) => {
    const v = Number(q.get(k));
    return q.has(k) && isFinite(v) && v > 0 ? v : d;
  };
  return {
    service: q.get("service") ?? DEFAULTS.service,
    slo: num("slo", DEFAULTS.slo),
    windowDays: num("window", DEFAULTS.windowDays),
    metric: q.get("metric") ?? DEFAULTS.metric,
    base: q.get("base") ?? DEFAULTS.base,
    errors: q.get("errors") ?? DEFAULTS.errors,
    rps: q.has("rps") ? num("rps", 0) || undefined : DEFAULTS.rps,
    format: q.get("format") === "crd" ? "crd" : "rules",
  };
}

const PRESETS = [99, 99.5, 99.9, 99.95, 99.99];

export default function SloAlerts() {
  usePageMeta(META.title, META.blurb, "/tools/slo-alerts");
  const [inp, setInp] = useState<SloInput>(fromQuery);
  const set = <K extends keyof SloInput>(k: K, v: SloInput[K]) => setInp((s) => ({ ...s, [k]: v }));

  const valid = inp.slo > 0 && inp.slo < 100 && inp.windowDays >= 1 && inp.windowDays <= 365 && inp.metric.trim() !== "";
  const b = useMemo(() => budget(inp), [inp]);
  const t = useMemo(() => tiers(inp.windowDays), [inp.windowDays]);
  const yaml = useMemo(() => (valid ? rulesYaml(inp) : ""), [inp, valid]);

  useEffect(() => {
    const q = new URLSearchParams({
      service: inp.service,
      slo: String(inp.slo),
      window: String(inp.windowDays),
      metric: inp.metric,
      base: inp.base,
      errors: inp.errors,
      format: inp.format,
      ...(inp.rps ? { rps: String(inp.rps) } : {}),
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  }, [inp]);

  const download = () => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${inp.service || "service"}-slo-rules.yaml`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <ToolLayout slug="slo-alerts">
      <div className="t-grid">
        <section className="t-panel">
          <h2>1. Your SLO</h2>
          <div className="t-row">
            <div>
              <label className="t-label" htmlFor="slo">
                Target (%)
              </label>
              <input
                id="slo"
                className="t-input"
                type="number"
                step="0.01"
                min="50"
                max="99.999"
                value={inp.slo}
                onChange={(e) => set("slo", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="t-label" htmlFor="win">
                Window (days)
              </label>
              <input
                id="win"
                className="t-input"
                type="number"
                min="1"
                max="365"
                value={inp.windowDays}
                onChange={(e) => set("windowDays", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="t-label" htmlFor="rps">
                Avg requests/s (optional)
              </label>
              <input
                id="rps"
                className="t-input"
                type="number"
                min="0"
                value={inp.rps ?? ""}
                onChange={(e) => set("rps", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
          <div className="t-actions" style={{ marginTop: 0, marginBottom: 14 }}>
            {PRESETS.map((p) => (
              <button key={p} type="button" className="t-btn t-btn--ghost" onClick={() => set("slo", p)}>
                {p}%
              </button>
            ))}
          </div>

          <h3>Your metric</h3>
          <div className="t-row">
            <div>
              <label className="t-label" htmlFor="svc">
                Service name
              </label>
              <input id="svc" className="t-input" value={inp.service} onChange={(e) => set("service", e.target.value)} />
            </div>
            <div>
              <label className="t-label" htmlFor="metric">
                Request counter
              </label>
              <input id="metric" className="t-input" value={inp.metric} onChange={(e) => set("metric", e.target.value)} />
            </div>
          </div>
          <div className="t-row">
            <div>
              <label className="t-label" htmlFor="base">
                Labels for all requests
              </label>
              <input id="base" className="t-input" value={inp.base} onChange={(e) => set("base", e.target.value)} />
            </div>
            <div>
              <label className="t-label" htmlFor="err">
                Extra labels for bad requests
              </label>
              <input id="err" className="t-input" value={inp.errors} onChange={(e) => set("errors", e.target.value)} />
            </div>
          </div>
          <p className="t-hint">
            Error ratio = rate of <code>{inp.metric}{`{${[inp.base, inp.errors].filter(Boolean).join(",")}}`}</code> ÷
            rate of <code>{inp.metric}{`{${inp.base}}`}</code>
          </p>

          <h3>Error budget</h3>
          {valid ? (
            <div className="t-stats">
              <div className="t-stat">
                <b>{duration(b.window)}</b>
                <span>allowed downtime per {inp.windowDays} days</span>
              </div>
              <div className="t-stat">
                <b>{duration(b.week)}</b>
                <span>per week</span>
              </div>
              <div className="t-stat">
                <b>{duration(b.day)}</b>
                <span>per day</span>
              </div>
              {b.requests !== undefined && (
                <div className="t-stat">
                  <b>{Math.round(b.requests).toLocaleString()}</b>
                  <span>failed requests allowed per window</span>
                </div>
              )}
            </div>
          ) : (
            <p className="t-bad">Enter a target between 50 and 99.999 and a window of 1–365 days.</p>
          )}

          <h3>Alerts it creates</h3>
          <div className="t-scroll">
            <table className="t-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Windows</th>
                  <th>Burn rate</th>
                  <th>Fires above error rate</th>
                  <th>Budget gone in</th>
                </tr>
              </thead>
              <tbody>
                {t.used.map((x) => (
                  <tr key={x.long}>
                    <td className={x.severity === "page" ? "t-bad" : "t-mid"}>{x.severity}</td>
                    <td>
                      {x.long} and {x.short}
                    </td>
                    <td>{x.burn}×</td>
                    <td>{round(x.burn * b.bad * 100, 4)}%</td>
                    <td>{duration((inp.windowDays * 1440) / x.burn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {t.skipped.length > 0 && (
            <p className="t-hint">
              Skipped for a {inp.windowDays}-day window: {t.skipped.map((x) => `${x.long}`).join(", ")} (its burn rate would
              be below 1×, or the window is longer than the SLO window).
            </p>
          )}
        </section>

        <section className="t-panel">
          <h2>2. Prometheus rules</h2>
          <div className="t-actions" style={{ marginTop: 0 }}>
            <button
              type="button"
              className={`t-btn ${inp.format === "rules" ? "" : "t-btn--ghost"}`}
              onClick={() => set("format", "rules")}
            >
              Rules file
            </button>
            <button
              type="button"
              className={`t-btn ${inp.format === "crd" ? "" : "t-btn--ghost"}`}
              onClick={() => set("format", "crd")}
            >
              PrometheusRule (Operator)
            </button>
            {valid && (
              <button type="button" className="t-btn t-btn--ghost" onClick={download}>
                Download .yaml
              </button>
            )}
          </div>
          {valid && <CodeBlock title={inp.format === "crd" ? "prometheusrule.yaml" : "slo-rules.yaml"} code={yaml} />}
          <h3>How it works</h3>
          <p className="t-hint">
            Each alert needs both a long and a short window above the threshold. The long window proves the problem is
            real; the short one makes the alert stop soon after the problem is fixed. A fast burn pages someone; a slow
            burn opens a ticket. This is the multi-window, multi-burn-rate method from Google's SRE Workbook.
          </p>
          <CodeBlock
            title="check before you apply"
            code={
              inp.format === "crd"
                ? "kubectl apply --dry-run=server -f prometheusrule.yaml"
                : "promtool check rules slo-rules.yaml"
            }
          />
          <p className="t-hint">The link in your address bar keeps these settings, so you can share it with your team.</p>
        </section>
      </div>
    </ToolLayout>
  );
}
