const execa = require("execa");
const path = require("path");
const fs = require("fs-extra");
const _ = require("lodash");
const { getMetaPath } = require("../scripts/utils");

DENDRON_BASE = "../dendron"

const ALL_DEPENDENCIES = {
    "@dendronhq/worker-build-site": ["dendron-cli", "dendron-11ty", "engine-server", "common-server"],
    "@dendronhq/integ-utils": ["common-server"]
}

function getPackagesDirPath() {
    return path.join("..", "dendron-backend", "packages");
}

async function main() {
    console.log("updating...")
    const packagesDirContents = fs.readdirSync(getPackagesDirPath());
    packagesDirContents.map(pkg => {
        console.log(`updating ${pkg}`)
        const dependencies = ALL_DEPENDENCIES[pkg];
        const meta = fs.readJSONSync(getMetaPath());
        const pkgPath = path.join("..", "dendron-backend", "packages", pkg, "package.json");
        const pkgJson = fs.readJSONSync(pkgPath);
        _.map(pkgJson.dependencies, (v, k) => {
            if (_.has(meta, k)) {
                console.log(`update ${k}`)
                pkgJson.dependencies[k] = meta[k];
            }
        });
        fs.writeJSONSync(pkgPath, pkgJson, { spaces: 2 });

    })
    // const resp = execa.commandSync(, {

    // }).catch(err => {
    //     console.log(err);
    //     console.log("error");
    // });
    // console.log(resp)
    // console.log("done");
}

main();