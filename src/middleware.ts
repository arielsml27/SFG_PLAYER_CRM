import { NextResponse, type NextRequest } from "next/server";
import { CRM_AUTH_COOKIE, expectedCrmAuthToken } from "@/lib/crm-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/crm")) return NextResponse.next();

  const cookieValue = request.cookies.get(CRM_AUTH_COOKIE)?.value;
  const expected = await expectedCrmAuthToken();

  if (cookieValue && cookieValue === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/crm-login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/crm/:path*"],
};
