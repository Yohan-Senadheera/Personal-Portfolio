// Send the old pages.dev address to the real domain, so search engines index yohan.is-a.dev only.
export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  if (url.hostname === "yohan-senadheera.pages.dev") {
    url.hostname = "yohan.is-a.dev";
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
