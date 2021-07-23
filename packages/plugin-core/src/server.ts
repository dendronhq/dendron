/**
 * This file is used by {@link startServerProcess} to start the dendron engine in a separate process
 */
import { ServerUtils } from "@dendronhq/api-server";
import { stringifyError } from "@dendronhq/common-all";

(async () => {
  try {
    // run forever
    await ServerUtils.startServerNode(ServerUtils.prepareServerArgs());
  } catch (err) {
    if (process.send) {
      process.send(stringifyError(err));
    }
    process.exit(1);
  }
})();
