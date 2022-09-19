import fs from "fs-extra";
import path from "path";
import { parse, treeMenuSchema } from "@dendronhq/common-all";
import { getDataDir } from "../utils/build";

const dataDir = getDataDir();

// check if `tree.json` is formated correctly
const treeInput = fs.readJSONSync(path.join(dataDir, "tree.json"));
const treeMenuResp = parse(treeMenuSchema, treeInput);
if (treeMenuResp.error) {
  throw new Error(
    "The version of `dendron-cli` you have is out of date and not compatible with the latest nextjs-template. Please upgrade you `dendron-cli` by running `npm install @dendron-cli@latest` in the root of your workspace (where your dendron.yml file is located"
  );
}
