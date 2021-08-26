import _ from "lodash";
import fs from "fs-extra";

/**
 * Workaround to substitute values for global consts that are normally injected
 * through webpack definePlugin.
 */
function main() {
  const pathToUpdate = "./out/src/types/global.js";
  const globalfile = fs.readFileSync(pathToUpdate);
  const outputFile = globalfile
    .toString()
    .replace("GOOGLE_OAUTH_CLIENT_ID", '"client_id_placeholder"')
    .replace("GOOGLE_OAUTH_CLIENT_SECRET", '"secrent_placeholder"');
  fs.writeFileSync(pathToUpdate, outputFile);
}

main();
