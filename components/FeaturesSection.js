import { useTranslation } from 'next-i18next';

export default function FeaturesSection() {
  const { t } = useTranslation('common');
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-7 pb-4 px-2">
      {/* Feature 1 */}
      <div className="bg-[#F6F8F7] border border-[#E7E7E7] rounded-xl shadow-sm flex flex-col items-center p-7 min-h-[200px]">
        <div className="text-4xl mb-4 text-[#75BFA2]">✅</div>
        <h3 className="font-bold text-lg mb-2 text-blue-900">{t('features.workoutsTitle')}</h3>
        <p className="text-gray-600 text-center">{t('features.workoutsText')}</p>
      </div>
      {/* Feature 2 */}
      <div className="bg-[#F6F8F7] border border-[#E7E7E7] rounded-xl shadow-sm flex flex-col items-center p-7 min-h-[200px]">
        <div className="text-4xl mb-4 text-[#75BFA2]">🍏</div>
        <h3 className="font-bold text-lg mb-2 text-blue-900">{t('features.mealTitle')}</h3>
        <p className="text-gray-600 text-center">{t('features.mealText')}</p>
      </div>
      {/* Feature 3 */}
      <div className="bg-[#F6F8F7] border border-[#E7E7E7] rounded-xl shadow-sm flex flex-col items-center p-7 min-h-[200px]">
        <div className="text-4xl mb-4 text-[#75BFA2]">📊</div>
        <h3 className="font-bold text-lg mb-2 text-blue-900">{t('features.trackTitle')}</h3>
        <p className="text-gray-600 text-center">{t('features.trackText')}</p>
      </div>
    </section>
  );
}
