import { stringifyError } from "@dendronhq/common-all";
import { prepareServerArgs, startServerNode } from "./_server";


(async () => {
  try {
		// run forever
		console.log("start server...")
		const port = await startServerNode(prepareServerArgs());
		console.log(port);
  } catch (err) {
    console.error(err);
		if (process.send) {
			process.send(stringifyError(err))
		}
    process.exit(1);
  }
})();