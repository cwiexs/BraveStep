import { useState, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { signIn } from "next-auth/react";
import ReCAPTCHA from "react-google-recaptcha";

export default function SignUp({ onClose, onSignIn }) {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== password2) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    if (!recaptchaToken) {
      setError(t('verifyNotRobot')); // <-- i18n žinutė
      return;
    }
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "userExists") {
          setError(t('userExists'));
        } else if (data.error === "missingEmailOrPassword") {
          setError(t('errorOccurred'));
        } else if (data.error === "recaptchaFailed") {
          setError(t('verifyNotRobot'));
        } else {
          setError(t('errorOccurred'));
        }
        if (recaptchaRef.current) recaptchaRef.current.reset();
        setRecaptchaToken('');
        return;
      }
      setSuccess(t('signUpSuccess'));
      // Automatinis prisijungimas po registracijos
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (loginRes && !loginRes.error) {
        if (onClose) onClose();
        window.location.reload();
      } else {
        setError(t('loginAfterSignUpFailed') || "Nepavyko prisijungti automatiškai.");
      }
    } catch (err) {
      setError(t('errorOccurred'));
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-semibold mb-4">{t('signUp')}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="email"
          className="border rounded px-3 py-2"
          placeholder={t('email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            className="border rounded px-3 py-2 w-full"
            placeholder={t('password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm"
            onClick={() => setShowPass(!showPass)}
            tabIndex={-1}
          >
            {showPass ? t('hide') : t('show')}
          </button>
        </div>
        <div className="relative">
          <input
            type={showPass2 ? "text" : "password"}
            className="border rounded px-3 py-2 w-full"
            placeholder={t('confirmPassword')}
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm"
            onClick={() => setShowPass2(!showPass2)}
            tabIndex={-1}
          >
            {showPass2 ? t('hide') : t('show')}
          </button>
        </div>
        {/* reCAPTCHA */}
        <div className="flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey="6LcTx3ErAAAAADIU4DuAJ7kYCaRtNiC8Ly9KKv9L"
            onChange={(token) => setRecaptchaToken(token)}
            theme="light"
          />
        </div>
        {error && <div className="text-red-600 text-xs">{error}</div>}
        {success && <div className="text-green-600 text-xs">{success}</div>}
        <button type="submit" className="bg-blue-700 text-white rounded py-2">{t('signUp')}</button>
      </form>
      <div className="mt-4 text-sm">
        {t('alreadyHaveAccount')}{' '}
        <button className="text-blue-700 underline" onClick={onSignIn}>{t('signIn')}</button>
      </div>
    </div>
  );
}
