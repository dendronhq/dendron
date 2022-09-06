/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require('https');
const { admZip: AdmZip } = require('./adm-zip');

const DENDRON_SYSTEM_ROOT = path.join(os.homedir(), ".dendron");

async function downloadPrisma() {

  return new Promise((resolve, reject) => {
    const url = "https://d2q204iup008xl.cloudfront.net/publish/generated-prisma-client.zip";
    const tmpPath = path.join(DENDRON_SYSTEM_ROOT, "tmp_client");
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
    const file = fs.createWriteStream(tmpPath);
    https.get(url, (response) => {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        resolve({ prismaDownloadPath: tmpPath });
      });
      file.on("error", (err) => {
        reject(err)
      })
    });

  })
}

async function loadPrisma() {
  const prismaPath = path.join(DENDRON_SYSTEM_ROOT, "generated-prisma-client");
  if (fs.existsSync(prismaPath)) {
    const { Prisma, PrismaClient } = require(prismaPath);
    return {
      Prisma,
      PrismaClient,
    }
  } else {
    const { prismaDownloadPath } = await downloadPrisma()

    // Prisma not installed
    const zip = new AdmZip(prismaDownloadPath);
    zip.extractAllTo(prismaPath, true);
    // TODO: remove download
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
