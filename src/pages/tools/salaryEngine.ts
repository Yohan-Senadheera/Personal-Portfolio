// Sri Lanka take-home pay: EPF, ETF and APIT (tax on employment income).
// Source: Inland Revenue Department, APIT Tax Table No. 01 (2025/2026), still in force as of 24 Nov 2026.
// Personal relief Rs. 150,000 a month (Rs. 1,800,000 a year).

export const RULES_AS_OF = "24 November 2026";
export const IRD_TABLE_URL =
  "https://www.ird.gov.lk/en/publications/sitepages/apit_tax_tables.aspx?menuid=1502";

/** Monthly bands from IRD Tax Table 01: [upper limit, rate, less]. */
const MONTHLY: [number, number, number][] = [
  [150_000, 0, 0],
  [233_333, 0.06, 9_000],
  [275_000, 0.18, 37_000],
  [316_667, 0.24, 53_500],
  [358_333, 0.3, 72_500],
  [Infinity, 0.36, 94_000],
];

/** Annual bands (the same schedule over a full year). */
const ANNUAL: [number, number][] = [
  [1_800_000, 0],
  [1_000_000, 0.06],
  [500_000, 0.18],
  [500_000, 0.24],
  [500_000, 0.3],
  [Infinity, 0.36],
];

export function monthlyApit(regular: number): number {
  if (regular <= 150_000) return 0;
  const [, rate, less] = MONTHLY.find(([upTo]) => regular <= upTo)!;
  return Math.max(0, Math.round(regular * rate - less));
}

export function marginalRate(regular: number): number {
  return MONTHLY.find(([upTo]) => regular <= upTo)![1];
}

export function annualTax(income: number): { total: number; bands: { from: number; to: number; rate: number; tax: number }[] } {
  let left = income;
  let from = 0;
  let total = 0;
  const bands = [];
  for (const [size, rate] of ANNUAL) {
    if (left <= 0) break;
    const part = Math.min(left, size);
    const tax = part * rate;
    bands.push({ from, to: from + part, rate, tax });
    total += tax;
    left -= part;
    from += part;
  }
  return { total: Math.round(total), bands };
}

export type Offer = {
  name: string;
  basic: number; // monthly basic salary
  allowances: number; // fixed monthly allowances (taxable)
  allowancesEpf: boolean; // do the allowances count for EPF/ETF?
  bonusMonths: number; // yearly bonus, in months of basic
};

export type Result = {
  gross: number;
  epfBase: number;
  epfEmployee: number;
  apit: number;
  takeHome: number;
  epfEmployer: number;
  etf: number;
  costToEmployer: number;
  marginal: number;
  effective: number;
  bonus: number;
  bonusTax: number;
  bonusNet: number;
  yearTakeHome: number;
  yearSavings: number; // EPF (both shares) + ETF going into funds
  yearValue: number;
  bands: ReturnType<typeof annualTax>["bands"];
};

export function calc(o: Offer): Result {
  const gross = Math.max(0, o.basic) + Math.max(0, o.allowances);
  const epfBase = Math.max(0, o.basic) + (o.allowancesEpf ? Math.max(0, o.allowances) : 0);
  const epfEmployee = Math.round(epfBase * 0.08);
  const epfEmployer = Math.round(epfBase * 0.12);
  const etf = Math.round(epfBase * 0.03);
  const apit = monthlyApit(gross);
  const takeHome = gross - epfEmployee - apit;
  const bonus = Math.max(0, o.basic) * Math.max(0, o.bonusMonths);
  // Bonus tax: the extra annual tax the bonus causes (employers deduct it with Table 02; this is the year-end effect).
  const regularYear = annualTax(gross * 12);
  const withBonus = annualTax(gross * 12 + bonus);
  const bonusTax = withBonus.total - regularYear.total;
  const bonusNet = bonus - bonusTax;
  const yearTakeHome = takeHome * 12 + bonusNet;
  const yearSavings = (epfEmployee + epfEmployer + etf) * 12;
  return {
    gross,
    epfBase,
    epfEmployee,
    apit,
    takeHome,
    epfEmployer,
    etf,
    costToEmployer: gross + epfEmployer + etf,
    marginal: marginalRate(gross),
    effective: gross ? apit / gross : 0,
    bonus,
    bonusTax,
    bonusNet,
    yearTakeHome,
    yearSavings,
    yearValue: yearTakeHome + yearSavings,
    bands: withBonus.bands,
  };
}

/** Basic salary (allowances 0, EPF on basic) that gives a target monthly take-home. */
export function grossFor(target: number): number {
  let lo = 0;
  let hi = Math.max(1, target) * 3;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (calc({ name: "", basic: mid, allowances: 0, allowancesEpf: true, bonusMonths: 0 }).takeHome < target) lo = mid;
    else hi = mid;
  }
  return Math.ceil(hi);
}

export const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-LK")}`;
