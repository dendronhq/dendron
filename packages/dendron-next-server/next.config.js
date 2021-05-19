const _ = require("lodash");
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = (phase) => {
  const env = {
    STAGE: process.env.STAGE || "dev",
    LOCAL: JSON.stringify(process.env["LOCAL"] === 'true')
  };
  console.log("build env:", env);
  return {
    env,
    // support the dev server to allow CORS
    async headers() {
      return [
        {
          source: '/(.*)?',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*'
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET,HEAD,PUT,PATCH,POST,DELETE'
            },
          ]
        }
      ]
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      config.plugins.push(new webpack.IgnorePlugin(/\/__tests__\//));
      if (env.STAGE === 'dev') {
        config.optimization.minimize = false;
      }
      config.node = {
        ...config.node,
        fs: "empty",
        tls: 'empty',
        net: "empty",
        "cross-spawn": "empty",
        child_process: "empty",
      };
      if (process.env.ANALYZE) {
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: isServer ? 8888 : 8889,
            openAnalyzer: true,
          })
        )
       }
      // Important: return the modified config
      return config;
    },
  };
};