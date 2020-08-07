const {CONFIG} = require("../out/constants");
const _ = require("lodash");
const fs = require("fs-extra");

function main() {
    const pkg = fs.readJSONSync("package.json");
    const {contributes} = pkg;
    const {configuration} = contributes;
    const configGenerated = {};
    _.forEach(CONFIG, ent => {
        const configProps = _.omit(ent, "key")
        const configKey = ent["key"];
        configGenerated[configKey] = configProps;
    });
    //console.log(configGenerated);
    configuration["properties"] = configGenerated;
    fs.writeJSONSync("package.json", pkg, {spaces: 4});
}


main();