import { useEffect, useMemo, useState } from "react";
import ToolLayout, { TOOLS, usePageMeta } from "./ToolLayout";
import { IRD_TABLE_URL, Offer, RULES_AS_OF, calc, grossFor, rs } from "./salaryEngine";

const META = TOOLS.find((t) => t.slug === "salary-lk")!;

const blank = (i: number): Offer => ({
  name: `Offer ${String.fromCharCode(65 + i)}`,
  basic: i === 0 ? 200000 : 0,
  allowances: 0,
  allowancesEpf: false,
  bonusMonths: 0,
});

function fromQuery(): Offer[] {
  const raw = new URLSearchParams(window.location.search).get("o");
  if (!raw) return [blank(0)];
  const offers = raw
    .split(";")
    .slice(0, 3)
    .map((s, i) => {
      const [name, basic, allowances, epf, bonus] = s.split("|");
      return {
        name: name || blank(i).name,
        basic: Number(basic) || 0,
        allowances: Number(allowances) || 0,
        allowancesEpf: epf === "1",
        bonusMonths: Number(bonus) || 0,
      };
    });
  return offers.length ? offers : [blank(0)];
}

function Num({ id, value, onChange, step = 1000 }: { id: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <input
      id={id}
      className="t-input"
      type="number"
      min="0"
      step={step}
      inputMode="numeric"
      value={value || ""}
      placeholder="0"
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
    />
  );
}

export default function SalaryLk() {
  usePageMeta(META.title, META.blurb, "/tools/salary-lk");
  const [offers, setOffers] = useState<Offer[]>(fromQuery);
  const [target, setTarget] = useState(150000);
  const results = useMemo(() => offers.map(calc), [offers]);
  const best = results.length > 1 ? results.reduce((b, r, i) => (r.yearValue > results[b].yearValue ? i : b), 0) : -1;

  useEffect(() => {
    const o = offers.map((x) => [x.name, x.basic, x.allowances, x.allowancesEpf ? 1 : 0, x.bonusMonths].join("|")).join(";");
    window.history.replaceState(null, "", `${window.location.pathname}?o=${encodeURIComponent(o)}`);
  }, [offers]);

  const n = (v: number) => Math.round(v).toLocaleString("en-LK");
  const update = (i: number, patch: Partial<Offer>) => setOffers((os) => os.map((o, k) => (k === i ? { ...o, ...patch } : o)));

  const rows: [string, (r: (typeof results)[number]) => string, string?][] = [
    ["Monthly gross", (r) => n(r.gross)],
    ["EPF (you, 8%)", (r) => `− ${n(r.epfEmployee)}`],
    ["APIT tax", (r) => `− ${n(r.apit)}`],
    ["Monthly take-home", (r) => n(r.takeHome), "strong"],
    ["Employer EPF (12%) + ETF (3%)", (r) => n(r.epfEmployer + r.etf)],
    ["Your tax band (marginal)", (r) => `${Math.round(r.marginal * 100)}%`],
    ["Tax as % of gross", (r) => `${(r.effective * 100).toFixed(1)}%`],
    ["Yearly bonus after tax", (r) => (r.bonus ? n(r.bonusNet) : "-")],
    ["Tax on the bonus", (r) => (r.bonus ? n(r.bonusTax) : "-")],
    ["Take-home per year", (r) => n(r.yearTakeHome), "strong"],
    ["Into EPF + ETF per year", (r) => n(r.yearSavings)],
    ["Total value per year", (r) => n(r.yearValue), "strong"],
  ];

  const g = grossFor(target);

  return (
    <ToolLayout slug="salary-lk">
      <section className="t-panel">
        <h2>1. Your offer{offers.length > 1 ? "s" : ""}</h2>
        <div className="t-offers">
          {offers.map((o, i) => (
            <div key={i} className="t-offer">
              <div className="t-offer__head">
                <input
                  className="t-input t-offer__name"
                  value={o.name}
                  aria-label="Offer name"
                  onChange={(e) => update(i, { name: e.target.value })}
                />
                {offers.length > 1 && (
                  <button type="button" className="t-btn t-btn--ghost" onClick={() => setOffers((os) => os.filter((_, k) => k !== i))}>
                    Remove
                  </button>
                )}
              </div>
              <label className="t-label" htmlFor={`b${i}`}>
                Basic salary per month (Rs.)
              </label>
              <Num id={`b${i}`} value={o.basic} onChange={(n) => update(i, { basic: n })} />
              <label className="t-label" htmlFor={`a${i}`} style={{ marginTop: 10 }}>
                Fixed allowances per month (Rs.)
              </label>
              <Num id={`a${i}`} value={o.allowances} onChange={(n) => update(i, { allowances: n })} />
              <label className="t-check">
                <input type="checkbox" checked={o.allowancesEpf} onChange={(e) => update(i, { allowancesEpf: e.target.checked })} />
                EPF/ETF are paid on the allowances too
              </label>
              <label className="t-label" htmlFor={`bo${i}`} style={{ marginTop: 10 }}>
                Yearly bonus (months of basic)
              </label>
              <Num id={`bo${i}`} value={o.bonusMonths} step={0.5} onChange={(n) => update(i, { bonusMonths: n })} />
            </div>
          ))}
        </div>
        {offers.length < 3 && (
          <div className="t-actions">
            <button type="button" className="t-btn" onClick={() => setOffers((os) => [...os, blank(os.length)])}>
              + Compare another offer
            </button>
          </div>
        )}
      </section>

      <section className="t-panel" style={{ marginTop: 20 }}>
        <h2>2. What you really get</h2>
        <p className="t-hint" style={{ marginTop: -6 }}>Amounts in rupees (Rs.)</p>
        <div className="t-scroll">
          <table className="t-table t-compare">
            <thead>
              <tr>
                <th />
                {offers.map((o, i) => (
                  <th key={i} className={i === best ? "t-ok" : ""}>
                    {o.name}
                    {i === best ? " ★ best" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, f, style]) => (
                <tr key={label} className={style === "strong" ? "t-strong" : ""}>
                  <td>{label}</td>
                  {results.map((r, i) => (
                    <td key={i}>{f(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="t-hint" style={{ marginTop: 12 }}>
          "Total value" adds what goes into your EPF and ETF accounts (yours and your employer's share), because you get it
          back later. When comparing offers, also look at medical cover, vehicle or fuel allowances, and how often salaries
          are reviewed.
        </p>
      </section>

      <div className="t-grid" style={{ marginTop: 20 }}>
        <section className="t-panel">
          <h2>3. Reverse: what salary do I need?</h2>
          <label className="t-label" htmlFor="target">
            Take-home I want per month (Rs.)
          </label>
          <Num id="target" value={target} onChange={setTarget} step={5000} />
          <div className="t-stats" style={{ marginTop: 14 }}>
            <div className="t-stat">
              <b>{rs(g)}</b>
              <span>basic salary to ask for (EPF on basic, no allowances)</span>
            </div>
          </div>
        </section>

        <section className="t-panel">
          <h2>How it's calculated</h2>
          <ul className="t-list">
            <li>EPF: you pay 8% of your basic (and of allowances that count for EPF); your employer adds 12%.</li>
            <li>ETF: your employer pays 3% on the same amount. Neither employer share is taxed.</li>
            <li>
              APIT: the first Rs. 150,000 a month is tax-free, then 6%, 18%, 24%, 30% and 36% in bands, from the Inland
              Revenue Department's{" "}
              <a href={IRD_TABLE_URL} target="_blank" rel="noopener noreferrer">
                Tax Table No. 01 (2025/26)
              </a>
              . Your EPF contribution does not reduce the tax.
            </li>
            <li>Bonus tax is the extra tax the bonus adds over the year. Employers deduct it with Tax Table No. 02, so the month it is paid may differ, but the year total is the same.</li>
          </ul>
          <p className="t-hint">
            Rules as of {RULES_AS_OF}. Tax rules can change in a Budget, so check the IRD tables before relying on it. This is
            an estimate, not tax advice.
          </p>
        </section>
      </div>
    </ToolLayout>
  );
}
