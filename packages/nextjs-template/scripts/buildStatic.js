const nextjsConfig = require("../next.config.js");
const fs = require("fs-extra");
const path = require("path");

function main() {
	const dataDir = nextjsConfig.env.DATA_DIR;
	const publicDir = path.join(__dirname, "..", "public", "data")
	console.log(dataDir, publicDir);
	fs.copySync(dataDir, publicDir )
	console.log("done")
}

main();