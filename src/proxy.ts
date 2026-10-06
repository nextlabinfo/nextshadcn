import { type NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/auth/v2/login";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard"];

// Auth routes — authenticated users should not access these
const AUTH_PREFIXES = ["/auth/v1", "/auth/v2"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("better-auth.session_token")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL(LOGIN_PATH, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard/finance-analyst", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
