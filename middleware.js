// middleware.js
import { NextResponse } from "next/server";

// Leisk middleware’ui veikti tik ant "tikrų" puslapių URL’ų,
// o ne ant /api, /api/auth, /_next, statinių failų ir pan.
export const config = {
  matcher: [
    // Viskas, išskyrus:
    // - _next (statiniai, JS, CSS)
    // - api ir api/auth (NextAuth endpointai)
    // - favicon, images, sitemap, robots ir kt. statika
    "/((?!_next/|api/|api/auth/|favicon\\.ico$|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};

export function middleware(req) {
  const res = NextResponse.next();

  // Tik neskausminga sinchronizacija: user_locale -> NEXT_LOCALE
  const get = (k) => {
    try {
      return req.cookies.get?.(k)?.value ?? req.cookies.get(k);
    } catch { return undefined; }
  };

  const userLocale = get("user_locale");
  const i18nCookie = get("NEXT_LOCALE");

  if (userLocale && userLocale !== i18nCookie) {
    res.cookies.set("NEXT_LOCALE", userLocale, { path: "/" });
  }

  return res;
}
