const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = (phase, defaultConfig) => {
  const env = {
    STAGE: process.env.STAGE || "dev",
    LOCAL: JSON.stringify(process.env["LOCAL"] === "true"),
  };
  console.log("build env:", env);

  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    ...defaultConfig,
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
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      return {
        ...config,
        plugins: [...config.plugins, new webpack.IgnorePlugin(/\/__tests__\//)],
        optimization: {
          minimize: env.STAGE === "dev" ? false : config.optimization.minimize,
        },
      };
    },
  };

  return withBundleAnalyzer(nextConfig);
};
