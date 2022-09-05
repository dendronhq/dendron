const fs = require("fs-extra");
const path = require("path");
const os = require("os");

function main() {
	// copy client
	const srcPath = path.join("/tmp", "generated-prisma-client");
	const DENDRON_SYSTEM_ROOT = path.join(os.homedir(), ".dendron");
	const libPath = path.join(DENDRON_SYSTEM_ROOT, "generated_prisma_client");
	fs.ensureDirSync(DENDRON_SYSTEM_ROOT);
	fs.removeSync(libPath);
	fs.copy(srcPath, libPath, { overwrite: true });

	// copy shim
	const shimPathSrc = path.join(__dirname, "src", "drivers", "prisma-shim.js");
	const shimPathDst = path.join(__dirname, "lib", "drivers", "prisma-shim.js");
	fs.copy(shimPathSrc, shimPathDst, { overwrite: true });

	console.log("done");
}

main();