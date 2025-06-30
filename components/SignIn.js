import { useState } from "react";
import { useTranslation } from "next-i18next";
import { signIn } from "next-auth/react";

export default function SignIn({ onClose, onSignUp }) {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError(t(res.error) || t("loginFailed"));
    } else if (res?.ok) {
      if (onClose) onClose();
      window.location.reload(); // Kad iškart matytųsi, kad prisijungei
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[300px]">
      <h2 className="text-blue-900 font-medium hover:text-blue-700 rounded px-4 py-2 text-3xl transition">{t("signIn")}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="email"
          className="border rounded px-3 py-2"
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            className="border rounded px-3 py-2 w-full"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm text-blue-700"
            onClick={() => setShowPass(!showPass)}
            tabIndex={-1}
          >
            {showPass ? t("hide") : t("show")}
          </button>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-blue-700 text-white rounded py-2"
          disabled={loading}
        >
          {loading ? t("loading") : t("signIn")}
        </button>
      </form>
      <div className="mt-4 text-sm">
        {t("dontHaveAccount")}{" "}
        <button className="text-blue-700 underline" onClick={onSignUp}>
          {t("signUp")}
        </button>
      </div>
    </div>
  );
}
