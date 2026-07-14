import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/cart/:path*",
    "/checkout/:path*",
  ],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const session = token ? await verifySession(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (session.role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  } else {
    // /account, /cart, /checkout are customer-facing shop areas
    if (session.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}
