import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose/jwt/decode";
import type { UserRole } from "@/lib/constants";
import { canAccessRole } from "@/lib/role-navigation";

const requiredRole = (pathname: string): UserRole =>
  pathname.startsWith("/admin")
    ? "ADMIN"
    : pathname.startsWith("/technician")
      ? "TECHNICIAN"
      : "CUSTOMER";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("cmb_session")?.value,
    login = () => {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    };
  if (!token) return login();
  try {
    const payload = decodeJwt(token) as { role?: UserRole };
    if (
      !payload.role ||
      !canAccessRole(payload.role, [requiredRole(req.nextUrl.pathname)])
    )
      return NextResponse.redirect(new URL("/forbidden", req.url));
    return NextResponse.next();
  } catch {
    return login();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/technician/:path*", "/admin/:path*"],
};
