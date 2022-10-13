// @ts-check
const { parse } = require("@dendronhq/common-all");
const { serverSchema,  } = require("./schema");
const { env: clientEnv } = require("./client")

/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 */

const serverEnv = parse(serverSchema, process.env);

if (serverEnv.isErr()) {
  throw serverEnv.error;
}

module.exports = {
  env: {
    ...serverEnv.value,
    ...clientEnv
  }
};
