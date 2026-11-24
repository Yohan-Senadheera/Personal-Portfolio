// Redirect pages.dev to the real domain, and set per-page meta tags for the tool pages.

type El = { setAttribute(n: string, v: string): void; setInnerContent(c: string): void };
declare const HTMLRewriter: {
  new (): {
    on(selector: string, handler: { element(el: El): void }): InstanceType<typeof HTMLRewriter>;
    transform(res: Response): Response;
  };
};

const PAGES: Record<string, { title: string; description: string }> = {
  "/tools": {
    title: "Free SRE and DevOps tools | Yohan Senadheera",
    description:
      "Free browser tools for Kubernetes, Prometheus SLOs and TLS certificates, plus everyday tools for salary, loans and trips. Nothing you enter leaves your browser.",
  },
  "/tools/pod-doctor": {
    title: "Pod Doctor: why is my Kubernetes pod failing? | Yohan Senadheera",
    description:
      "Paste kubectl describe pod and get a plain-English diagnosis for Pending, CrashLoopBackOff, ImagePullBackOff, OOMKilled and probe failures, with the next commands to run.",
  },
  "/tools/slo-alerts": {
    title: "SLO to Prometheus burn-rate alerts generator | Yohan Senadheera",
    description:
      "Turn an SLO into an error budget and ready-to-paste multi-window, multi-burn-rate Prometheus alert rules or a PrometheusRule.",
  },
  "/tools/salary-lk": {
    title: "Sri Lanka take-home salary calculator: EPF, ETF and APIT | Yohan Senadheera",
    description:
      "Your real monthly take-home after EPF and APIT tax, what your employer adds to EPF and ETF, and up to three job offers compared side by side. Uses the IRD's current tax table.",
  },
  "/tools/loan-rate": {
    title: "Flat rate to real interest rate: loan and lease calculator | Yohan Senadheera",
    description:
      "A 12% flat-rate lease is really about 20%. See the real yearly rate of any loan or lease, including fees, and compare offers side by side.",
  },
  "/tools/split": {
    title: "Trip expense splitter: who pays whom | Yohan Senadheera",
    description: "Add who paid for what on a trip and get the fewest transfers to settle up. No sign-up, one share link.",
  },
  "/tools/cert-inspector": {
    title: "Certificate chain inspector | Yohan Senadheera",
    description:
      "Paste PEM certificates: check expiry, SANs and keys, catch a missing intermediate or wrong order, and get the fixed bundle. Runs in your browser.",
  },
};

export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  if (url.hostname === "yohan-senadheera.pages.dev") {
    url.hostname = "yohan.is-a.dev";
    return Response.redirect(url.toString(), 301);
  }
  const res = await next();
  const path = url.pathname.replace(/\/+$/, "");
  const page = PAGES[path];
  if (!page || !(res.headers.get("content-type") ?? "").includes("text/html")) return res;
  const canonical = `https://yohan.is-a.dev${path}`;
  const attr = (name: string, value: string) => ({ element: (el: El) => el.setAttribute(name, value) });
  return new HTMLRewriter()
    .on("title", { element: (el) => el.setInnerContent(page.title) })
    .on('meta[name="description"]', attr("content", page.description))
    .on('meta[property="og:title"]', attr("content", page.title))
    .on('meta[property="og:description"]', attr("content", page.description))
    .on('meta[property="og:url"]', attr("content", canonical))
    .on('meta[name="twitter:title"]', attr("content", page.title))
    .on('meta[name="twitter:description"]', attr("content", page.description))
    .on('link[rel="canonical"]', attr("href", canonical))
    .transform(res);
};
