// next.config.js
// Debug jungiklis: NUSTATYK NEXT_DEBUG=1, kai reikia aiškių stack trace (be minifikavimo)
const DEBUG = process.env.NEXT_DEBUG === '1';

// Importuojame i18n bazinę konfigūraciją (jei yra)
const { i18n: i18nFull = {} } = require('./next-i18next.config');

// Leiskime tik Next leidžiamus i18n laukus ir nustatykime patikimą EN fallback
const i18n = {
  locales: i18nFull.locales || ['en', 'lt'],
  defaultLocale: i18nFull.defaultLocale || 'en',   // <- numatytoji ANGŲ
  localeDetection: i18nFull.localeDetection ?? true,
  ...(i18nFull.domains ? { domains: i18nFull.domains } : {}),
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Kai DEBUG=1: išjungiame minifikavimą ir įjungiame source maps net production'e
  swcMinify: !DEBUG,
  productionBrowserSourceMaps: DEBUG,

  // Papildomai: aiškesni source maps ir devtool, kai DEBUG=1
  webpack: (config, { dev, isServer }) => {
    if (DEBUG) {
      // išlaikome pilnus source maps naršyklėje
      config.devtool = 'source-map';
    }
    return config;
  },

  // i18n pririšame čia
  i18n,
};

module.exports = nextConfig;
