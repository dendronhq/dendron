import { prepareServerArgs, startServer } from "./_server";


(async () => {
  try {
		// run forever
		console.log("start server...")
		debugger;
		const port = await startServer(prepareServerArgs());
		console.log(`server started in port ${port}`)
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();