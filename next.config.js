// next.config.js
const DEBUG = true; // LAIKINAI true, tik diagnostikai

const { i18n: i18nFull = {} } = require('./next-i18next.config');
const i18n = {
  locales: i18nFull.locales || ['en', 'lt'],
  defaultLocale: i18nFull.defaultLocale || 'en',
  localeDetection: i18nFull.localeDetection ?? true,
  ...(i18nFull.domains ? { domains: i18nFull.domains } : {}),
};

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  swcMinify: !DEBUG,                 // išjungiame minifikavimą
  productionBrowserSourceMaps: DEBUG, // įjungiame source maps
  webpack: (config) => { config.devtool = 'source-map'; return config; },
  i18n,
};
