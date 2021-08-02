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
	const vaultRoot = path.join(__dirname, "..", "..", "test-workspace-5k-profile", "vault");
	await Promise.all(_.range(0, 5000).map(async idx => {
		return fs.writeFile(path.join(vaultRoot, `${idx}.md`), generateNote({generatedLength: 5}));
	}));
}

main();