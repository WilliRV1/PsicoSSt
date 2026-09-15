import { NextRequest, NextResponse } from "next/server";

/**
 * Public pages — accessible without a session.
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
  // Autoaplicación remota por link tokenizado (ver AssessmentInvitation) —
  // el trabajador no tiene cuenta; la autorización la hace el propio token.
  "/e",
  // Enlace único por empresa (ver OrganizationInvitationLink) — el
  // trabajador se identifica con su cédula antes de resolver a /e/[token].
  "/c",
];

/**
 * Proxy runs at the Edge. NextAuth v5 encrypts its JWT with AES-GCM so
 * `getToken` from next-auth/jwt (v4) cannot decrypt it here.
 * We use cookie presence for page-level routing only. All data-access
 * security is enforced inside the individual API route handlers via auth().
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // NextAuth internal handler — always allow
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Endpoints públicos de autoaplicación remota — la autorización real la
  // hace cada route handler validando el hash del token, no una sesión.
  if (pathname.startsWith("/api/public/")) {
    return NextResponse.next();
  }

  // Static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Detect session cookie (NextAuth v5 / auth.js naming)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ??
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuthenticated = !!sessionToken;

  // ── Public pages ──────────────────────────────────────────────
  const isPublicPage = PUBLIC_PAGES.some((p) => pathname.startsWith(p));

  if (isPublicPage) {
    // Already logged in on auth pages → go to app
    if (
      isAuthenticated &&
      (pathname === "/login" || pathname === "/register")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── Root ──────────────────────────────────────────────────────
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", req.url)
    );
  }

  // ── Protected pages ───────────────────────────────────────────
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
