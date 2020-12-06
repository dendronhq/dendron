const path = require("path");
const {getDendronConfig} = require(path.join(
    __dirname,
    "..",
    "libs",
    "utils.js"
  ));

module.exports = function () {
    return getDendronConfig();
};
  