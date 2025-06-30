import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';

export default function MyProfileModal({ open, onClose }) {
  const { data: session, status } = useSession();
  const { t } = useTranslation('common');
  const [form, setForm] = useState({ name: '', email: '', goal: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && status === 'authenticated') {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setForm({
          name: data.name || '',
          email: data.email || '',
          goal: data.goal || ''
        }));
    }
  }, [open, status]);

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
        alert(t('profileSaved'));
      } else {
        alert(t('saveError'));
      }
    } catch (err) {
      alert(t('saveError'));
    }
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-xl">✕</button>
        <h2 className="text-xl font-bold mb-4">{t('myProfile')}</h2>
        {status !== 'authenticated' ? (
          <div>{t('pleaseSignIn')}</div>
        ) : (
          <form onSubmit={handleSave}>
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
              disabled
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
        )}
      </div>
    </div>
  );
}
