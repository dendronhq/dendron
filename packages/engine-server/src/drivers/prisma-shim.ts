/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require("fs");
const path = require("path");
const os = require("os");

// @ts-ignore
function requireUncached(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

const DENDRON_SYSTEM_ROOT = path.join(os.homedir(), ".dendron");
const prismaPath = path.join(DENDRON_SYSTEM_ROOT, "generated_prisma_client");
if (fs.existsSync(prismaPath)) {
  const { Prisma, PrismaClient } = require(prismaPath);
  module.exports = {
    Prisma,
    PrismaClient,
  };
} else {
  // Prisma not installed
  fs.renameSync("/tmp/generated-prisma-client", prismaPath);
  const { Prisma, PrismaClient } = requireUncached(prismaPath);
  module.exports = {
    Prisma,
    PrismaClient,
  };
}
