const { CONFIG, DENDRON_COMMANDS } = require("../out/constants");
const _ = require("lodash");
const fs = require("fs-extra");

function genEntry(entryDict) {
  const configGenerated = {};
  _.forEach(entryDict, (ent) => {
    const configProps = _.omit(ent, "key");
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
    const configProps = _.omit(ent, ["key", "keybindings"]);
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
  const bindings = _.filter(DENDRON_COMMANDS, (ent) => !_.isEmpty(ent.keybindings)).map(
    (keyEnt) => {
      const configProps = keyEnt.keybindings;
      const key = keyEnt["key"];
      return {
        command: key,
        ...configProps,
      };
    }
  );
  contributes.keybindings = bindings;
}

function main() {
  const pkg = fs.readJSONSync("package.json");
  const { contributes } = pkg;
  const { configuration } = contributes;
  updateConfig(configuration);
  updateCommands(contributes);
  updateKeybindings(contributes);
  fs.writeJSONSync("package.json", pkg, { spaces: 4 });
}

main();
