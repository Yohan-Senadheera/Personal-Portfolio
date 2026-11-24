// Flat-rate vs reducing-balance loans. Monthly payments, true rate by IRR.

export type LoanType = "flat" | "reducing";

export type Loan = {
  name: string;
  amount: number; // amount borrowed
  months: number;
  rate: number; // yearly rate in %
  type: LoanType;
  fees: number; // upfront charges paid at the start (documentation, valuation...)
};

export type LoanResult = {
  payment: number;
  totalPaid: number;
  interest: number;
  trueRate: number; // nominal yearly rate on a reducing balance, % (monthly rate x 12)
  trueRateFees: number; // the same, counting upfront fees
  effective: number; // effective annual rate with fees, %
  years: { year: number; principal: number; interest: number; balance: number }[];
};

export function payment(l: Loan): number {
  if (l.amount <= 0 || l.months <= 0) return 0;
  if (l.type === "flat") return (l.amount * (1 + (l.rate / 100) * (l.months / 12))) / l.months;
  const i = l.rate / 100 / 12;
  if (i === 0) return l.amount / l.months;
  return (l.amount * i) / (1 - Math.pow(1 + i, -l.months));
}

/** Monthly rate i such that the present value of n payments equals `received`. */
export function monthlyRate(received: number, pay: number, n: number): number {
  if (received <= 0 || pay <= 0 || n <= 0 || pay * n <= received) return 0;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const pv = (pay * (1 - Math.pow(1 + mid, -n))) / mid;
    if (pv > received) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function analyse(l: Loan): LoanResult {
  const pay = payment(l);
  const n = Math.round(l.months);
  const i = monthlyRate(l.amount, pay, n);
  const iFees = monthlyRate(l.amount - Math.max(0, l.fees), pay, n);
  const years: LoanResult["years"] = [];
  let balance = l.amount;
  for (let m = 1; m <= n; m++) {
    const int = balance * i;
    const prin = pay - int;
    balance = Math.max(0, balance - prin);
    const y = Math.ceil(m / 12);
    if (!years[y - 1]) years[y - 1] = { year: y, principal: 0, interest: 0, balance: 0 };
    years[y - 1].principal += prin;
    years[y - 1].interest += int;
    years[y - 1].balance = balance;
  }
  const totalPaid = pay * n + Math.max(0, l.fees);
  return {
    payment: pay,
    totalPaid,
    interest: totalPaid - l.amount,
    trueRate: i * 12 * 100,
    trueRateFees: iFees * 12 * 100,
    effective: (Math.pow(1 + iFees, 12) - 1) * 100,
    years,
  };
}
