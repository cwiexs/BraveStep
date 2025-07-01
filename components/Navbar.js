import { useState } from "react";
import { useTranslation } from "next-i18next";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";

export default function Navbar({ onHome, onWorkouts, onSignIn, session, onMyProfile }) {
  const { t } = useTranslation("common");
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: t("menu.home"), onClick: onHome },
    { label: t("menu.workouts"), onClick: onWorkouts },
    { label: t("menu.nutrition"), onClick: null },
    { label: t("menu.health"), onClick: null },
  ];

  return (
    <nav className="w-full flex justify-between items-center pb-8 px-4 relative z-20">
      <div className="flex items-center gap-4">
        <ul className="hidden md:flex gap-8 text-blue-900 font-medium">
          {menuItems.map((item, i) => (
            <li key={i}>
              {item.onClick ? (
                <button onClick={item.onClick} className="hover:text-blue-700 transition">
                  {item.label}
                </button>
              ) : (
                <span className="hover:text-blue-700 transition cursor-pointer">{item.label}</span>
              )}
            </li>
          ))}
          {session && (
            <li>
              <button
                onClick={onMyProfile}
                className="hover:text-blue-700 transition"
                type="button"
              >
                {t("menu.myProfile")}
              </button>
            </li>
          )}
        </ul>
        <button
          className="md:hidden text-blue-900 hover:text-blue-700 p-2"
          onClick={() => setMenuOpen(true)}
          aria-label="Atidaryti meniu"
        >
          <Menu size={32} />
        </button>
      </div>
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
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex">
          <div className="bg-white w-64 max-w-full h-full p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="text-2xl font-bold text-blue-900">
                Menu
              </span>
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
                  {item.onClick ? (
                    <button
                      onClick={() => {
                        item.onClick();
                        setMenuOpen(false);
                      }}
                      className="hover:text-blue-700 text-lg transition"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="hover:text-blue-700 text-lg transition cursor-pointer">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
              {session && (
                <li>
                  <button
                    onClick={() => {
                      onMyProfile();
                      setMenuOpen(false);
                    }}
                    className="hover:text-blue-700 text-lg transition"
                    type="button"
                  >
                    {t("menu.myProfile")}
                  </button>
                </li>
              )}
            </ul>
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
          <div
            className="flex-1"
            onClick={() => setMenuOpen(false)}
            aria-label="Uždaryti meniu"
          />
        </div>
      )}
    </nav>
  );
}
