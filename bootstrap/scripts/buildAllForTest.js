/* eslint-disable no-console */

/**
 * Compiles all code for Dendron Plugin
 */

const execa = require("execa");

const $ = (cmd) => {
  console.log(`$ ${cmd}`);
  return execa.commandSync(cmd, { stdout: process.stdout, buffer: false });
};

console.log("build all...");
$(`npx lerna run buildCI --scope @dendronhq/common-all`);
$(`npx lerna run buildCI --scope @dendronhq/common-server `);
$(`npx lerna run buildCI --scope @dendronhq/engine-server `);
$(`npx lerna run buildCI --scope @dendronhq/pods-core `);
$(
  `npx lerna run buildCI --parallel --scope "@dendronhq/{common-test-utils,api-server,common-assets}"`
);
$(
  `npx lerna run buildCI --parallel --scope "@dendronhq/{common-frontend,dendron-cli}"`
);
$(`npx lerna run buildCI --scope "@dendronhq/engine-test-utils" `);
$(`npx lerna run buildCI --scope "@dendronhq/plugin-core"`);
console.log("done");
