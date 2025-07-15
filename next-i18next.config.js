module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'lt'],
    localePath: typeof window === 'undefined'
      ? require('path').resolve('./public/locales')
      : '/locales',
  },
  ns: ['common', 'eatingHabitsTranslations'], // Pridėtas eatingHabits namespace
  defaultNS: 'common', // Nustatomas default namespace
};