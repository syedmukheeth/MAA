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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const session = token ? await verifySession(token) : null;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Already signed in: keep auth pages out of the way. Same split as
  // loginAction — customers to the store, staff to the back-office settings.
  if (isAuthPage) {
    if (session) {
      const destination =
        session.role === "CUSTOMER" ? "/products" : "/admin/settings";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  // Storefront must stay crawlable and shareable — no auth gate. This list is
  // the same set app/sitemap.ts advertises to crawlers; anything listed there
  // and gated here is a URL Google is told to index and then bounced off.
  const PUBLIC_PREFIXES = ["/products", "/combos", "/custom-studio", "/showroom"];
  const isPublicStorefrontPage =
    pathname === "/" || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublicStorefrontPage) {
    return NextResponse.next();
  }

  // Everything still matched here is private.
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/logout") {
      loginUrl.searchParams.set("next", pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Back office is staff-only; customers get 403
  if (pathname.startsWith("/admin") && session.role === "CUSTOMER") {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  // /account is the customer profile area; staff manage things from /admin
  if (pathname.startsWith("/account") && session.role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}
