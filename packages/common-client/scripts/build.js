"use strict";

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", (err) => {
  throw err;
});

const configFactory = require("../config/webpack.config");

const webpack = require("webpack");
const config = configFactory("production");

function build() {
  console.log("building...");
  const compiler = webpack(config);
  compiler.run((err, stats) => {
    console.log({ err, stats });
  });
}

build();
