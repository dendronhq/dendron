import { readJSONWithCommentsSync } from "@dendronhq/common-server";
import fs from "fs-extra";
import _, { assign } from "lodash";
import { DENDRON_COMMANDS } from "./constants";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";

export class KeybindingUtils {
  static getKeybindingConfigPath = () => {
    const { userConfigDir, osName } = VSCodeUtils.getCodeUserConfigDir();
    return {
      keybindingConfigPath: [userConfigDir, "keybindings.json"].join(""),
      osName,
    };
  };

  static checkAndApplyVimKeybindingOverrideIfExists(): {
    keybindingConfigPath: string;
    newKeybindings?: any;
  } {
    const ctx = "checkAndApplyVimKeybindingOverrideIfExists";
    // check where the keyboard shortcut is configured
    const { keybindingConfigPath } = this.getKeybindingConfigPath();
    Logger.info({ ctx, keybindingConfigPath });

    // read keybindings.json
    // create if it doesn't exist
    if (!fs.existsSync(keybindingConfigPath)) {
      fs.ensureFileSync(keybindingConfigPath);
      fs.writeFileSync(keybindingConfigPath, "[]");
      Logger.info({ ctx, keybindingConfigPath, msg: "creating keybindings" });
    }
    const keybindings = readJSONWithCommentsSync(keybindingConfigPath);

    // check if override is already there
    const alreadyHasOverride =
      keybindings.filter((entry: any) => {
        if (!_.isUndefined(entry.command)) {
          return entry.command === "-extension.vim_navigateCtrlL";
        } else {
          return false;
        }
      }).length > 0;

    if (alreadyHasOverride) {
      return { keybindingConfigPath };
    }

    // add override if there isn't.
    const OVERRIDE_EXPAND_LINE_SELECTION = {
      key: `ctrl+l`,
      command: "-extension.vim_navigateCtrlL",
    };

    const newKeybindings = assign(
      keybindings,
      keybindings.concat(OVERRIDE_EXPAND_LINE_SELECTION)
    );
    return { keybindingConfigPath, newKeybindings };
  }

  static checkAndMigrateLookupKeybindingIfExists(): {
    keybindingConfigPath: string;
    migratedKeybindings?: any;
  } {
    // check where the keyboard shortcut is configured
    const { keybindingConfigPath } = this.getKeybindingConfigPath();

    // do nothing if it didn't exist before
    if (!fs.existsSync(keybindingConfigPath)) {
      return { keybindingConfigPath };
    }

    const keybindings = readJSONWithCommentsSync(keybindingConfigPath);

    let needsMigration = false;
    let migratedKeybindings = keybindings.map((entry: any) => {
      if (!_.isUndefined(entry.command)) {
        const newEntry = assign({}, entry);
        if (entry.command === "dendron.lookup") {
          needsMigration = true;
          newEntry.command = DENDRON_COMMANDS.LOOKUP_NOTE.key;
          if (_.isUndefined(entry.args)) {
            // keybinding with no override (simple combo change)
            // swap out command
            return newEntry;
          } else {
            // keybinding with override. map them to new ones
            const newArgs = assign({}, entry.args);
            // delete obsolete
            _.forEach(
              [
                "flavor",
                "noteExistBehavior",
                "filterType",
                "value",
                "effectType",
              ],
              (key: string) => {
                if (!_.isUndefined(entry.args[key])) {
                  delete newArgs[key];
                }
              }
            );

            // migrate overrides to new keys
            if (!_.isUndefined(entry.args.filterType)) {
              newArgs.filterMiddleware = [entry.args.filterType];
            }

            if (!_.isUndefined(entry.args.value)) {
              newArgs.initialValue = entry.args.value;
            }

            if (!_.isUndefined(entry.args.effectType)) {
              if (entry.args.effectType === "multiSelect") {
                newArgs.multiSelect = true;
              }
              if (entry.args.effectType === "copyNoteLink") {
                newArgs.copyNoteLink = true;
              }
            }

            newEntry.args = newArgs;
            return newEntry;
          }
        } else if (entry.command === "-dendron.lookup") {
          needsMigration = true;
          newEntry.command = `-${DENDRON_COMMANDS.LOOKUP_NOTE.key}`;
          return newEntry;
        }
      }
      // non-lookup keybinding. return as-is
      return entry;
    });

    if (!needsMigration) return { keybindingConfigPath };

    migratedKeybindings = assign(keybindings, migratedKeybindings);
    return { keybindingConfigPath, migratedKeybindings };
  }
}
