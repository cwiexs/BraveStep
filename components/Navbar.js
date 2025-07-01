import { useState } from "react";
import { useTranslation } from "next-i18next";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar({ session, onSignIn }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Funkcija, kuri grąžina true jei esame ant to puslapio
  const isActive = (href) =>
    router.pathname === href ||
    (href !== "/" && router.pathname.startsWith(href));

  const menuItems = [
    {
      label: t("menu.home"),
      href: "/"
    },
    {
      label: t("menu.workouts"),
      href: "/workouts"
    },
    {
      label: t("menu.nutrition"),
      href: "/nutrition"
    },
    {
      label: t("menu.health"),
      href: "/health"
    },
  ];

  return (
    <nav className="w-full flex justify-between items-center pb-8 px-4 relative z-20">
      <div className="flex items-center gap-4">
        {/* Kompiuterio meniu */}
        <ul className="hidden md:flex gap-8 text-blue-900 font-medium">
          {menuItems.map((item, i) => (
            <li key={i}>
              <Link href={item.href}>
                <a
                  className={`hover:text-blue-700 transition ${
                    isActive(item.href) ? "font-bold underline text-blue-700" : ""
                  }`}
                >
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
          {session && (
            <li>
              <Link href="/my-profile">
                <a
                  className={`hover:text-blue-700 transition ${
                    isActive("/my-profile") ? "font-bold underline text-blue-700" : ""
                  }`}
                >
                  {t("menu.myProfile")}
                </a>
              </Link>
            </li>
          )}
        </ul>
        {/* Burger */}
        <button
          className="md:hidden text-blue-900 hover:text-blue-700 p-2"
          onClick={() => setMenuOpen(true)}
          aria-label="Atidaryti meniu"
        >
          <Menu size={32} />
        </button>
      </div>
      {/* Prisijungimo/atsijungimo kompiuteriui */}
      <div className="hidden md:flex items-center gap-4">
        {!session ? (
          <button
            onClick={onSignIn}
            className="text-blue-900 font-medium hover:text-blue-700 rounded py-2 transition"
          >
            {t("menu.signIn")}
          </button>
        ) : (
          <button
            onClick={() => signOut()}
            className="text-blue-900 font-medium hover:text-blue-700 rounded py-2 transition"
          >
            {t("menu.signOut")}
          </button>
        )}
      </div>
      {/* Mobilus burger meniu */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex">
          <div className="bg-white w-64 max-w-full h-full p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="text-2xl font-bold text-blue-900">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-blue-900 hover:text-blue-700 p-2"
                aria-label="Uždaryti meniu"
              >
                <X size={28} />
              </button>
            </div>
            <ul className="flex flex-col gap-4 text-blue-900 font-medium mb-6">
              {menuItems.map((item, i) => (
                <li key={i}>
                  <Link href={item.href}>
                    <a
                      className={`hover:text-blue-700 text-lg transition ${
                        isActive(item.href) ? "font-bold underline text-blue-700" : ""
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  </Link>
                </li>
              ))}
              {session && (
                <li>
                  <Link href="/my-profile">
                    <a
                      className={`hover:text-blue-700 text-lg transition ${
                        isActive("/my-profile") ? "font-bold underline text-blue-700" : ""
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("menu.myProfile")}
                    </a>
                  </Link>
                </li>
              )}
            </ul>
            {/* Prisijungimo/atsijungimo burger meniu */}
            <div className="mt-auto pt-4 flex flex-col gap-2 border-t">
              {!session ? (
                <button
                  onClick={() => {
                    onSignIn();
                    setMenuOpen(false);
                  }}
                  className="text-blue-900 font-medium hover:text-blue-700 rounded py-2 transition text-left"
                >
                  {t("menu.signIn")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="text-blue-900 font-medium hover:text-blue-700 rounded py-2 transition text-left"
                >
                  {t("menu.signOut")}
                </button>
              )}
            </div>
          </div>
          {/* Šešėlis – paspaudus uždaro */}
          <div className="flex-1" onClick={() => setMenuOpen(false)} aria-label="Uždaryti meniu" />
        </div>
      )}
    </nav>
  );
}
