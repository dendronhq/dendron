const _ = require("lodash");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = (phase) => {
  const env = {
    STAGE: process.env.STAGE || "dev",
    LOCAL: JSON.stringify(process.env["LOCAL"] === "true"),
  };
  console.log("build env:", env);

  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    env,
    // support the dev server to allow CORS
    async headers() {
      return [
        {
          source: "/(.*)?",
          headers: [
            {
              key: "Access-Control-Allow-Origin",
              value: "*",
            },
            {
              key: "Access-Control-Allow-Methods",
              value: "GET,HEAD,PUT,PATCH,POST,DELETE",
            },
          ],
        },
      ];
    },
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
    // webpack5: false,
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      config.plugins.push(new webpack.IgnorePlugin(/\/__tests__\//));
      if (env.STAGE === "dev") {
        config.optimization.minimize = false;
      }
      // config.node = {
      //   ...config.node,
      //   fs: "empty",
      //   tls: "empty",
      //   net: "empty",
      //   "cross-spawn": "empty",
      //   child_process: "empty",
      // };
      // Important: return the modified config

      return config;
    },
  };

  return nextConfig;
};
