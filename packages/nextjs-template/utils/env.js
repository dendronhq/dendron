const { z } = require("zod");
const path = require("path");
const { FRONTEND_CONSTANTS } = require("@dendronhq/common-frontend");
const { parse } = require("@dendronhq/common-all");

const serverSchema = z.object({
  DATA_DIR: z
    .string()
    .default(path.join(__dirname, "..", FRONTEND_CONSTANTS.DEFAULT_DATA_DIR)),
  PUBLIC_DIR: z.string().default(path.join(__dirname, "..", "public")),
});

const clientSchema = z.object({
  NEXT_PUBLIC_ASSET_PREFIX: z.string().optional(),
});

const clientEnv = {
  NEXT_PUBLIC_ASSET_PREFIX: process.env.NEXT_PUBLIC_ASSET_PREFIX,
};

const serverEnv = parse(serverSchema, process.env);

if (serverEnv.error) {
  throw serverEnv.error;
}

const _clientEnv = parse(clientSchema, clientEnv);
if (_clientEnv.error) {
  throw _clientEnv.error;
}

module.exports = {
  env: {
    ...serverEnv.data,
    ..._clientEnv.data,
  },
};
