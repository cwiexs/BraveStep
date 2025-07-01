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
  const [originalForm, setOriginalForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Jei neprisijungęs – redirect
  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') router.push('/api/auth/signin');
    return null;
  }
  if (status === 'loading') return null;

  // Užkrauna vartotojo info
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          const profile = {
            name: data.name || '',
            email: data.email || '',
            goal: data.goal || '',
            phone: data.phone || '',
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '',
            city: data.city || ''
          };
          setForm(profile);
          setOriginalForm(profile);
        });
    }
  }, [status]);

  // Ar buvo kokių nors pakeitimų?
  function isFormChanged() {
    if (!originalForm) return false;
    return Object.keys(form).some(key => form[key] !== originalForm[key]);
  }

  // Suranda tik pakeistus laukus
  function getChangedFields() {
    const changed = {};
    Object.keys(form).forEach(key => {
      if (form[key] !== originalForm[key]) {
        changed[key] = form[key];
      }
    });
    return changed;
  }

  // Išsaugo visus pakeitimus
  async function handleSaveAll() {
    setLoading(true);
    setSuccessMsg('');
    const changedFields = getChangedFields();
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields)
      });
      if (res.ok) {
        setSuccessMsg(t('saveSuccess') || 'Pakeitimai išsaugoti!');
        // Atnaujink formą kaip originalą (kad mygtukas vėl išsijungtų)
        setOriginalForm(form);
      } else {
        alert(t('saveError') || 'Klaida išsaugant duomenis!');
      }
    } catch {
      alert(t('saveError') || 'Klaida išsaugant duomenis!');
    }
    setLoading(false);
  }

  // Vienas bendras render funkcija kiekvienam laukui
  function FieldRow({ label, type, field, disabled }) {
    return (
      <div className="mb-3 flex gap-2 items-center">
        <label className="w-32">{label}</label>
        <input
          type={type}
          className="w-full p-2 border rounded"
          value={form[field]}
          onChange={e => setForm({ ...form, [field]: e.target.value })}
          disabled={disabled || loading}
        />
      </div>
    );
  }

  return (
    <form className="max-w-sm ml-0 p-4 bg-white rounded shadow"
      onSubmit={e => { e.preventDefault(); if (isFormChanged()) handleSaveAll(); }}>
      <h2 className="text-blue-900 font-medium hover:text-blue-700 rounded px-4 py-2 text-3xl transition">{t('myProfile')}</h2>

      <FieldRow label={t('name')}         type="text"  field="name"        />
      <FieldRow label={t('email')}        type="email" field="email"       disabled />
      <FieldRow label={t('goal')}         type="text"  field="goal"        />
      <FieldRow label={t('phone')}        type="text"  field="phone"       />
      <FieldRow label={t('dateOfBirth')}  type="date"  field="dateOfBirth" />
      <FieldRow label={t('city')}         type="text"  field="city"        />

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          className={`bg-blue-700 text-white rounded px-6 py-2 font-semibold transition ${(!isFormChanged() || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isFormChanged() || loading}
        >
          {loading ? t('loading') || 'Išsaugojama...' : t('save') || 'Išsaugoti'}
        </button>
        {successMsg && <span className="text-green-700">{successMsg}</span>}
      </div>
    </form>
  );
}
