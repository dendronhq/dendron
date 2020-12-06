const path = require("path");
const {getSiteConfig} = require(path.join(
    __dirname,
    "..",
    "libs",
    "utils.js"
  ));

module.exports = function () {
    return getSiteConfig();
};