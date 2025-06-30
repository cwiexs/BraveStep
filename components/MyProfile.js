// components/MyProfile.js

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
    goal: ''
  });
  const [loading, setLoading] = useState(false);

  // Jeigu neprisijungęs – redirect į prisijungimo puslapį
  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') {
      router.push('/api/auth/signin');
    }
    return null;
  }

  // Jei sesija kraunasi – galima rodyti nieko arba loaderį
  if (status === 'loading') {
    return null;
    // arba: return <div>Kraunasi...</div>;
  }

  // Užkraunam vartotojo duomenis
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          setForm({
            name: data.name || '',
            email: data.email || '',
            goal: data.goal || ''
          });
        });
    }
  }, [status]);

  // Išsaugoti profilio duomenis
  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        alert(t('profileSaved')); // "Profilis išsaugotas"
      } else {
        alert(t('saveError')); // "Išsaugoti nepavyko"
      }
    } catch (err) {
      alert(t('saveError'));
    }
    setLoading(false);
  }

  // Forma rodoma TIK kai prisijungęs!
  return (
    <form className="max-w-md mx-auto p-4 bg-white rounded shadow" onSubmit={handleSave}>
      <h2 className="text-xl font-bold mb-4">{t('myProfile')}</h2>

      <label className="block mb-1">{t('name')}</label>
      <input
        type="text"
        className="w-full p-2 border mb-4 rounded"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />

      <label className="block mb-1">{t('email')}</label>
      <input
        type="email"
        className="w-full p-2 border mb-4 rounded"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        disabled // redaguoti el. paštą nebūtina
      />

      <label className="block mb-1">{t('goal')}</label>
      <input
        type="text"
        className="w-full p-2 border mb-4 rounded"
        value={form.goal}
        onChange={e => setForm({ ...form, goal: e.target.value })}
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? t('saving') : t('save')}
      </button>
    </form>
  );
}
