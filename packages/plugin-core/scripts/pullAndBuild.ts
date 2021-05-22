#!/usr/bin/env node

import yargs from "yargs";
import { execa } from "@dendronhq/dendron-cli";

const $ = execa.commandSync;

function checkoutInteg() {
  $(`echo "checkout..."`);
  $(`git reset --hard`);
  $(`git clean -f`);
  $(`git checkout master`);
  $(`git fetch`);
  $(`git branch -D integ-publish`);
  $(`git checkout --track origin/integ-publish`);
}

function main() {
  let args = yargs
    .option("input", {
      alias: "i",
      demand: true,
    })
    .option("year", {
      alias: "y",
      description: "Year number",
      demand: true,
    }).argv;
  console.log(args);
  checkoutInteg();
  console.log("done");
}

main();
