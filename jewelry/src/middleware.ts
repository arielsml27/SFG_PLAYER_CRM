import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

/** כל המערכת מאחורי סיסמה. רק /login ונכסים סטטיים פתוחים. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login")) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand|favicon.ico).*)"],
};
