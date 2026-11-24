// Shared expenses -> balances -> a short list of transfers. Amounts are kept in cents.

export type Expense = { what: string; amount: number; paidBy: number; split: number[] };
export type Transfer = { from: number; to: number; amount: number };

export function balances(people: string[], expenses: Expense[]) {
  const paid = people.map(() => 0);
  const share = people.map(() => 0);
  for (const e of expenses) {
    const cents = Math.round(e.amount * 100);
    const who = e.split.filter((i) => i >= 0 && i < people.length);
    if (cents <= 0 || !who.length || e.paidBy < 0 || e.paidBy >= people.length) continue;
    paid[e.paidBy] += cents;
    const each = Math.floor(cents / who.length);
    let left = cents - each * who.length;
    for (const i of who) {
      share[i] += each + (left > 0 ? 1 : 0);
      if (left > 0) left--;
    }
  }
  return people.map((_, i) => ({ paid: paid[i] / 100, share: share[i] / 100, net: (paid[i] - share[i]) / 100 }));
}

/** Greedy settle-up: the biggest debtor pays the biggest creditor until everyone is square. */
export function settle(nets: number[]): Transfer[] {
  const debt = nets.map((n, i) => ({ i, c: Math.round(n * 100) }));
  const out: Transfer[] = [];
  for (let guard = 0; guard < 500; guard++) {
    const cred = debt.filter((d) => d.c > 0).sort((a, b) => b.c - a.c)[0];
    const owe = debt.filter((d) => d.c < 0).sort((a, b) => a.c - b.c)[0];
    if (!cred || !owe) break;
    const amt = Math.min(cred.c, -owe.c);
    out.push({ from: owe.i, to: cred.i, amount: amt / 100 });
    cred.c -= amt;
    owe.c += amt;
  }
  return out;
}

export type SplitState = { cur: string; people: string[]; expenses: Expense[] };

export function encode(s: SplitState): string {
  const json = JSON.stringify(s);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decode(h: string): SplitState | null {
  try {
    const b64 = h.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    const s = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    if (!Array.isArray(s.people) || !Array.isArray(s.expenses)) return null;
    return { cur: String(s.cur ?? "Rs."), people: s.people.map(String).slice(0, 30), expenses: s.expenses.slice(0, 200) };
  } catch {
    return null;
  }
}
