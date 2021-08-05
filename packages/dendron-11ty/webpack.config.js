const path = require("path");
let mode = process.env.stage === "prod" ? "production" : "development";
module.exports = {
  mode,
  entry: "./libs/auth.js",
  devServer: {
    contentBase: "./dist",
  },
  output: {
    path: path.join(__dirname, "assets", "js"),
    filename: "auth.js",
  },
};
