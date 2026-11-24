import { useMemo, useState } from "react";
import ToolLayout, { CodeBlock, CopyButton, TOOLS, usePageMeta } from "./ToolLayout";
import { diagnose, toMarkdown } from "./podEngine";
import { POD_SAMPLES } from "./podSamples";

const META = TOOLS[0];

export default function PodDoctor() {
  usePageMeta(META.title, META.blurb, "/tools/pod-doctor");
  const [text, setText] = useState("");
  const result = useMemo(() => (text.trim() ? diagnose(text) : null), [text]);

  return (
    <ToolLayout slug="pod-doctor">
      <div className="t-grid">
        <section className="t-panel">
          <h2>1. Paste the pod description</h2>
          <label className="t-label" htmlFor="pd-in">
            Output of <code>kubectl describe pod &lt;name&gt;</code> (the Events section at the bottom matters most)
          </label>
          <textarea
            id="pd-in"
            className="t-textarea"
            spellCheck={false}
            placeholder={"Name:         my-app-6d4f...\nNamespace:    default\nStatus:       Pending\n...\nEvents:\n  Type     Reason   Age   From   Message"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="t-actions">
            <span className="t-hint">Try an example:</span>
            {POD_SAMPLES.map((s) => (
              <button key={s.label} type="button" className="t-btn t-btn--ghost" onClick={() => setText(s.text)}>
                {s.label}
              </button>
            ))}
            {text && (
              <button type="button" className="t-btn t-btn--ghost" onClick={() => setText("")}>
                Clear
              </button>
            )}
          </div>
        </section>

        <section className="t-panel" aria-live="polite">
          <h2>2. Diagnosis</h2>
          {!result && (
            <p className="t-hint">
              Paste a description on the left, or pick an example. Pod Doctor recognises scheduling failures, image pull
              errors, crash loops (with the exit code explained), OOMKilled, missing Secrets and ConfigMaps, probe
              failures, volume and network errors, and evictions.
            </p>
          )}
          {result && (
            <>
              {(result.pod.name || result.pod.status) && (
                <dl className="t-kv" style={{ marginBottom: 14 }}>
                  {result.pod.name && (
                    <>
                      <dt>Pod</dt>
                      <dd>{result.pod.name}</dd>
                    </>
                  )}
                  {result.pod.namespace && (
                    <>
                      <dt>Namespace</dt>
                      <dd>{result.pod.namespace}</dd>
                    </>
                  )}
                  {result.pod.status && (
                    <>
                      <dt>Status</dt>
                      <dd>{result.pod.status}</dd>
                    </>
                  )}
                  {result.pod.node && (
                    <>
                      <dt>Node</dt>
                      <dd>{result.pod.node}</dd>
                    </>
                  )}
                  {result.pod.containers.length > 0 && (
                    <>
                      <dt>Containers</dt>
                      <dd>
                        {result.pod.containers.map((c) => (
                          <div key={`${c.init}-${c.name}`}>
                            {c.init ? "init: " : ""}
                            {c.name} {c.stateReason ?? c.state ?? ""}
                            {c.restarts ? ` · ${c.restarts} restarts` : ""}
                          </div>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
              )}
              <div className="t-findings">
                {result.findings.map((f) => (
                  <article key={f.id} className={`t-find t-find--${f.severity}`}>
                    <h3>
                      <span className={`t-sev t-sev--${f.severity}`}>{f.severity === "ok" ? "ok" : f.severity}</span>
                      {f.title}
                    </h3>
                    <p>{f.why}</p>
                    {f.evidence.filter(Boolean).length > 0 && <blockquote>{f.evidence.filter(Boolean).join("\n")}</blockquote>}
                    {f.fixes.length > 0 && (
                      <ul>
                        {f.fixes.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    )}
                    {f.commands.length > 0 && <CodeBlock title="next commands" code={f.commands.join("\n")} />}
                  </article>
                ))}
              </div>
              <div className="t-actions">
                <CopyButton text={toMarkdown(result.pod, result.findings)} label="Copy report (Markdown)" />
              </div>
            </>
          )}
        </section>
      </div>
    </ToolLayout>
  );
}
