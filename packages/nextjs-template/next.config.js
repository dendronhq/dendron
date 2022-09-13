const path = require("path");
const process = require("process");
const { FRONTEND_CONSTANTS } = require("@dendronhq/common-frontend");

const { NEXT_PUBLIC_ASSET_PREFIX, BUILD_DIR, DATA_DIR, PUBLIC_DIR } = process.env;
const isProd = process.env.NODE_ENV === "production";

// NOTE: __dirname is the dirname where this configuration file is located
const payload = {
  reactStrictMode: true,
  trailingSlash: true,
  basePath:
    isProd && NEXT_PUBLIC_ASSET_PREFIX ? NEXT_PUBLIC_ASSET_PREFIX : undefined,
  assetPrefix:
    isProd && NEXT_PUBLIC_ASSET_PREFIX ? NEXT_PUBLIC_ASSET_PREFIX : undefined,
  env: {
    DATA_DIR: DATA_DIR || path.join(__dirname, FRONTEND_CONSTANTS.DEFAULT_DATA_DIR),
    PUBLIC_DIR: PUBLIC_DIR || path.join(__dirname, "public"),
  },
  distDir: BUILD_DIR || '.next',
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
