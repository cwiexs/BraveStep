import { useState } from "react";
import { useTranslation } from "next-i18next";
import ReCAPTCHA from "react-google-recaptcha";

export default function SignUp({ onClose, onSignIn }) {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }
    if (!recaptchaToken) {
      setError(t("pleaseVerifyYouAreNotRobot") || "Please verify you are not a robot.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(t("signUpSuccess"));
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setSuccess("");
          if (onSignIn) onSignIn();
        }, 1200);
      } else {
        setError(t(data.message) || t("errorOccurred"));
      }
    } catch {
      setError(t("errorOccurred"));
    }
    setLoading(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[340px]">
      <h2 className="text-2xl font-semibold mb-4">{t("signUp")}</h2>
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
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            className="border rounded px-3 py-2 w-full"
            placeholder={t("confirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm text-blue-700"
            onClick={() => setShowConfirm(!showConfirm)}
            tabIndex={-1}
          >
            {showConfirm ? t("hide") : t("show")}
          </button>
        </div>
        <div className="flex justify-center">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={setRecaptchaToken}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-700 text-sm">{success}</div>}
        <button
          type="submit"
          className="bg-blue-700 text-white rounded py-2"
          disabled={loading}
        >
          {loading ? t("loading") : t("signUp")}
        </button>
      </form>
      <div className="mt-4 text-sm">
        {t("alreadyHaveAccount")}{" "}
        <button className="text-blue-700 underline" onClick={onSignIn}>
          {t("signIn")}
        </button>
      </div>
    </div>
  );
}
