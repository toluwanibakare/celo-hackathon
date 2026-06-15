import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Health check for tests and uptime
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  const session = request.cookies.get("paycon-session");

  // If user has a session and visits the landing page, send them to dashboard
  if (pathname === "/" && session?.value) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect /dashboard — require wallet session
  if (pathname.startsWith("/dashboard")) {
    if (!session?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect /login and /register to landing page (wallet auth replaces them)
  if (pathname === "/login" || pathname === "/register") {
    if (session?.value) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
