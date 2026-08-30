import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * כל המערכת מאחורי סיסמה, חוץ מ:
 * /login, עמודי השיתוף /p ו-/c שנשלחים ללקוחות,
 * פורטל המפעל /factory, עמוד הלקוח /order והצעת המחיר /quote —
 * שם הטוקן שבכתובת הוא האימות.
 * /photos שומר על עצמו — הוא מגיש רק תמונות של דגמים מפורסמים למי שאינו מחובר.
 */
const PUBLIC_PREFIXES = ["/login", "/p/", "/c/", "/photos/", "/factory/", "/order/", "/quote/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

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
