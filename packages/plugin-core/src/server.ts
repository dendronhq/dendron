import { ServerUtils } from "@dendronhq/api-server";
import { stringifyError } from "@dendronhq/common-all";


(async () => {
  try {
		// run forever
		await ServerUtils.startServerNode(ServerUtils.prepareServerArgs());
  } catch (err) {
		if (process.send) {
			process.send(stringifyError(err))
		}
    process.exit(1);
  }
})();