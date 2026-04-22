import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/portfolio") || pathname.startsWith("/api/sections") || pathname.startsWith("/api/fields")) {
    const sessionCookie = request.cookies.get("next-auth.session-token");

    if (!sessionCookie?.value) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/portfolio/:path*",
    "/api/sections/:path*",
    "/api/fields/:path*",
  ],
};