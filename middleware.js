
import { NextResponse } from "next/server";

export function middleware(req) {
  const res = NextResponse.next();
  const getCookieVal = (k) => {
    try {
      return req.cookies.get?.(k)?.value ?? req.cookies.get(k);
    } catch { return undefined; }
  };

  const userLocale = getCookieVal("user_locale");
  const i18nCookie = getCookieVal("NEXT_LOCALE");

  if (userLocale && userLocale !== i18nCookie) {
    res.cookies.set("NEXT_LOCALE", userLocale, { path: "/" });
  }
  return res;
}
