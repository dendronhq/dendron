/* eslint-disable no-console */

/**
 * Compiles all code for Dendron Plugin
 */

const execa = require("execa");

const $ = (cmd) => {
  console.log(`$ ${cmd}`);
  return execa.commandSync(cmd, { stdout: process.stdout, buffer: false });
};

const TEST_NEXT_TEMPLATE = process.env.TEST_NEXT_TEMPLATE;

console.log("build all...");
$(`npx lerna run buildCI --scope @dendronhq/common-all`);
$(
  `npx lerna run build --parallel --scope "@dendronhq/{unified,common-server}"`
);
$(`npx lerna run buildCI --scope @dendronhq/dendron-viz `);
$(`npx lerna run buildCI --scope @dendronhq/engine-server `);
$(`npx lerna run buildCI --scope @dendronhq/pods-core `);
if (TEST_NEXT_TEMPLATE) {
  $(
    `npx lerna run buildCI --parallel --scope "@dendronhq/{common-test-utils,api-server,common-assets}"`
  );
} else {
  $(
    `npx lerna run buildCI --parallel --scope "@dendronhq/{common-test-utils,api-server}"`
  );
}
$(
  `npx lerna run buildCI --parallel --scope "@dendronhq/{common-frontend,dendron-cli}"`
);

$(`npx lerna run buildCI --scope "@dendronhq/engine-test-utils"`);

$(`npx lerna run buildCI --scope "@dendronhq/plugin-core"`);

if (TEST_NEXT_TEMPLATE) {
  $(`npx lerna run build --scope "@dendronhq/dendron-plugin-views"`);
  $(`npx yarn dendron dev sync_assets --fast`);
}
console.log("done");
