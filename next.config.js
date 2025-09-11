// next.config.js
const { i18n: i18nFull = {} } = require('./next-i18next.config');

// Leiskime tik Next.js leidžiamus i18n laukus:
const i18n = {
  locales: i18nFull.locales || ['en', 'lt'],
  defaultLocale: i18nFull.defaultLocale || 'en',
  localeDetection: i18nFull.localeDetection ?? true,
  // domains – taip pat leidžiamas (naudok, jei turi daugiadomenę i18n konfigūraciją)
  ...(i18nFull.domains ? { domains: i18nFull.domains } : {}),
};

module.exports = {
  reactStrictMode: true,
  swcMinify: false,
  i18n,
};
