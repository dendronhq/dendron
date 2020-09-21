const { CONFIG, DENDRON_COMMANDS } = require("../out/constants");
const _ = require("lodash");
const fs = require("fs-extra");
const path = require("path");

function genEntry(entryDict) {
  const configGenerated = {};
  _.forEach(entryDict, (ent) => {
    const configProps = _.omit(ent, ["key", "scope"]);
    const configKey = ent["key"];
    configGenerated[configKey] = configProps;
  });
  return configGenerated;
}

function updateConfig(configuration) {
  console.log("update config...");
  configuration["properties"] = genEntry(CONFIG);
}

function updateCommands(contributes) {
  console.log("update commands...");
  const commands = _.map(DENDRON_COMMANDS, (ent) => {
    const configProps = _.omit(ent, [
      "key",
      "keybindings",
      "group",
      "skipDocs",
    ]);
    const key = ent["key"];
    return {
      command: key,
      ...configProps,
    };
  });
  contributes.commands = commands;
}

function updateKeybindings(contributes) {
  console.log("update keybindings...");
  const bindings = _.filter(
    DENDRON_COMMANDS,
    (ent) => !_.isEmpty(ent.keybindings)
  ).map((keyEnt) => {
    const configProps = keyEnt.keybindings;
    const key = keyEnt["key"];
    return {
      command: key,
      ...configProps,
    };
  });
  contributes.keybindings = bindings;
}

function main() {
  const pkg = fs.readJSONSync("package.json");
  const { contributes } = pkg;
  const { configuration } = contributes;
  updateConfig(configuration);
  updateCommands(contributes);
  updateKeybindings(contributes);
  const commands = DENDRON_COMMANDS;
  fs.writeJSONSync("package.json", pkg, { spaces: 4 });
  const pathToDocs = path.join("../../build/dendron-template");
  if (fs.existsSync(pathToDocs)) {
    const groupBy = _.groupBy(
      _.values(commands).map((c) => _.defaults(c, { skipDocs: false })),
      "group"
    );
    fs.writeJSONSync(
      path.join(pathToDocs, "data", "dendron-config.json"),
      groupBy,
      { spaces: 4 }
    );
  }
}

main();
