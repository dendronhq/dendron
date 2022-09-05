/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require("fs");
const path = require("path");
const os = require("os");

function loadPrisma() {
  const DENDRON_SYSTEM_ROOT = path.join(os.homedir(), ".dendron");
  const prismaPath = path.join(DENDRON_SYSTEM_ROOT, "generated_prisma_client");
  if (fs.existsSync(prismaPath)) {
    const { Prisma, PrismaClient } = require(prismaPath);
    return {
      Prisma,
      PrismaClient,
    }
  } else {
    // Prisma not installed
    fs.renameSync("/tmp/generated_prisma_client/", prismaPath);
    const { Prisma, PrismaClient } = require(prismaPath);
    return {
      Prisma,
      PrismaClient,
    }
  }
}

module.exports = {
  loadPrisma
}
