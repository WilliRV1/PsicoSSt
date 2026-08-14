import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Public page routes — accessible without authentication.
 * Everything else requires a valid session.
 */
const PUBLIC_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/pending-approval",
  "/mfa-verify",
  "/mfa-setup",
  "/privacy",
  "/terms",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // NextAuth internals and our /api/auth/* routes are always public
  // (login, register, forgot-password, reset-password, MFA endpoints, etc.)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const secret =
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";

  const token = await getToken({ req, secret });

  // ── API ROUTES ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (token.status === "SUSPENDED" || token.status === "INACTIVE") {
      return NextResponse.json(
        { error: "Cuenta suspendida o inactiva" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // ── PUBLIC PAGES ──────────────────────────────────────────────────────────
  const isPublicPage = PUBLIC_PAGES.some((p) => pathname.startsWith(p));

  if (isPublicPage) {
    // Already authenticated and active → send to dashboard
    if (
      token &&
      token.status === "ACTIVE" &&
      (pathname === "/login" || pathname === "/register")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── ROOT ──────────────────────────────────────────────────────────────────
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(token ? "/dashboard" : "/login", req.url)
    );
  }

  // ── PROTECTED PAGES ───────────────────────────────────────────────────────
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.status === "PENDING") {
    return NextResponse.redirect(new URL("/pending-approval", req.url));
  }

  if (token.status === "SUSPENDED" || token.status === "INACTIVE") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // MFA required but not yet verified
  if (
    token.mfaEnabled &&
    !token.mfaVerified &&
    !pathname.startsWith("/mfa")
  ) {
    return NextResponse.redirect(new URL("/mfa-verify", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run middleware on all paths EXCEPT:
     * - Next.js static files (_next/static, _next/image)
     * - favicon and common static asset extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
