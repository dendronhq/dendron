const {generateNote} = require("./randomNote");
const _ = require("lodash");
const fs = require("fs-extra");
const path = require("path");
const $ = require("execa");


function createVault() {
	const vaultName = "vault-generated";
	const vaultRoot = path.join(__dirname, "..", vaultName);
	fs.ensureDirSync(vaultRoot);
	console.log(vaultRoot);
	$.commandSync("dendron seed init test.vault-generated --mode create_workspace", {cwd: vaultRoot, shell: true});
}

async function main() {
	const vaultName = "vault-generated";
	const vaultRoot = path.join(__dirname, "..", vaultName);
	const vaultFolder = path.join(vaultRoot, "vault");
	await Promise.all(_.range(0, 100).map(async idx => {
		console.log(idx);
		return fs.writeFile(path.join(vaultFolder, `${idx}.md`), generateNote());
	}));
}

main();