import { useTranslation } from 'next-i18next';

export default function MemberSection({ user }) {
  const { t } = useTranslation('common');
  return (
    <section className="flex flex-col items-center justify-center py-20">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('welcome')}, {user?.email || 'User'}!</h1>
      <p className="text-lg text-gray-600">{t('signedInMessage') || 'You are now signed in. More features coming soon!'}</p>
    </section>
  );
}
