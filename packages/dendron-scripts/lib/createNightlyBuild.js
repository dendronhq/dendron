"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = require("execa");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("./utils");
const os_1 = __importDefault(require("os"));
async function resetAndPull() {
    await execa_1.command("git reset --hard");
    await execa_1.command("git clean -f");
    await execa_1.command("git pull");
}
function getPluginBase() {
    // TODO: tmp
    //return path.join("..", "plugin-core");
    return "/Users/kevinlin/code/dendron/build/dendron/packages/plugin-core";
}
async function main() {
    const PLUGIN_ROOT = getPluginBase();
    // resetAndPull();
    // fs.removeSync("package.json");
    console.log("creating nightly...");
    // console.log("updating pkg...")
    // const pkgPath = path.join(PLUGIN_ROOT, "package.json");
    // await PublishUtils.updatePkgMeta({pkgPath, name: "nightly", description: "nightly build of Dendron"});
    // console.log("installing...")
    // await PublishUtils.installAndPackageDeps({cwd: PLUGIN_ROOT});
    console.log("publishing...");
    const osvxKey = fs_extra_1.default.readFileSync(path_1.default.join(os_1.default.homedir(), ".ovsx"), {
        encoding: "utf-8",
    });
    const out = await utils_1.PublishUtils.publish({ cwd: PLUGIN_ROOT, osvxKey });
    console.log(out);
}
main();
//# sourceMappingURL=createNightlyBuild.js.map