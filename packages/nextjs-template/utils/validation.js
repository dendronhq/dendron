const fs = require("fs-extra");
const path = require("path");
const { parse, treeMenuSchema } = require("@dendronhq/common-all");
const { env } = require('../env/server')

const dataDir = env.DATA_DIR
if (!dataDir) {
  throw new Error("DATA_DIR not set");
}

// check if `tree.json` is formated correctly
const treeInput = fs.readJSONSync(path.join(dataDir, "tree.json"));
const treeMenuResp = parse(treeMenuSchema, treeInput);
if (treeMenuResp.error) {
  throw new Error(
    "The version of `dendron-cli` you have is out of date and not compatible with the latest nextjs-template. Please upgrade you `dendron-cli` by running `npm install @dendron-cli@latest` in the root of your workspace (where your dendron.yml file is located)."
  );
}
