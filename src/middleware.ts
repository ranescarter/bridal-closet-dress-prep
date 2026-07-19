import { NextRequest, NextResponse } from "next/server";

const ADMIN_HOST = "admin.mybridalcloset.com";
const BRIDE_HOST = "bride.mybridalcloset.com";
const GUEST_HOST = "guest.mybridalcloset.com";

function hostname(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
}

export function middleware(request: NextRequest) {
  const host = hostname(request);
  const { pathname } = request.nextUrl;

  // Bride/guest hosts: no staff UI; send people to admin tools.
  if (
    (host === BRIDE_HOST || host === GUEST_HOST) &&
    (pathname === "/" || pathname.startsWith("/staff"))
  ) {
    const url = request.nextUrl.clone();
    url.hostname = ADMIN_HOST;
    url.protocol = "https:";
    url.port = "";
    url.pathname = pathname === "/" ? "/" : pathname;
    return NextResponse.redirect(url);
  }

  // Admin root already redirects to /staff via app/page.tsx.
  // Keep /s/* available on all hosts during DNS cutover.

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/staff/:path*"],
};
