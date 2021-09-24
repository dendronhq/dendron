const path = require("path");
const {FRONTEND_CONSTANTS} = require("@dendronhq/common-frontend");
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const {NEXT_PUBLIC_ASSET_PREFIX} = process.env;
const isProd = process.env.NODE_ENV === 'production'


// NOTE: __dirname is the dirname where this configuration file is located
module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  trailingSlash: true,
  basePath: (isProd && NEXT_PUBLIC_ASSET_PREFIX) ? NEXT_PUBLIC_ASSET_PREFIX : undefined,
  assetPrefix: (isProd && NEXT_PUBLIC_ASSET_PREFIX) ? NEXT_PUBLIC_ASSET_PREFIX : undefined,
  env: {
    DATA_DIR: path.join(__dirname, FRONTEND_CONSTANTS.DEFAULT_DATA_DIR)
  }
})
