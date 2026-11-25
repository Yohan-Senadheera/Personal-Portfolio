// GitHub profile + last year's contribution calendar, from GitHub's public pages (no token).
// Cached at the edge for 6 hours, so visitors never hit GitHub's rate limits.

declare const caches: { default: { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> } };

const USER = "Yohan-Senadheera";
const TTL = 6 * 60 * 60;
const UA = { "User-Agent": "yohan.is-a.dev portfolio", Accept: "application/vnd.github+json" };

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

export const onRequestGet = async ({ request }: { request: Request }) => {
  const key = new Request(new URL("/api/github", request.url).toString());
  const hit = await caches.default.match(key);
  if (hit) return hit;

  try {
    const [p, cal] = await Promise.all([
      fetch(`https://api.github.com/users/${USER}`, { headers: UA }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      fetch(`https://github.com/users/${USER}/contributions`, { headers: { "User-Agent": UA["User-Agent"] } }).then((r) =>
        r.ok ? r.text() : Promise.reject(r.status),
      ),
    ]);
    const { days, total } = parseCalendar(cal as string);
    const u = p as Record<string, unknown>;
    const body = {
      login: u.login,
      name: u.name,
      bio: u.bio,
      avatar: u.avatar_url,
      repos: u.public_repos,
      followers: u.followers,
      since: String(u.created_at ?? "").slice(0, 4),
      total,
      days,
      updated: new Date().toISOString(),
    };
    const res = new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${TTL}` },
    });
    if (days.length > 300) await caches.default.put(key, res.clone());
    return res;
  } catch {
    return new Response(JSON.stringify({ error: "github unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};
