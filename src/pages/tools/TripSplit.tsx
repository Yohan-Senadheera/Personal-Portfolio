import { useEffect, useMemo, useState } from "react";
import ToolLayout, { CopyButton, TOOLS, usePageMeta } from "./ToolLayout";
import { Expense, SplitState, balances, decode, encode, settle } from "./splitEngine";

const META = TOOLS.find((t) => t.slug === "split")!;

const EXAMPLE: SplitState = {
  cur: "Rs.",
  people: ["Kamal", "Nimal", "Sunil", "Amara"],
  expenses: [
    { what: "Hotel in Ella", amount: 24000, paidBy: 0, split: [0, 1, 2, 3] },
    { what: "Fuel", amount: 9000, paidBy: 1, split: [0, 1, 2, 3] },
    { what: "Dinner", amount: 7500, paidBy: 2, split: [0, 1, 2] },
  ],
};

const EMPTY: SplitState = { cur: "Rs.", people: ["", ""], expenses: [] };

const KEY = "trip-split:last";

function load(): SplitState {
  const h = window.location.hash.slice(1);
  const fromLink = h && decode(h);
  if (fromLink) return fromLink;
  try {
    const saved = localStorage.getItem(KEY);
    return (saved && decode(saved)) || EMPTY;
  } catch {
    return EMPTY;
  }
}

export default function TripSplit() {
  usePageMeta(META.title, META.blurb, "/tools/split");
  const [s, setS] = useState<SplitState>(load);
  const people = s.people.map((p, i) => p.trim() || `Person ${i + 1}`);
  const all = s.people.map((_, i) => i);
  const [draft, setDraft] = useState<Expense>({ what: "", amount: 0, paidBy: 0, split: all });

  // whenever the group changes size, new expenses default to everyone
  useEffect(() => {
    setDraft((d) => ({ ...d, paidBy: Math.min(d.paidBy, s.people.length - 1), split: s.people.map((_, i) => i) }));
  }, [s.people.length]);

  useEffect(() => {
    const empty = s.expenses.length === 0 && s.people.every((p) => !p.trim());
    window.history.replaceState(null, "", empty ? window.location.pathname : `${window.location.pathname}#${encode(s)}`);
    try {
      if (empty) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, encode(s));
    } catch {
      /* private mode: the link still works */
    }
  }, [s]);

  const bal = useMemo(() => balances(people, s.expenses), [people, s.expenses]);
  const transfers = useMemo(() => settle(bal.map((b) => b.net)), [bal]);
  const total = s.expenses.reduce((t, e) => t + (e.amount > 0 ? e.amount : 0), 0);
  const money = (v: number) => `${s.cur} ${v.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const setPeople = (ps: string[]) => {
    setS((x) => ({
      ...x,
      people: ps,
      expenses: x.expenses
        .filter((e) => e.paidBy < ps.length)
        .map((e) => ({ ...e, split: e.split.filter((i) => i < ps.length) })),
    }));
    setDraft((d) => ({ ...d, paidBy: Math.min(d.paidBy, ps.length - 1), split: ps.map((_, i) => i) }));
  };

  const addExpense = () => {
    if (!(draft.amount > 0) || !draft.split.length) return;
    setS((x) => ({ ...x, expenses: [...x.expenses, { ...draft, what: draft.what.trim() || `Expense ${x.expenses.length + 1}` }] }));
    setDraft({ what: "", amount: 0, paidBy: draft.paidBy, split: all });
  };

  const summary = [
    `Trip total: ${money(total)}`,
    ...transfers.map((t) => `${people[t.from]} pays ${people[t.to]} ${money(t.amount)}`),
    transfers.length ? "" : "Everyone is square.",
    `Details: ${window.location.href}`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return (
    <ToolLayout slug="split">
      <div className="t-grid">
        <section className="t-panel">
          <h2>1. Who's in?</h2>
          <div className="t-people">
            {s.people.map((p, i) => (
              <div key={i} className="t-person">
                <input
                  className="t-input"
                  placeholder={`Person ${i + 1}`}
                  value={p}
                  aria-label={`Person ${i + 1}`}
                  onChange={(e) => setPeople(s.people.map((q, k) => (k === i ? e.target.value : q)))}
                />
                {s.people.length > 2 && (
                  <button
                    type="button"
                    className="t-btn t-btn--ghost"
                    aria-label={`Remove ${people[i]}`}
                    onClick={() => {
                      if (s.expenses.some((e) => e.paidBy === i)) return;
                      const keep = s.people.filter((_, k) => k !== i);
                      setS((x) => ({
                        ...x,
                        people: keep,
                        expenses: x.expenses.map((e) => ({
                          ...e,
                          paidBy: e.paidBy > i ? e.paidBy - 1 : e.paidBy,
                          split: e.split.filter((k) => k !== i).map((k) => (k > i ? k - 1 : k)),
                        })),
                      }));
                      setDraft((d) => ({ ...d, paidBy: 0, split: keep.map((_, k) => k) }));
                    }}
                    title={s.expenses.some((e) => e.paidBy === i) ? "Remove their expenses first" : "Remove"}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="t-actions">
            {s.people.length < 30 && (
              <button type="button" className="t-btn t-btn--ghost" onClick={() => setPeople([...s.people, ""])}>
                + Add person
              </button>
            )}
            <button type="button" className="t-btn t-btn--ghost" onClick={() => setS(EXAMPLE)}>
              Try an example
            </button>
            <button
              type="button"
              className="t-btn t-btn--ghost"
              onClick={() => {
                if (
                  s.expenses.length &&
                  !window.confirm("Start a new trip? This clears the current one. Copy its share link first if you want to keep it.")
                )
                  return;
                setS(EMPTY);
                setDraft({ what: "", amount: 0, paidBy: 0, split: [0, 1] });
              }}
            >
              New trip
            </button>
          </div>

          <h3>2. Add what each person paid</h3>
          <div className="t-row">
            <div>
              <label className="t-label" htmlFor="what">
                What for
              </label>
              <input id="what" className="t-input" placeholder="Hotel, fuel, dinner..." value={draft.what} onChange={(e) => setDraft({ ...draft, what: e.target.value })} />
            </div>
            <div>
              <label className="t-label" htmlFor="amt">
                Amount ({s.cur})
              </label>
              <input
                id="amt"
                className="t-input"
                type="number"
                min="0"
                inputMode="decimal"
                value={draft.amount || ""}
                onChange={(e) => setDraft({ ...draft, amount: Math.max(0, Number(e.target.value) || 0) })}
                onKeyDown={(e) => e.key === "Enter" && addExpense()}
              />
            </div>
            <div>
              <label className="t-label" htmlFor="by">
                Paid by
              </label>
              <select id="by" className="t-select" value={draft.paidBy} onChange={(e) => setDraft({ ...draft, paidBy: Number(e.target.value) })}>
                {people.map((p, i) => (
                  <option key={i} value={i}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className="t-label">Split between</span>
          <div className="t-chips">
            {people.map((p, i) => (
              <label key={i} className={`t-chip ${draft.split.includes(i) ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={draft.split.includes(i)}
                  onChange={(e) =>
                    setDraft({ ...draft, split: e.target.checked ? [...draft.split, i].sort((a, b) => a - b) : draft.split.filter((k) => k !== i) })
                  }
                />
                {p}
              </label>
            ))}
          </div>
          <div className="t-actions">
            <button type="button" className="t-btn" onClick={addExpense} disabled={!(draft.amount > 0) || !draft.split.length}>
              Add expense
            </button>
          </div>

          {s.expenses.length > 0 && (
            <div className="t-scroll" style={{ marginTop: 14 }}>
              <table className="t-table">
                <tbody>
                  {s.expenses.map((e, i) => (
                    <tr key={i}>
                      <td>
                        <b>{e.what}</b>
                        <div className="t-hint">
                          {people[e.paidBy]} paid · split {e.split.length === people.length ? "between everyone" : `between ${e.split.map((k) => people[k]).join(", ")}`}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{money(e.amount)}</td>
                      <td style={{ width: 40 }}>
                        <button
                          type="button"
                          className="t-btn t-btn--ghost"
                          aria-label={`Remove ${e.what}`}
                          onClick={() => setS((x) => ({ ...x, expenses: x.expenses.filter((_, k) => k !== i) }))}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="t-panel" aria-live="polite">
          <h2>3. Who pays whom</h2>
          {s.expenses.length === 0 ? (
            <p className="t-hint">Add names and a few expenses, or try the example. The result appears here.</p>
          ) : (
            <>
              <div className="t-stats" style={{ marginBottom: 16 }}>
                <div className="t-stat">
                  <b>{money(total)}</b>
                  <span>trip total</span>
                </div>
                <div className="t-stat">
                  <b>{transfers.length}</b>
                  <span>transfer{transfers.length === 1 ? "" : "s"} to settle up</span>
                </div>
              </div>
              <div className="t-findings">
                {transfers.length === 0 && (
                  <div className="t-find t-find--ok">
                    <p style={{ margin: 0 }}>Everyone is square.</p>
                  </div>
                )}
                {transfers.map((t, i) => (
                  <div key={i} className="t-find t-find--ok t-transfer">
                    <span>
                      <b>{people[t.from]}</b> pays <b>{people[t.to]}</b>
                    </span>
                    <b className="t-ok">{money(t.amount)}</b>
                  </div>
                ))}
              </div>
              <h3>Balances</h3>
              <div className="t-scroll">
                <table className="t-table t-compare">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Paid</th>
                      <th>Share</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bal.map((b, i) => (
                      <tr key={i}>
                        <td>{people[i]}</td>
                        <td>{money(b.paid)}</td>
                        <td>{money(b.share)}</td>
                        <td className={b.net > 0.004 ? "t-ok" : b.net < -0.004 ? "t-bad" : ""}>
                          {b.net > 0 ? "+" : ""}
                          {money(b.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="t-actions">
                <CopyButton text={summary} label="Copy for WhatsApp" />
                <CopyButton text={window.location.href} label="Copy share link" />
              </div>
              <p className="t-hint" style={{ marginTop: 10 }}>
                Your trip is saved in this browser, so it is still here if you close the tab ("New trip" clears it). The
                share link holds the whole trip after the #, which is never sent to any server; anyone with the link gets
                their own copy to view or edit.
              </p>
            </>
          )}
          <div className="t-row" style={{ marginTop: 16, maxWidth: 200 }}>
            <div>
              <label className="t-label" htmlFor="cur">
                Currency
              </label>
              <input id="cur" className="t-input" value={s.cur} maxLength={5} onChange={(e) => setS((x) => ({ ...x, cur: e.target.value }))} />
            </div>
          </div>
        </section>
      </div>
    </ToolLayout>
  );
}
