const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { IgnorePlugin } = require("webpack");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node",
  entry: {
    extension: "./src/extension.ts",
    server: "./src/server.ts",
  },
  output: {
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
      vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded
      "pino-pretty": "pino-pretty",
    },
    /(@dendronhq|packages)\/dendron-11ty-legacy$/,
    /\.\/webpack-require-hack/,
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: path.join("assets", "static"), to: "static" }],
    }),
    // @ts-ignore
    new CopyPlugin({
      patterns: [{ from: path.join("assets", "dendron-ws"), to: "dendron-ws" }],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(
            "..",
            "common-all",
            "data",
            "dendron-yml.validator.json"
          ),
          to: "dendron-yml.validator.json",
        },
      ],
    }),
    // @ts-ignore
    new CopyPlugin({
      patterns: [
        { from: "webpack-require-hack.js", to: "webpack-require-hack.js" },
      ],
    }),
    ...(process.env.SKIP_SENTRY
      ? []
      : [
          // @ts-ignore
          new SentryWebpackPlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: "dendron",
            project: "dendron",
            release: process.env.DENDRON_RELEASE_VERSION,

            // other SentryWebpackPlugin configuration
            include: ".",
            ignore: ["node_modules", "webpack.config.js"],
          }),
        ]),
  ],
  module: {
    rules: [
      {
        include: /node_modules/,
        test: /\.mjs$/,
        type: "javascript/auto",
      },
      { test: /\.node$/, loader: 'ignore-loader' },
      { test: /\.d\.ts$/, loader: 'ignore-loader' },
      { test: /\.js\.map$/, loader: 'ignore-loader' },
      {
        test: /\.tsx?$/,
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
              configFile: "tsconfig.build.json",
              transpileOnly: true,
              compilerOptions: {
                module: "es6", // override `tsconfig.json` so that TypeScript emits native JavaScript modules.
              }
            },
          },
        ],
      },
    ],
  },
};
module.exports = config;
