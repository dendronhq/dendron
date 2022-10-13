// @ts-check
const { parse } = require("@dendronhq/common-all");
const { clientEnv, clientSchema } = require("./schema");

const _clientEnv = parse(clientSchema, clientEnv);

if (_clientEnv.isErr()) {
  throw _clientEnv.error;
}

module.exports = {
  env: _clientEnv.value
};
