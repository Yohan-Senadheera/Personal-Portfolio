// GitHub contribution calendar for the last year, read from GitHub's public contributions page (no token,
// not the rate-limited REST API). Fresh copy cached 6 hours; the last good copy is kept 7 days as a fallback.

declare const caches: { default: { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> } };

const USER = "Yohan-Senadheera";
const PROFILE = {
  login: USER,
  name: "Yohan Senadheera",
  avatar: "https://avatars.githubusercontent.com/u/150885280?v=4",
  since: "2023",
};
const FRESH = 6 * 60 * 60;
const STALE = 7 * 24 * 60 * 60;

type Day = { d: string; c: number; l: number };

function parseCalendar(html: string) {
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/for="(contribution-day-component-[\d-]+)"[^>]*>\s*(\d+|No) contributions?/g)) {
    counts.set(m[1], m[2] === "No" ? 0 : Number(m[2]));
  }
  const days: Day[] = [];
  for (const m of html.matchAll(/<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="(contribution-day-component-[\d-]+)"[^>]*data-level="(\d)"/g)) {
    days.push({ d: m[1], c: counts.get(m[2]) ?? 0, l: Number(m[3]) });
  }
  days.sort((a, b) => a.d.localeCompare(b.d));
  const total = Number((html.match(/([\d,]+)\s+contributions?\s+in the last year/) ?? [])[1]?.replace(/,/g, "") ?? NaN);
  return { days, total: Number.isFinite(total) ? total : days.reduce((s, x) => s + x.c, 0) };
}

const json = (body: string, maxAge: number) =>
  new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${maxAge}` } });

export const onRequestGet = async ({ request }: { request: Request }) => {
  const origin = new URL(request.url).origin;
  const freshKey = new Request(`${origin}/api/github`);
  const staleKey = new Request(`${origin}/api/github?last-good`);

  const hit = await caches.default.match(freshKey);
  if (hit) return hit;

  try {
    const r = await fetch(`https://github.com/users/${USER}/contributions`, { headers: { "User-Agent": "yohan.is-a.dev portfolio" } });
    if (!r.ok) throw new Error(String(r.status));
    const { days, total } = parseCalendar(await r.text());
    if (days.length < 300) throw new Error("calendar not found");
    const body = JSON.stringify({ ...PROFILE, total, days, updated: new Date().toISOString() });
    await Promise.all([caches.default.put(freshKey, json(body, FRESH)), caches.default.put(staleKey, json(body, STALE))]);
    return json(body, FRESH);
  } catch {
    const old = await caches.default.match(staleKey);
    if (old) return new Response(old.body, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" } });
    return new Response(JSON.stringify({ error: "github unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};
