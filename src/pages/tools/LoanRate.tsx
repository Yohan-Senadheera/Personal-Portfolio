import { useEffect, useMemo, useState } from "react";
import ToolLayout, { TOOLS, usePageMeta } from "./ToolLayout";
import { Loan, analyse } from "./loanEngine";

const META = TOOLS.find((t) => t.slug === "loan-rate")!;

const blank = (i: number): Loan => ({
  name: i === 0 ? "Lease (flat)" : i === 1 ? "Bank loan (reducing)" : `Offer ${String.fromCharCode(65 + i)}`,
  amount: 3_000_000,
  months: 60,
  rate: i === 0 ? 12 : 18,
  type: i === 0 ? "flat" : "reducing",
  fees: 0,
});

function fromQuery(): Loan[] {
  const raw = new URLSearchParams(window.location.search).get("l");
  if (!raw) return [blank(0), blank(1)];
  const out = raw
    .split(";")
    .slice(0, 3)
    .map((s, i) => {
      const [name, amount, months, rate, type, fees] = s.split("|");
      return {
        name: name || blank(i).name,
        amount: Number(amount) || 0,
        months: Number(months) || 12,
        rate: Number(rate) || 0,
        type: type === "flat" ? "flat" : "reducing",
        fees: Number(fees) || 0,
      } as Loan;
    });
  return out.length ? out : [blank(0)];
}

const n0 = (v: number) => Math.round(v).toLocaleString("en-LK");
const pct = (v: number) => `${v.toFixed(2)}%`;

function Field({ id, label, value, onChange, step = 1 }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <div>
      <label className="t-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="t-input"
        type="number"
        min="0"
        step={step}
        inputMode="decimal"
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </div>
  );
}

export default function LoanRate() {
  usePageMeta(META.title, META.blurb, "/tools/loan-rate");
  const [loans, setLoans] = useState<Loan[]>(fromQuery);
  const [flat, setFlat] = useState(12);
  const [years, setYears] = useState(5);
  const results = useMemo(() => loans.map(analyse), [loans]);
  const quick = useMemo(() => analyse({ name: "", amount: 1_000_000, months: years * 12, rate: flat, type: "flat", fees: 0 }), [flat, years]);
  const cheapest = results.length > 1 ? results.reduce((b, r, i) => (r.totalPaid < results[b].totalPaid ? i : b), 0) : -1;
  const [detail, setDetail] = useState(0);
  const d = results[Math.min(detail, results.length - 1)];

  useEffect(() => {
    const l = loans.map((x) => [x.name, x.amount, x.months, x.rate, x.type, x.fees].join("|")).join(";");
    window.history.replaceState(null, "", `${window.location.pathname}?l=${encodeURIComponent(l)}`);
  }, [loans]);

  const update = (i: number, patch: Partial<Loan>) => setLoans((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  return (
    <ToolLayout slug="loan-rate">
      <section className="t-panel">
        <h2>Quick check: what is a flat rate really?</h2>
        <div className="t-row" style={{ maxWidth: 480 }}>
          <Field id="qf" label="Flat rate (% a year)" value={flat} step={0.25} onChange={setFlat} />
          <Field id="qy" label="Years" value={years} step={1} onChange={(v) => setYears(Math.min(30, Math.max(1, v)))} />
        </div>
        <div className="t-stats">
          <div className="t-stat">
            <b className="t-big">{pct(quick.trueRate)}</b>
            <span>
              real yearly rate on a reducing balance for a {flat}% flat rate over {years} year{years === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <p className="t-hint" style={{ marginTop: 12 }}>
          A flat rate charges interest on the full amount for the whole term, even as you pay it back. A reducing-balance rate
          charges only on what you still owe. That is why a flat rate looks cheaper than it is.
        </p>
      </section>

      <section className="t-panel" style={{ marginTop: 20 }}>
        <h2>Compare offers</h2>
        <div className="t-offers">
          {loans.map((l, i) => (
            <div key={i} className="t-offer">
              <div className="t-offer__head">
                <input className="t-input t-offer__name" aria-label="Offer name" value={l.name} onChange={(e) => update(i, { name: e.target.value })} />
                {loans.length > 1 && (
                  <button type="button" className="t-btn t-btn--ghost" onClick={() => setLoans((ls) => ls.filter((_, k) => k !== i))}>
                    Remove
                  </button>
                )}
              </div>
              <div className="t-row">
                <Field id={`am${i}`} label="Amount (Rs.)" value={l.amount} step={50000} onChange={(v) => update(i, { amount: v })} />
                <Field id={`mo${i}`} label="Months" value={l.months} step={6} onChange={(v) => update(i, { months: Math.min(360, Math.max(1, Math.round(v))) })} />
              </div>
              <div className="t-row">
                <Field id={`ra${i}`} label="Rate (% a year)" value={l.rate} step={0.25} onChange={(v) => update(i, { rate: v })} />
                <Field id={`fe${i}`} label="Upfront fees (Rs.)" value={l.fees} step={1000} onChange={(v) => update(i, { fees: v })} />
              </div>
              <div className="t-actions" style={{ marginTop: 0 }}>
                <button type="button" className={`t-btn ${l.type === "flat" ? "" : "t-btn--ghost"}`} onClick={() => update(i, { type: "flat" })}>
                  Flat rate
                </button>
                <button
                  type="button"
                  className={`t-btn ${l.type === "reducing" ? "" : "t-btn--ghost"}`}
                  onClick={() => update(i, { type: "reducing" })}
                >
                  Reducing balance
                </button>
              </div>
            </div>
          ))}
        </div>
        {loans.length < 3 && (
          <div className="t-actions">
            <button type="button" className="t-btn" onClick={() => setLoans((ls) => [...ls, blank(ls.length)])}>
              + Add another offer
            </button>
          </div>
        )}

        <h3 style={{ marginTop: 22 }}>Result</h3>
        <p className="t-hint" style={{ marginTop: -4 }}>Amounts in rupees (Rs.)</p>
        <div className="t-scroll">
          <table className="t-table t-compare">
            <thead>
              <tr>
                <th />
                {loans.map((l, i) => (
                  <th key={i} className={i === cheapest ? "t-ok" : ""}>
                    {l.name}
                    {i === cheapest ? " ★ cheapest" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="t-strong">
                <td>Monthly payment</td>
                {results.map((r, i) => (
                  <td key={i}>{n0(r.payment)}</td>
                ))}
              </tr>
              <tr>
                <td>Total interest + fees</td>
                {results.map((r, i) => (
                  <td key={i}>{n0(r.interest)}</td>
                ))}
              </tr>
              <tr className="t-strong">
                <td>Total you pay</td>
                {results.map((r, i) => (
                  <td key={i}>{n0(r.totalPaid)}</td>
                ))}
              </tr>
              <tr>
                <td>Real yearly rate (reducing)</td>
                {results.map((r, i) => (
                  <td key={i}>{pct(r.trueRate)}</td>
                ))}
              </tr>
              <tr className="t-strong">
                <td>Real rate including fees</td>
                {results.map((r, i) => (
                  <td key={i}>{pct(r.trueRateFees)}</td>
                ))}
              </tr>
              <tr>
                <td>Effective annual rate</td>
                {results.map((r, i) => (
                  <td key={i}>{pct(r.effective)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="t-grid" style={{ marginTop: 20 }}>
        <section className="t-panel">
          <h2>Year by year</h2>
          {loans.length > 1 && (
            <div className="t-actions" style={{ marginTop: 0, marginBottom: 10 }}>
              {loans.map((l, i) => (
                <button key={i} type="button" className={`t-btn ${i === detail ? "" : "t-btn--ghost"}`} onClick={() => setDetail(i)}>
                  {l.name}
                </button>
              ))}
            </div>
          )}
          <div className="t-scroll">
            <table className="t-table t-compare">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Principal paid</th>
                  <th>Interest paid</th>
                  <th>Still owed</th>
                </tr>
              </thead>
              <tbody>
                {d?.years.map((y) => (
                  <tr key={y.year}>
                    <td>{y.year}</td>
                    <td>{n0(y.principal)}</td>
                    <td>{n0(y.interest)}</td>
                    <td>{n0(y.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="t-panel">
          <h2>How to read this</h2>
          <ul className="t-list">
            <li>
              <b>Real yearly rate</b> is the rate a normal reducing-balance loan would need to have the same monthly payment.
              Use it to compare any two offers fairly.
            </li>
            <li>
              <b>Including fees</b> treats upfront charges as money you never really received, so a loan with big fees costs
              more than its rate suggests.
            </li>
            <li>
              <b>Effective annual rate</b> adds the effect of monthly compounding.
            </li>
            <li>Ask the lender for the reducing-balance rate (sometimes called the APR) and all charges in writing before you sign.</li>
          </ul>
          <p className="t-hint">An estimate for comparison, not financial advice. Insurance and early-settlement charges are not included.</p>
        </section>
      </div>
    </ToolLayout>
  );
}
