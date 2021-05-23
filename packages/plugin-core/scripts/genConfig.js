const {
  CONFIG,
  DENDRON_COMMANDS,
  DENDRON_VIEWS,
} = require("../out/src/constants");
const _ = require("lodash");
const fs = require("fs-extra");
const path = require("path");
const { entries } = require("lodash");

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
  const config = genEntry(CONFIG);
  configuration["properties"] = config;
  return config;
}

function updateCommands(contributes) {
  console.log("update commands...");
  const commands = _.map(
    _.filter(DENDRON_COMMANDS, (ent) => _.isUndefined(ent.shortcut)),
    (ent) => {
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
    }
  );
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

function updateViews(contributes) {
  console.log("update views")
  const out = _.groupBy(DENDRON_VIEWS, "where");
  contributes.views = {};
  _.map(out, (views, k) => {
    contributes.views[k] = _.map(views, ent => _.omit(ent, "where"));
  });
}

function main() {
  let dryRun = false;
  const pkg = fs.readJSONSync("package.json");
  const { contributes } = pkg;
  const { configuration } = contributes;
  const config = updateConfig(configuration);
  updateCommands(contributes);
  updateKeybindings(contributes);
  updateViews(contributes);
  const commands = DENDRON_COMMANDS;
  if (dryRun) {
    // console.log(JSON.stringify(pkg, null, 44));
    return;
  }

  // write to docs
  fs.writeJSONSync("package.json", pkg, { spaces: 4 });
  const pathToDocs = path.join("../../../dendron-site");
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
    fs.writeJSONSync(
      path.join(pathToDocs, "data", "generated-config.json"),
      config,
      { spaces: 4 }
    );
  }
}

main();
