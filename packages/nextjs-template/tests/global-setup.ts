export {};

const path = require("path");
const cli = require("next/dist/cli/next-build");

/**
 * The export globalSetup function will build our application by spawning a new process that runs `npm run build`.
 * This enables our tests to later start one instance of the production build per spec file.
 *
 * The global setup also sets a new PLAYWRIGHT environment variable to true.
 */
async function globalSetup() {
  process.env.PLAYWRIGHT = "1";
  if (process.env.SKIP_BUILD === "1") {
    console.log("skipping build as SKIP_BUILD is set");
  } else {
    console.log(
      "Building application. To skip build, run `npm run test:skipbuild`"
    );
    await cli.nextBuild([path.join(__dirname, "..")]);
  }
}
export default globalSetup;
