import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes accessible without authentication
const publicRoutes = ["/login", "/register", "/pending-approval", "/mfa-setup", "/mfa-verify", "/forgot-password", "/terms", "/privacy"];
// Routes that should redirect TO dashboard if user is already authenticated
const redirectIfAuthenticated = ["/login", "/register"];
// Routes that require full authentication (dashboard)
const protectedRoutes = ["/dashboard"];
// API routes that bypass authentication entirely (auth handler + dev tools)
const authApiRoutes = ["/api/auth", "/api/dev", "/api/payments/webhook"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow auth API routes and public assets
    if (
        authApiRoutes.some((route) => pathname.startsWith(route)) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Check for session token (Auth.js v5 uses this cookie name)
    const sessionToken =
        request.cookies.get("authjs.session-token")?.value ??
        request.cookies.get("__Secure-authjs.session-token")?.value;

    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // Not authenticated → redirect to login (unless on public route)
    if (!sessionToken) {
        if (isPublicRoute) {
            return NextResponse.next();
        }
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated on login/register only → redirect to dashboard
    const shouldRedirect = redirectIfAuthenticated.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );
    if (shouldRedirect) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api/auth (NextAuth.js handler)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
