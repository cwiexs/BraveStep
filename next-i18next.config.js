module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'lt'],
    localePath: typeof window === 'undefined'
      ? require('path').resolve('./public/locales')
      : '/locales',
  },
};
