import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/auth");

  // Get session token (edge-compatible)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If accessing a protected route without session, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
