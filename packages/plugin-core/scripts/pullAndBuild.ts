#!/usr/bin/env node

import yargs from "yargs";
import fs from "fs-extra";
import { execa } from "@dendronhq/dendron-cli";

const $ = execa.commandSync;

function checkoutInteg() {
  console.log("checkout...");
  $(`echo "checkout..."`);
  $(`git reset --hard`);
  $(`git clean -f`);
  $(`git checkout master`);
  $(`git fetch`);
  $(`git branch -D integ-publish`);
  $(`git checkout --track origin/integ-publish`);
}

function syncStatic() {
  console.log("sync static...");
  const { stdout, stderr } = $(`./scripts/sync_static.sh`);
  console.log({ stdout, stderr });
}

function updatePkgJSON() {
  console.log("update pkg...");
  $(`rm ../../package.json`);
  const pkg = fs.readJSONSync("package.json");
  pkg.name = "dendron";
  pkg.main = "./dist/extension.js";
  pkg.repository = {
    url: "https://github.com/dendronhq/dendron.git",
    type: "git",
  };
  fs.writeJSONSync("package.json", pkg, { spaces: 4 });
}

function installAndPkg() {
  console.log("installing...");
  $(`yarn install --no-lockfile`);
  console.log("packaging...");
  $(`vsce package --yarn`);
}

function getVersion() {
  return fs.readJSONSync("package.json").version;
}

function main() {
  let args = yargs.option("--no-sync-static", {
    alias: "S",
    description: "don't compile static assets",
  }).argv;
  checkoutInteg();
  if (!args["--no-sync-static"]) {
    syncStatic();
  }
  updatePkgJSON();
  installAndPkg();
  const version = getVersion();
  console.log(`build ${version}`);
}

main();
