import fs from "fs-extra";
import { genUUID } from "@dendronhq/common-all";

export function appendUUID(fname: string) {
  return `${fname}-${genUUID()}`;
}

export function setupTmpDendronDir(opts: {
  fixturesDir: string;
  tmpDir: string;
}): string {
  const dirPath = appendUUID(opts.tmpDir);
  // eslint-disable-next-line no-undef
  fs.ensureDirSync(dirPath);
  fs.emptyDirSync(dirPath);
  fs.copySync(opts.fixturesDir, dirPath);
  return dirPath;
}

export const testUtils = {
  setupTmpDendronDir
};
