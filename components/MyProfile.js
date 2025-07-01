import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';

export default function MyProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [form, setForm] = useState({
    name: '',
    email: '',
    goal: '',
    phone: '',
    dateOfBirth: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  // Jei neprisijungęs – redirect
  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') router.push('/api/auth/signin');
    return null;
  }
  if (status === 'loading') return null;

  // Užkrauna vartotojo info
const [loaded, setLoaded] = useState(false); // ← nauja būsena

useEffect(() => {
  if (status === 'authenticated' && !loaded) {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setForm({
          name: data.name || '',
          email: data.email || '',
          goal: data.goal || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '',
          city: data.city || ''
        });
        setLoaded(true); // ← duomenys užkrauti, daugiau nebeatnaujinti
      });
  }
}, [status, loaded]);



  // Kiekvieno lauko išsaugojimas atskirai
  async function handleFieldSave(field) {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: form[field] })
      });
      if (!res.ok) alert(t('saveError'));
    } catch {
      alert(t('saveError'));
    }
    setLoading(false);
  }

  // Atvaizduoja vieną redaguojamą eilutę
  function FieldRow({ label, type, field, disabled }) {
    return (
      <div className="mb-3 flex gap-2 items-center">
        <label className="w-32">{label}</label>
        <input
          type={type}
          className="w-full p-2 border rounded"
          value={form[field]}
          onChange={e => setForm({ ...form, [field]: e.target.value })}
          disabled={disabled}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => handleFieldSave(field)}
            className="bg-blue-500 text-white rounded px-3 py-1"
            disabled={loading}
          >
            {t('save')}
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="max-w-sm ml-0 p-4 bg-white" onSubmit={e => e.preventDefault()}>
      <h2 className="text-blue-900 font-medium hover:text-blue-700 rounded px-4 py-2 text-3xl transition">{t('myProfile')}</h2>

      <FieldRow label={t('name')}         type="text"  field="name"        />
      <FieldRow label={t('email')}        type="email" field="email"       disabled />
      <FieldRow label={t('goal')}         type="text"  field="goal"        />
      <FieldRow label={t('phone')}        type="text"  field="phone"       />
      <FieldRow label={t('dateOfBirth')}  type="date"  field="dateOfBirth" />
      <FieldRow label={t('city')}         type="text"  field="city"        />

    </form>
  );
}
