import { NextResponse, type NextRequest } from "next/server";

const BACKEND_PROXY_PREFIXES = ["/api", "/oauth2", "/login/oauth2"];
const COMING_SOON_PATH = "/coming-soon";
// The coming-soon page itself links to these - without this they'd redirect
// straight back to /coming-soon, making the links dead.
const COMING_SOON_ALLOWED_PATHS = new Set([COMING_SOON_PATH, "/impressum", "/datenschutz", "/agb"]);

// next.config.ts's rewrites() is resolved once at `next build` time and its
// destination gets frozen into .next/routes-manifest.json - reading
// process.env.BACKEND_URL there only ever sees the *build* container's
// environment, never the one passed to `docker run`. This proxy runs as
// real server code on every request instead, so BACKEND_URL is read fresh
// at request time - the actual replacement for nginx's ${BACKEND_HOST}
// template substitution, not next.config.ts's rewrites().
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // www./main runs the same image as dev/prod with this env var set, so the
  // whole app stays behind a single placeholder route instead of shipping a
  // separate codebase for it.
  if (
    process.env.COMING_SOON_MODE === "true" &&
    !COMING_SOON_ALLOWED_PATHS.has(pathname)
  ) {
    return NextResponse.redirect(new URL(COMING_SOON_PATH, request.url));
  }

  if (!BACKEND_PROXY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const backend = process.env.BACKEND_URL ?? "http://localhost:8080";
  const url = new URL(pathname + search, backend);

  // Rewriting to an absolute URL replaces the Host header with the
  // backend's own address, so without these the backend has no way to
  // know the public origin it's actually being reached through - Spring's
  // OAuth2 redirect-uri templating ({baseUrl}/login/oauth2/code/{id})
  // would otherwise resolve to the internal backend address instead of
  // the public one, breaking Google's redirect_uri check.
  const headers = new Headers(request.headers);
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  headers.set("x-forwarded-host", forwardedHost);
  headers.set("x-forwarded-proto", request.headers.get("x-forwarded-proto") ?? "https");
  // Next's own rewrite machinery sets x-forwarded-port to the port this
  // container's dev server is actually listening on (e.g. 3000), which
  // Spring then appends to the host above, producing a public-facing
  // redirect_uri with a stray internal port baked in. forwardedHost only
  // carries its own port when the original request explicitly had one
  // (e.g. local dev), so only keep x-forwarded-port then - otherwise drop
  // it and let the scheme's default port apply.
  if (!forwardedHost.includes(":")) {
    headers.delete("x-forwarded-port");
  }

  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Broad on purpose: the coming-soon gate above needs to see every
  // navigation, not just the backend-proxy prefixes. Static assets/Next
  // internals are excluded since they're never gated and don't need the
  // backend-proxy check either.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
