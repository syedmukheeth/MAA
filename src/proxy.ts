import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Only private areas are matched. The storefront — `/`, `/products/*`,
 * `/combos/*` — is deliberately absent: it must be crawlable and shareable.
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico|brand|uploads|403|forgot-password|reset-password).*)",
  ],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const session = token ? await verifySession(token) : null;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Already signed in: keep auth pages out of the way, go to the store
  if (isAuthPage) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
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
