import { useEffect, useState } from "react";
import ToolLayout, { CodeBlock, TOOLS, usePageMeta } from "./ToolLayout";
import { CertInfo, Issue, Report, derToPem, inspect } from "./certs";
import { CERT_SAMPLES } from "./certSamples";

const META = TOOLS[2];

const fmt = (d?: Date) => (d ? d.toISOString().replace("T", " ").slice(0, 16) + " UTC" : "-");

function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <div className="t-findings" style={{ marginBottom: 12 }}>
      {issues.map((i) => (
        <div key={i.text} className={`t-find t-find--${i.level}`} style={{ padding: "10px 14px" }}>
          <p style={{ margin: 0 }}>
            <span className={`t-sev t-sev--${i.level}`}>{i.level}</span>
            {i.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function CertCard({ c }: { c: CertInfo }) {
  const days =
    c.daysLeft === undefined ? null : c.daysLeft < 0 ? (
      <span className="t-bad">expired {-c.daysLeft} days ago</span>
    ) : (
      <span className={c.daysLeft < 7 ? "t-bad" : c.daysLeft < 30 ? "t-mid" : "t-ok"}>{c.daysLeft} days left</span>
    );
  return (
    <article className="t-cert">
      <div className="t-cert__head">
        <b>{c.cn}</b>
        <span className={`t-sev t-sev--${c.role === "leaf" || c.role === "csr" ? "info" : c.role === "unrelated" ? "warn" : "ok"}`}>
          {c.role === "csr" ? "CSR" : c.role}
        </span>
      </div>
      <IssueList issues={c.issues} />
      <dl className="t-kv">
        <dt>Subject</dt>
        <dd>{c.subject}</dd>
        {c.kind === "cert" && (
          <>
            <dt>Issuer</dt>
            <dd>{c.issuer}</dd>
            <dt>Valid</dt>
            <dd>
              {fmt(c.notBefore)} → {fmt(c.notAfter)} · {days}
            </dd>
          </>
        )}
        {c.sans.length > 0 && (
          <>
            <dt>Names (SAN)</dt>
            <dd>{c.sans.map((s) => s.replace(/^(\w+):/, (_, t) => (t === "dns" ? "" : `${t.toUpperCase()} `))).join(", ")}</dd>
          </>
        )}
        <dt>Key</dt>
        <dd className={c.keyWeak ? "t-bad" : ""}>{c.key}</dd>
        <dt>Signature</dt>
        <dd className={c.sigSha1 ? "t-mid" : ""}>{c.sig}</dd>
        {c.kind === "cert" && (
          <>
            <dt>CA</dt>
            <dd>
              {c.isCA ? "yes" : "no"}
              {c.pathLen !== undefined ? ` (path length ${c.pathLen})` : ""}
              {c.selfSigned ? " · self-signed" : ""}
            </dd>
          </>
        )}
        {c.keyUsage.length > 0 && (
          <>
            <dt>Key usage</dt>
            <dd>{c.keyUsage.join(", ")}</dd>
          </>
        )}
        {c.eku.length > 0 && (
          <>
            <dt>Extended usage</dt>
            <dd>{c.eku.join(", ")}</dd>
          </>
        )}
        {c.serial && (
          <>
            <dt>Serial</dt>
            <dd>{c.serial}</dd>
          </>
        )}
        <dt>SHA-256</dt>
        <dd style={{ fontSize: 11.5 }}>{c.fingerprint}</dd>
      </dl>
    </article>
  );
}

export default function CertInspector() {
  usePageMeta(META.title, META.blurb, "/tools/cert-inspector");
  const [text, setText] = useState("");
  const [host, setHost] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    if (!text.trim()) {
      setReport(null);
      setErr("");
      return;
    }
    inspect(text, host)
      .then((r) => {
        if (!live) return;
        setReport(r);
        setErr(r.certs.length || r.privateKey ? "" : "No PEM blocks found. Paste text that starts with -----BEGIN CERTIFICATE-----.");
      })
      .catch((e) => live && setErr(String(e)));
    return () => {
      live = false;
    };
  }, [text, host]);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const parts: string[] = [];
    for (const f of Array.from(files)) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const asText = new TextDecoder().decode(bytes);
      parts.push(asText.includes("-----BEGIN") ? asText : derToPem(bytes));
    }
    setText((t) => [t.trim(), ...parts].filter(Boolean).join("\n"));
  };

  const h = report?.hostname?.name || report?.chain[0]?.sans.find((s) => s.startsWith("dns:") && !s.includes("*"))?.slice(4) || "example.com";
  const cmds = [
    `# see what a server really sends`,
    `openssl s_client -connect ${h}:443 -servername ${h} -showcerts </dev/null`,
    `# verify a chain against a root`,
    `openssl verify -CAfile root.pem -untrusted intermediates.pem leaf.pem`,
    `# check a private key matches the certificate (the two hashes must be equal)`,
    `openssl x509 -in leaf.pem -noout -pubkey | openssl sha256`,
    `openssl pkey -in leaf.key -pubout | openssl sha256`,
    `# read one certificate in full`,
    `openssl x509 -in leaf.pem -noout -text`,
  ].join("\n");

  return (
    <ToolLayout slug="cert-inspector">
      <div className="t-grid">
        <section className="t-panel">
          <h2>1. Paste certificates</h2>
          <label className="t-label" htmlFor="ci-in">
            One or more PEM certificates (a full chain or bundle), or a CSR
          </label>
          <textarea
            id="ci-in"
            className="t-textarea"
            spellCheck={false}
            placeholder={"-----BEGIN CERTIFICATE-----\nMIIF...\n-----END CERTIFICATE-----"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="t-row" style={{ marginTop: 12 }}>
            <div>
              <label className="t-label" htmlFor="ci-host">
                Hostname to check (optional)
              </label>
              <input id="ci-host" className="t-input" placeholder="api.example.com" value={host} onChange={(e) => setHost(e.target.value)} />
            </div>
            <div>
              <label className="t-label" htmlFor="ci-file">
                Or open files (.pem, .crt, .cer, .der)
              </label>
              <input id="ci-file" className="t-input" type="file" multiple accept=".pem,.crt,.cer,.der,.csr,.txt" onChange={(e) => onFiles(e.target.files)} />
            </div>
          </div>
          <div className="t-actions">
            <span className="t-hint">Try an example:</span>
            {CERT_SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                className="t-btn t-btn--ghost"
                onClick={() => {
                  setText(s.text);
                  setHost(s.host);
                }}
              >
                {s.label}
              </button>
            ))}
            {text && (
              <button
                type="button"
                className="t-btn t-btn--ghost"
                onClick={() => {
                  setText("");
                  setHost("");
                }}
              >
                Clear
              </button>
            )}
          </div>
          <p className="t-hint" style={{ marginTop: 14 }}>
            Never paste a private key into any website. If you paste one here by mistake, it is ignored and never leaves
            your browser.
          </p>
        </section>

        <section className="t-panel" aria-live="polite">
          <h2>2. Report</h2>
          {!report && !err && (
            <p className="t-hint">
              Paste a bundle to see each certificate's expiry, names and key, whether the chain is complete and in the right
              order, and a fixed bundle you can copy straight into nginx, an Ingress secret or Key Vault.
            </p>
          )}
          {err && <p className="t-bad">{err}</p>}
          {report && (
            <>
              <IssueList issues={report.issues} />
              {report.chain.length > 0 && (
                <>
                  <h3>Chain (leaf first)</h3>
                  <div className="t-chain">
                    {report.chain.map((c, i) => (
                      <div key={c.fingerprint}>
                        {i > 0 && <p className="t-link">↑ {report.chain[i - 1].cn} was signed by:</p>}
                        <CertCard c={c} />
                      </div>
                    ))}
                  </div>
                </>
              )}
              {report.certs.filter((c) => !report.chain.includes(c)).length > 0 && (
                <>
                  <h3>Other blocks</h3>
                  <div className="t-chain">
                    {report.certs
                      .filter((c) => !report.chain.includes(c))
                      .map((c) => (
                        <CertCard key={c.fingerprint} c={c} />
                      ))}
                  </div>
                </>
              )}
              {report.chain.length > 0 && (
                <>
                  <h3>Fixed bundle</h3>
                  <p className="t-hint">Leaf first, then intermediates. The root is left out because clients already trust it.</p>
                  <CodeBlock title="fullchain.pem" code={report.fixedBundle} />
                </>
              )}
            </>
          )}
          <h3>Useful openssl commands</h3>
          <CodeBlock title="bash" code={cmds} />
        </section>
      </div>
    </ToolLayout>
  );
}
