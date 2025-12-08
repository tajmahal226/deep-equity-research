const bundleAnalyzer = require('@next/bundle-analyzer');

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Import the TypeScript config
const tsConfig = require('./next.config.ts');

module.exports = async function config(phase) {
  const base = await tsConfig.default(phase);
  return withBundleAnalyzer(base);
};
