const { env } = require('./env/server')

// throws if validation fails
require('./utils/validation')

const { NEXT_PUBLIC_ASSET_PREFIX, BUILD_DIR, DATA_DIR, PUBLIC_DIR } = env;
const isProd = process.env.NODE_ENV !== "development";

// NOTE: __dirname is the dirname where this configuration file is located
const payload = {
  reactStrictMode: true,
  trailingSlash: true,
  basePath:
    isProd && NEXT_PUBLIC_ASSET_PREFIX ? NEXT_PUBLIC_ASSET_PREFIX : undefined,
  assetPrefix:
    isProd && NEXT_PUBLIC_ASSET_PREFIX ? NEXT_PUBLIC_ASSET_PREFIX : undefined,
  env: {
    DATA_DIR,
    PUBLIC_DIR,
  },
  distDir: BUILD_DIR || '.next',
  swcMinify: true,
};

if (!isProd && process.env.ANALYZE) {
  // eslint-disable-next-line global-require
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
  });
  module.exports = withBundleAnalyzer(payload);
} else {
  module.exports = payload;
}
