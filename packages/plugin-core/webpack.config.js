//@ts-check

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { IgnorePlugin, DefinePlugin } = require("webpack");
/**@type {import('webpack').Configuration}*/
const config = {
  target: "node",
  entry: {
    extension: "./src/extension.ts",
    server: "./src/server.ts",
  },
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
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
    /\.\/webpack-require-hack/,
  ],
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: path.join("assets", "static"), to: "static" }],
    }),
    new IgnorePlugin({
      resourceRegExp: /fsevents/,
    }),
    // @ts-ignore
    new CopyPlugin({
      patterns: [{ from: path.join("assets", "dendron-ws"), to: "dendron-ws" }],
    }),
    new CopyPlugin({
      patterns: [
        { from: path.join("..", "common-all", "data", "dendron-yml.validator.json"), to: "dendron-yml.validator.json" },
      ],
    }),
    // @ts-ignore
    new CopyPlugin({
      patterns: [
        { from: "webpack-require-hack.js", to: "webpack-require-hack.js" },
      ],
    }),
    new DefinePlugin({
      GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    })
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
