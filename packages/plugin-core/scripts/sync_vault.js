const { execSync, spawnSync } = require("child_process");
const { existsSync, writeFileSync } = require("fs");
const { dirname, join } = require("path");
const { manualSync } = require("mkdirp");
const rimraf = require("rimraf");

const PACKAGE_ROOT = dirname(__dirname);
const BUILD_DIR = join(PACKAGE_ROOT, "build");
const TEMPLATE_DIR = join(BUILD_DIR, "dendron-template");
const TEMPLATE_REPO = "https://github.com/dendronhq/dendron-template.git";
const ASSETS_DIR = join(PACKAGE_ROOT, "assets");
const WS_DIR = join(ASSETS_DIR, "dendronWS");
const COMMIT = join(ASSETS_DIR, "LAST_COMMIT");

{
    let proc;
    if (existsSync(BUILD_DIR)) {
        proc = spawnSync("git", ["pull"], { stdio: 'inherit' });
    } else {
        manualSync(BUILD_DIR);
        proc = spawnSync("git", ["clone", TEMPLATE_REPO], { cwd: BUILD_DIR, stdio: 'inherit' });
    }
}

const lastCommit = execSync("git rev-parse HEAD", { cwd: TEMPLATE_DIR }).toString().trim();
console.log(`sync ${lastCommit}`);

rimraf(WS_DIR, err => {
    if (err) {
        console.error("error removing workspace:", err);
    }

    manualSync(WS_DIR);

    spawnSync("rsync", ["-avq", "--delete", "vault", WS_DIR], { cwd: TEMPLATE_REPO, stdio: 'inherit' });
    writeFileSync(COMMIT, lastCommit);
});
