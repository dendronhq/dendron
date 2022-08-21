const fs = require("fs-extra");
const path = require("path");

function main() {
	const libPath = path.join(__dirname, "lib", "drivers", "generated-prisma-client");
	const srcPath = path.join("src", "drivers", "generated-prisma-client");
	fs.ensureDirSync(libPath);
	fs.copy(srcPath, libPath, { overwrite: true });
	console.log("done");
}

main();