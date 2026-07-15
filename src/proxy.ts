import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const config = {
  matcher: [
    "/",
    "/products/:path*",
    "/combos/:path*",
    "/admin/:path*",
    "/account/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/login",
    "/register",
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

  // App flow starts at login: every area requires a session
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
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

  // Store, cart, and checkout are open to every signed-in role
  return NextResponse.next();
}
