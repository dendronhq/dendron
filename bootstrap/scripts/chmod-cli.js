#!/usr/bin/env node 

const fs = require("fs");
const path = require("path");

function rootCheck(root) {
	return fileCheck(path.join(root, "lerna.json"))
}

function fileCheck(fpath) {
	if (!fs.existsSync(fpath)) {
		console.log(fpath, " does not exist");
		process.exit(1)
	}
}

function main() {
	const root = process.cwd();
	rootCheck(root);
	const cliPath = path.join(root, "packages", "dendron-cli", "lib", "bin", "dendron-cli.js");
	fileCheck(cliPath);
	fs.chmodSync(cliPath, 0700);
	console.log("made ", cliPath, " executable")
}

main();
