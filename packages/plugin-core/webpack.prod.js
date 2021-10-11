const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");

const common = require("./webpack.common.js");
module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
          mangle: true,
          sourceMap: true,
          // compress: false,
          keep_classnames: /AbortSignal/,
          keep_fnames: /AbortSignal/,
        },
      }),
    ],
  },
});
