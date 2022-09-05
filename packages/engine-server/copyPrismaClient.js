const fs = require("fs-extra");
const path = require("path");
const os = require("os");

function main() {
	// copy client
	// const srcPath = path.join("/tmp", "generated-prisma-client");
	// const libPath = path.join(__dirname, "lib", "drivers", "generated-prisma-client");

	const DENDRON_SYSTEM_ROOT = path.join(os.homedir(), ".dendron");
	const srcPath = path.join("src", "drivers", "generated-prisma-client");
	const libPath = path.join(DENDRON_SYSTEM_ROOT, "generated-prisma-client");
	fs.ensureDirSync(DENDRON_SYSTEM_ROOT);
	fs.copy(srcPath, libPath, { overwrite: true });

	// copy shim
	let shimPathSrc = path.join(__dirname, "src", "drivers", "prisma-shim.js");
	let shimPathDst = path.join(__dirname, "lib", "drivers", "prisma-shim.js");
	fs.copy(shimPathSrc, shimPathDst, { overwrite: true });

	// copy zip dep
	const tgt = "adm-zip.js"
	shimPathSrc = path.join(__dirname, "src", "drivers", tgt);
	shimPathDst = path.join(__dirname, "lib", "drivers", tgt);
	fs.copy(shimPathSrc, shimPathDst, { overwrite: true });

	console.log("done");
}

main();