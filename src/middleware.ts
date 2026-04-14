import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

function getSecretKey() {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    return null;
  }
  return new TextEncoder().encode(raw);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = getSecretKey();
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isAdmin = pathname.startsWith("/admin");
  const isEmployee = pathname.startsWith("/employee") || pathname.startsWith("/developer");
  const isTester = pathname.startsWith("/tester");
  const isWorkspace = pathname.startsWith("/workspace");

  if (!isAdmin && !isEmployee && !isTester && !isWorkspace) {
    return NextResponse.next();
  }

  if (!secret || !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role =
      payload.role === "hr" ||
      payload.role === "manager" ||
      payload.role === "developer" ||
      payload.role === "tester"
        ? payload.role
        : null;
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isAdmin && role !== "hr" && role !== "manager") {
      return NextResponse.redirect(new URL("/employee", request.url));
    }
    if ((isEmployee || isWorkspace) && role !== "developer") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (isTester && role !== "tester") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/developer/:path*", "/tester/:path*", "/workspace/:path*"],
};
