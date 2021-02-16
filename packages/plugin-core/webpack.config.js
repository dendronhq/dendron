//@ts-check

"use strict";

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { IgnorePlugin } = require("webpack");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  entry: "./src/extension.ts", // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  node: {
    __dirname: false,
  },
  devtool: "source-map",
  externals: [
    {
      vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
      "pino-pretty": "pino-pretty",
    },
    /(@dendronhq|packages)\/dendron-11ty$/,
    /\.\/webpack-require-hack/
  ],
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
  },
  plugins: [
    // new CopyPlugin({
    //   patterns: [{ from: path.join("assets", "static"), to: "static" }],
    // }),
    new CopyPlugin({
      patterns: [{ from: path.join("assets", "dendron-ws"), to: "dendron-ws" }],
    }),
    new CopyPlugin({
      patterns: [{ from: "webpack-require-hack.js", to: "webpack-require-hack.js" }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              ignoreDiagnostics: [
                6196,
                // never read
                6133,
                // import not used
                6192,
                // cannot find namespace jest
                2503,
              ],
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
};
module.exports = config;
