import path from 'path';
export default {
  experimental: { appDir: true },
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  }
};
