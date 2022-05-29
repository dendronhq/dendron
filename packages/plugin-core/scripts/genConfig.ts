/* eslint-disable no-console */
import fs from "fs-extra";
import _ from "lodash";
import {
  CONFIG,
  DendronContext,
  DENDRON_COMMANDS,
  DENDRON_MENUS,
  DENDRON_VIEWS,
  DENDRON_VIEWS_CONTAINERS,
  DENDRON_VIEWS_WELCOME,
} from "../src/constants";

function genEntry(entryDict: any) {
  const configGenerated: any = {};
  _.forEach(entryDict, (ent) => {
    const configProps = _.omit(ent, ["key", "scope"]);
    const configKey = ent["key"];
    configGenerated[configKey] = configProps;
  });
  return configGenerated;
}

function updateConfig() {
  const configuration = {
    title: "dendron",
  } as any;
  console.log("update config...");
  const config = genEntry(CONFIG);
  configuration["properties"] = config;
  return configuration;
}

function updateMenus() {
  console.log("update menus...");
  DENDRON_MENUS["commandPalette"] = updateCommandPalettes();
  return DENDRON_MENUS;
}

function updateCommandPalettes() {
  console.log("updating command palettes...");
  const commandPalette = _.map(
    _.filter(DENDRON_COMMANDS, (ent) => {
      return !_.isUndefined(ent.when);
    }),
    (ent) => {
      const key = ent["key"];
      const when = ent["when"];
      return {
        command: key,
        when,
      };
    }
  );
  return commandPalette;
}

function updateCommands() {
  console.log("update commands...");
  const commands = _.map(_.filter(DENDRON_COMMANDS), (ent) => {
    const configProps = _.omit(ent, ["key", "keybindings", "when"]);
    const key = ent["key"];
    return {
      command: key,
      ...configProps,
    };
  });
  return commands;
}

function updateKeybindings() {
  console.log("update keybindings...");
  const bindings = _.filter(
    DENDRON_COMMANDS,
    (ent) => !_.isEmpty(ent.keybindings)
  ).map((keyEnt) => {
    let configProps = keyEnt.keybindings;
    const key = keyEnt["key"];

    // sanity, if command depends on plugin being active, add same when clause to keybinding
    if (
      keyEnt.when === DendronContext.PLUGIN_ACTIVE &&
      !configProps?.when?.includes(DendronContext.PLUGIN_ACTIVE)
    ) {
      const when = configProps?.when
        ? configProps.when + ` && ${DendronContext.PLUGIN_ACTIVE}`
        : DendronContext.PLUGIN_ACTIVE;
      configProps = { ...configProps, when };
    }
    return {
      command: key,
      ...configProps,
    };
  });
  return bindings;
}

function updateViews() {
  console.log("update views");
  const out = _.groupBy(DENDRON_VIEWS, "where");
  const viewJson = {} as any;
  _.map(out, (views, k) => {
    viewJson[k] = _.map(views, (ent) => _.omit(ent, "where"));
  });
  return viewJson;
}

function main() {
  const dryRun = false;
  const pkg = fs.readJSONSync("package.json");
  const configuration = updateConfig();
  const commands = updateCommands();
  const menus = updateMenus();
  const keybindings = updateKeybindings();
  const viewsWelcome = DENDRON_VIEWS_WELCOME;
  const viewsContainers = DENDRON_VIEWS_CONTAINERS;
  const views = updateViews();
  const languages = [
    {
      id: "markdown",
      extensions: [".md"],
      aliases: ["markdown"],
      configuration: "./language-configuration.json",
    },
  ];
  const previewStyles = [
    "./media/fontello/css/fontello.css",
    "./media/markdown.css",
  ];
  const yamlValidation = [
    {
      fileMatch: "dendron.yml",
      url: "./dist/dendron-yml.validator.json",
    },
  ];
  const categories = ["Other"];
  const contributes = {
    languages,
    viewsWelcome,
    viewsContainers,
    views,
    categories,
    commands,
    menus,
    configuration,
    keybindings,
    "markdown.previewStyles": previewStyles,
    yamlValidation,
  };
  if (dryRun) {
    // console.log(JSON.stringify(pkg, null, 44));
    return;
  }
  pkg.contributes = contributes;

  // write to docs
  fs.writeJSONSync("package.json", pkg, { spaces: 2 });
}

main();
