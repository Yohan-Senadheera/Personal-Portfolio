// SLO -> error budget and multi-window, multi-burn-rate Prometheus alerts
// (the approach from Google's SRE Workbook, chapter "Alerting on SLOs").

export type SloInput = {
  service: string;
  slo: number; // percent, e.g. 99.9
  windowDays: number; // SLO window, e.g. 30
  metric: string; // counter, e.g. http_requests_total
  base: string; // label matchers for all requests, e.g. job="api"
  errors: string; // extra matchers for bad requests, e.g. code=~"5.."
  rps?: number; // optional average requests per second
  format: "rules" | "crd";
};

export type Tier = {
  severity: "page" | "ticket";
  long: string;
  short: string;
  longH: number;
  budget: number; // fraction of the budget spent in the long window when it fires
  burn: number;
};

const WINDOWS: Omit<Tier, "burn">[] = [
  { severity: "page", long: "1h", short: "5m", longH: 1, budget: 0.02 },
  { severity: "page", long: "6h", short: "30m", longH: 6, budget: 0.05 },
  { severity: "ticket", long: "1d", short: "2h", longH: 24, budget: 0.1 },
  { severity: "ticket", long: "3d", short: "6h", longH: 72, budget: 0.1 },
];

export const round = (n: number, d = 2) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

export function tiers(windowDays: number): { used: Tier[]; skipped: Tier[] } {
  const hours = windowDays * 24;
  const all = WINDOWS.map((w) => ({ ...w, burn: round((w.budget * hours) / w.longH, 2) }));
  return {
    used: all.filter((t) => t.longH < hours && t.burn >= 1),
    skipped: all.filter((t) => !(t.longH < hours && t.burn >= 1)),
  };
}

export function duration(minutes: number): string {
  if (!isFinite(minutes)) return "-";
  if (minutes < 1) return `${round(minutes * 60, 1)} s`;
  if (minutes < 60) return `${round(minutes, 1)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d} d ${rh} h` : `${d} d`;
}

export function budget(i: SloInput) {
  const bad = 1 - i.slo / 100;
  const windowMin = i.windowDays * 24 * 60;
  return {
    bad,
    window: bad * windowMin,
    day: bad * 24 * 60,
    week: bad * 7 * 24 * 60,
    month: bad * 30 * 24 * 60,
    requests: i.rps ? i.rps * windowMin * 60 * bad : undefined,
  };
}

const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "my-service";

const camel = (s: string) =>
  slug(s)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

function selector(...parts: string[]) {
  const inner = parts
    .map((p) => p.trim().replace(/^\{|\}$/g, "").trim())
    .filter(Boolean)
    .join(",");
  return `{${inner}}`;
}

/** Returns the rule groups as YAML (indented to `indent` spaces). */
function groupsYaml(i: SloInput, indent: number): string {
  const svc = slug(i.service);
  const bad = 1 - i.slo / 100;
  const badStr = String(round(bad, 10));
  const { used } = tiers(i.windowDays);
  const windows = [...new Set(used.flatMap((t) => [t.short, t.long]))].sort((a, b) => toMin(a) - toMin(b));
  const all = selector(i.base);
  const errs = selector(i.base, i.errors);
  const L: string[] = [];
  L.push(`groups:`);
  L.push(`  - name: slo-${svc}-recording`);
  L.push(`    rules:`);
  for (const w of windows) {
    L.push(`      - record: slo:sli_error:ratio_rate${w}`);
    L.push(`        expr: |`);
    L.push(`          sum(rate(${i.metric}${errs}[${w}]))`);
    L.push(`          /`);
    L.push(`          sum(rate(${i.metric}${all}[${w}]))`);
    L.push(`        labels:`);
    L.push(`          service: ${svc}`);
    L.push(`          slo: "${i.slo}"`);
  }
  L.push(`  - name: slo-${svc}-alerts`);
  L.push(`    rules:`);
  for (const sev of ["page", "ticket"] as const) {
    const ts = used.filter((t) => t.severity === sev);
    if (!ts.length) continue;
    L.push(`      - alert: ${camel(i.service)}ErrorBudgetBurn${sev === "page" ? "Fast" : "Slow"}`);
    L.push(`        expr: |`);
    ts.forEach((t, k) => {
      const thr = `(${t.burn} * ${badStr})`;
      L.push(`          (`);
      L.push(`            slo:sli_error:ratio_rate${t.long}{service="${svc}"} > ${thr}`);
      L.push(`            and`);
      L.push(`            slo:sli_error:ratio_rate${t.short}{service="${svc}"} > ${thr}`);
      L.push(`          )${k < ts.length - 1 ? "" : ""}`);
      if (k < ts.length - 1) L.push(`          or`);
    });
    L.push(`        for: ${sev === "page" ? "2m" : "15m"}`);
    L.push(`        labels:`);
    L.push(`          severity: ${sev === "page" ? "critical" : "warning"}`);
    L.push(`          service: ${svc}`);
    L.push(`        annotations:`);
    L.push(
      `          summary: "${svc} is burning its ${i.slo}% SLO error budget ${sev === "page" ? "fast" : "slowly"}"`,
    );
    L.push(
      `          description: "Error ratio is above ${ts.map((t) => `${t.burn}x over ${t.long}`).join(" or ")}. At this rate the ${i.windowDays}-day budget runs out in ${ts.map((t) => duration((i.windowDays * 24 * 60) / t.burn)).join(" / ")}."`,
    );
  }
  const pad = " ".repeat(indent);
  return L.map((l) => pad + l).join("\n");
}

function toMin(w: string) {
  const n = parseFloat(w);
  return w.endsWith("d") ? n * 1440 : w.endsWith("h") ? n * 60 : n;
}

export function rulesYaml(i: SloInput): string {
  const svc = slug(i.service);
  const head = `# ${svc}: ${i.slo}% over ${i.windowDays} days (error budget ${round((1 - i.slo / 100) * 100, 4)}%)\n# Generated with https://yohan.is-a.dev/tools/slo-alerts\n`;
  if (i.format === "rules") return head + groupsYaml(i, 0) + "\n";
  return (
    head +
    [
      `apiVersion: monitoring.coreos.com/v1`,
      `kind: PrometheusRule`,
      `metadata:`,
      `  name: ${svc}-slo`,
      `  labels:`,
      `    release: prometheus # must match your Prometheus ruleSelector`,
      `spec:`,
    ].join("\n") +
    "\n" +
    groupsYaml(i, 2).replace(/^ {2}groups:/, "  groups:") +
    "\n"
  );
}

export const DEFAULTS: SloInput = {
  service: "orders-api",
  slo: 99.9,
  windowDays: 30,
  metric: "http_requests_total",
  base: 'job="orders-api"',
  errors: 'code=~"5.."',
  rps: 50,
  format: "rules",
};
