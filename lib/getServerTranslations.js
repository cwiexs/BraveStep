
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export async function getServerTranslations(ctx, ns = ["common"]) {
  let locale = ctx?.locale || "en";
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);
    if (session?.user?.locale) locale = session.user.locale;
  } catch {}
  return {
    ...(await serverSideTranslations(locale, ns)),
    initialLocale: locale,
  };
}
