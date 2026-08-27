import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { UserRole } from "@/lib/types/auth";

const API_ROLE_RULES: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/api/inventory", roles: ["ADMIN", "OPERATOR"] },
  { prefix: "/api/pipeline", roles: ["ADMIN", "OPERATOR"] },
  { prefix: "/api/finance", roles: ["ADMIN", "FINANCE", "INVESTOR"] },
  { prefix: "/api/invoices", roles: ["ADMIN", "FINANCE"] },
  { prefix: "/api/analytics", roles: ["ADMIN", "MARKETING", "VIEWER", "INVESTOR"] },
];

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = request.auth;
  const isApi = pathname.startsWith("/api/");
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // This repository is INTERNAL. Public prototype routes are intentionally isolated.
  if (!isAdmin && !isApi && pathname !== "/login") {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname === "/login") {
    if (session?.user) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    if (isApi) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = (session.user as { role?: UserRole }).role;
  if (!role) {
    if (isApi) {
      return NextResponse.json({ error: "ROLE_NOT_ASSIGNED" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/login?error=role", request.url));
  }

  // Server-side role enforcement. The client cannot choose its own role.
  if (isApi) {
    const rule = API_ROLE_RULES.find((entry) => pathname.startsWith(entry.prefix));
    if (rule && !rule.roles.includes(role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const headers = new Headers(request.headers);
    headers.set("x-bbk-role", role);
    headers.set("x-bbk-authenticated", "true");
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
