const fs = require("fs-extra");
const execa = require("execa");
const path = require("path");
const {getMetaPath, getProjRoot} = require("./utils");

async function main() {
    const base = path.join(getProjRoot(), "packages");
    const packages = fs.readdirSync(base);
    await Promise.all(packages.map(ent => {
        console.log(ent);
        return execa.commandSync(`yarn link`, {cwd: path.join(base, ent)})
    }));
    console.log("done")
}

main();
