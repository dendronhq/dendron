import _ from "lodash";
import fs from "fs-extra";
import { GOOGLE_OAUTH_ID, GOOGLE_OAUTH_SECRET } from "../src/types/global";

/**
 * Workaround to substitute values for global consts during vsix packaging
 */
// @ts-ignore
function main() {
  const pathToUpdate = "./out/src/types/global.js";
  const globalfile = fs.readFileSync(pathToUpdate);

  if (undefined === process.env.GOOGLE_OAUTH_CLIENT_ID) {
    console.log(
      "Unable to find envrionment variable GOOGLE_OAUTH_CLIENT_ID. Placeholder value will be used."
    );
  }
  if (undefined === process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    console.log(
      "Unable to find envrionment variable GOOGLE_OAUTH_CLIENT_SECRET. Placeholder value will be used."
    );
  }
  const clientId =
    undefined !== process.env.GOOGLE_OAUTH_CLIENT_ID
      ? process.env.GOOGLE_OAUTH_CLIENT_ID
      : GOOGLE_OAUTH_ID;
  const secret =
    undefined !== process.env.GOOGLE_OAUTH_CLIENT_SECRET
      ? process.env.GOOGLE_OAUTH_CLIENT_SECRET
      : GOOGLE_OAUTH_SECRET;

  const outputFile = globalfile
    .toString()
    .replace(GOOGLE_OAUTH_ID, clientId)
    .replace(GOOGLE_OAUTH_SECRET, secret);
  fs.writeFileSync(pathToUpdate, outputFile);
}

main();
