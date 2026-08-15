import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/jwt";

/**
 * Only private areas are matched. The storefront — `/`, `/products/*`,
 * `/combos/*`, `/custom-studio`, `/showroom` — is deliberately absent: it must
 * be crawlable and shareable.
 * Gating it means Google indexes nothing and WhatsApp/Instagram link previews
 * die, which for this business is the primary channel.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - brand (brand assets)
     * - uploads (uploaded files)
     * - 403 (access denied page)
     * - forgot-password, reset-password (password reset flow)
     * - robots.txt, sitemap.xml, opengraph-image (crawler + link-preview
     *   metadata; these were being matched and 307'd to /login, which is the
     *   exact failure the note above says must not happen — Googlebot could
     *   not read robots.txt or the sitemap, and WhatsApp/Instagram got a
     *   redirect instead of the OG image)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|brand|uploads|403|forgot-password|reset-password|robots.txt|sitemap.xml|opengraph-image).*)",
  ],
};

/**
 * Content-Security-Policy, built per request because the script directive
 * carries a nonce.
 *
 * A static policy cannot restrict scripts here: Next.js streams its own inline
 * bootstrap scripts into every document, so `script-src 'self'` alone would
 * blank the site. A nonce minted per response and handed back to Next through
 * the CSP header is what makes `script-src` enforceable — without it the header
 * this file used to emit (`frame-ancestors 'none'` and nothing else) left any
 * future injected script free to run and drive the admin UI as whoever is
 * signed in.
 *
 * `'unsafe-inline'` on style-src is deliberate: Framer Motion writes inline
 * styles on every animated element and Next injects critical CSS the same way.
 * Styles are not an execution sink, and the alternative is no policy at all.
 *
 * Dev needs `'unsafe-eval'` for HMR; production does not get it.
 */
function contentSecurityPolicy(nonce: string): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    // Cloudinary serves uploaded product images; Unsplash serves seed
    // placeholders; blob:/data: are the local preview of a file the user has
    // picked but not yet uploaded.
    "img-src 'self' https://res.cloudinary.com https://images.unsplash.com data: blob:",
    "font-src 'self' data:",
    // Uploads POST straight to Cloudinary with a signature minted server-side
    // (src/lib/cloudinary.ts), so the browser talks to that host directly.
    "connect-src 'self' https://api.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Minted once per request and threaded through on the REQUEST headers so
  // server components (src/components/seo/JsonLd.tsx) can stamp the same value
  // onto any inline script they render.
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  /** Every exit from this function goes through here, so no route escapes the policy. */
  const withCsp = <T extends NextResponse>(response: T): T => {
    response.headers.set("content-security-policy", csp);
    return response;
  };
  const proceed = () =>
    withCsp(NextResponse.next({ request: { headers: requestHeaders } }));

  const session = token ? await verifySession(token) : null;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Already signed in: keep auth pages out of the way. Same split as
  // loginAction — customers to the store, staff to the back-office settings.
  if (isAuthPage) {
    if (session) {
      const destination =
        session.role === "CUSTOMER" ? "/products" : "/admin/settings";
      return withCsp(NextResponse.redirect(new URL(destination, request.url)));
    }
    return proceed();
  }

  // Storefront must stay crawlable and shareable — no auth gate. This list is
  // the same set app/sitemap.ts advertises to crawlers; anything listed there
  // and gated here is a URL Google is told to index and then bounced off.
  //
  // /privacy, /terms and /grievance are here for a second reason: DPDP §5
  // requires the notice to be available to a data principal at the point they
  // give their data, and §13 requires a reachable grievance channel. A privacy
  // notice you have to create an account to read is not a notice, and someone
  // whose account is locked pending erasure — or who never had one — must still
  // be able to complain. Without these entries the proxy 307s all three to
  // /login.
  const PUBLIC_PREFIXES = [
    "/products",
    "/combos",
    "/custom-studio",
    "/showroom",
    "/privacy",
    "/terms",
    "/grievance",
  ];
  const isPublicStorefrontPage =
    pathname === "/" || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublicStorefrontPage) {
    return proceed();
  }

  // Everything still matched here is private.
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/logout") {
      loginUrl.searchParams.set("next", pathname);
    }
    const response = withCsp(NextResponse.redirect(loginUrl));
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Back office is staff-only; customers get 403
  if (pathname.startsWith("/admin") && session.role === "CUSTOMER") {
    return withCsp(NextResponse.redirect(new URL("/403", request.url)));
  }

  // /account is the customer profile area; staff manage things from /admin
  if (pathname.startsWith("/account") && session.role !== "CUSTOMER") {
    return withCsp(NextResponse.redirect(new URL("/admin", request.url)));
  }

  return proceed();
}
