import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Officer API endpoints protection (/api/officer/*)
  if (pathname.startsWith("/api/officer")) {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value || req.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== "OFFICER") {
      return NextResponse.json(
        { error: "Forbidden: Officer credentials required to access officer APIs" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 2. Officer Dashboard routes protection (/officer/* excluding /officer/login)
  if (pathname.startsWith("/officer") && pathname !== "/officer/login") {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/officer/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      const loginUrl = new URL("/officer/login", req.url);
      loginUrl.searchParams.set("error", "session_expired");
      return NextResponse.redirect(loginUrl);
    }

    // Role check: CONSUMER users attempting to access /officer/* are strictly blocked
    if (payload.role !== "OFFICER") {
      const citizenUrl = new URL("/citizen", req.url);
      citizenUrl.searchParams.set("error", "officer_access_denied");
      return NextResponse.redirect(citizenUrl);
    }

    return NextResponse.next();
  }

  // 3. Optional: redirect already logged-in officers from /officer/login to /officer
  if (pathname === "/officer/login") {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const payload = await verifyJWT(token);
      if (payload && payload.role === "OFFICER") {
        return NextResponse.redirect(new URL("/officer", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/officer/:path*",
    "/api/officer/:path*",
  ],
};
