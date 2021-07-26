const path = require("path");
const {FRONTEND_CONSTANTS} = require("@dendronhq/common-frontend");

// NOTE: __dirname is the dirname where this configuration file is located
module.exports = {
  reactStrictMode: true,
  env: {
    DATA_DIR: path.join(__dirname, FRONTEND_CONSTANTS.DEFAULT_DATA_DIR)
  }
}
