import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';

export default function MyProfile() {
  console.log('%c[MyProfile RENDER]', 'color: green; font-weight: bold;', new Date().toLocaleTimeString());

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

  // Redirect jei neprisijungęs
  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') {
      console.log('%c[REDIRECT to SIGNIN]', 'color: orange; font-weight: bold;', new Date().toLocaleTimeString());
      console.log('Status:', status, Date.now());
      router.push('/api/auth/signin');
    }
    return null;
  }
  if (status === 'loading') return null;

  useEffect(() => {
    console.log('%c[useEffect] status:', 'color: blue;', status, new Date().toLocaleTimeString());
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
          console.log('%c[DATA LOADED from API]', 'color: purple;', profile, new Date().toLocaleTimeString());
        });
    }
  }, [status]);

  function isFormChanged() {
    if (!originalForm) return false;
    return Object.keys(form).some(key => form[key] !== originalForm[key]);
  }

  function getChangedFields() {
    const changed = {};
    Object.keys(form).forEach(key => {
      if (form[key] !== originalForm[key]) {
        changed[key] = form[key];
      }
    });
    return changed;
  }

  async function handleSaveAll() {
    setLoading(true);
    const changedFields = getChangedFields();
    console.log('%c[SAVE BUTTON CLICKED] Fields to update:', 'color: teal;', changedFields, new Date().toLocaleTimeString());
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields)
      });
      if (res.ok) {
        setOriginalForm(form);
        console.log('%c[SAVE SUCCESS]', 'color: green;', new Date().toLocaleTimeString());
      } else {
        alert(t('saveError') || 'Klaida išsaugant duomenis!');
        console.log('%c[SAVE FAILED - RES NOT OK]', 'color: red;', new Date().toLocaleTimeString());
      }
    } catch {
      alert(t('saveError') || 'Klaida išsaugant duomenis!');
      console.log('%c[SAVE FAILED - EXCEPTION]', 'color: red;', new Date().toLocaleTimeString());
    }
    setLoading(false);
  }

  function handleChange(field, value) {
    console.log('%c[INPUT CHANGE]', 'color: #a0522d;', field, '->', value, new Date().toLocaleTimeString());
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function FieldRow({ label, type, field, disabled }) {
    return (
      <div className="mb-3 flex gap-2 items-center">
        <label className="w-32">{label}</label>
        <input
          type={type}
          className="w-full p-2 border rounded"
          value={form[field]}
          onChange={e => handleChange(field, e.target.value)}
          disabled={disabled || loading}
        />
      </div>
    );
  }

  return (
    <form
      className="max-w-sm ml-0 p-4 bg-white rounded shadow"
      onSubmit={e => {
        e.preventDefault();
        console.log('%c[FORM SUBMIT]', 'color: navy;', 'isFormChanged:', isFormChanged(), new Date().toLocaleTimeString());
        if (isFormChanged()) handleSaveAll();
      }}
    >
      <h2 className="text-blue-900 font-medium mb-4">{t('myProfile')}</h2>
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
      </div>
    </form>
  );
}
