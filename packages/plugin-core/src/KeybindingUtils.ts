import { DendronError, ERROR_STATUS, RespV3 } from "@dendronhq/common-all";
import {
  CommentJSONValue,
  readJSONWithCommentsSync,
} from "@dendronhq/common-server";
import { CommentJSONArray } from "comment-json";
import fs from "fs-extra";
import _, { assign } from "lodash";
import { DENDRON_COMMANDS } from "./constants";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";

type Keybindings = Record<string, string>;

export class KeybindingUtils {
  static checkKeybindingsExist(
    val: CommentJSONValue
  ): val is CommentJSONArray<Keybindings> {
    if (_.isNull(val)) {
      return false;
    }
    return true;
  }

  static getKeybindingConfig = ({
    createIfMissing = false,
  }: {
    createIfMissing: boolean;
  }): RespV3<CommentJSONArray<Keybindings>> => {
    const ctx = "getKeybindingConfig";
    const { keybindingConfigPath } = this.getKeybindingConfigPath();

    if (!fs.existsSync(keybindingConfigPath) && createIfMissing) {
      fs.ensureFileSync(keybindingConfigPath);
      fs.writeFileSync(keybindingConfigPath, "[]");
      Logger.info({ ctx, keybindingConfigPath, msg: "creating keybindings" });
    }

    if (!fs.existsSync(keybindingConfigPath)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: "no keybinding config found",
        }),
      };
    }
    try {
      const keybindings = readJSONWithCommentsSync(keybindingConfigPath);
      if (!KeybindingUtils.checkKeybindingsExist(keybindings)) {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.INVALID_CONFIG,
            message: "keybinding config invalid",
          }),
        };
      }
      return { data: keybindings };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: "keybinding config invalid",
        }),
      };
    }
  };

  static getKeybindingConfigPath = () => {
    const { userConfigDir, osName } = VSCodeUtils.getCodeUserConfigDir();
    return {
      keybindingConfigPath: [userConfigDir, "keybindings.json"].join(""),
      osName,
    };
  };

  static checkAndApplyVimKeybindingOverrideIfExists(): RespV3<{
    keybindingConfigPath: string;
    newKeybindings?: any;
  }> {
    // check where the keyboard shortcut is configured
    const { keybindingConfigPath } = this.getKeybindingConfigPath();

    const resp = this.getKeybindingConfig({ createIfMissing: true });
    if (resp.error) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: "no keybindings found",
        }),
      };
    }
    const keybindings = resp.data;

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
      return { data: { keybindingConfigPath } };
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
    return { data: { keybindingConfigPath, newKeybindings } };
  }

  // static checkAndMigrateLookupKeybindingIfExists(): {
  //   keybindingConfigPath: string;
  //   migratedKeybindings?: any;
  // } {
  //   // check where the keyboard shortcut is configured
  //   const { keybindingConfigPath } = this.getKeybindingConfigPath();

  //   // do nothing if it didn't exist before
  //   if (!fs.existsSync(keybindingConfigPath)) {
  //     return { keybindingConfigPath };
  //   }

  //   const keybindings = readJSONWithCommentsSync(keybindingConfigPath);
  //   if (!KeybindingUtils.keybindingsExist(keybindings)) {
  //     return;
  //   }

  //   let needsMigration = false;
  //   let migratedKeybindings = keybindings.map((entry: any) => {
  //     if (!_.isUndefined(entry.command)) {
  //       const newEntry = assign({}, entry);
  //       if (entry.command === "dendron.lookup") {
  //         needsMigration = true;
  //         newEntry.command = DENDRON_COMMANDS.LOOKUP_NOTE.key;
  //         if (_.isUndefined(entry.args)) {
  //           // keybinding with no override (simple combo change)
  //           // swap out command
  //           return newEntry;
  //         } else {
  //           // keybinding with override. map them to new ones
  //           const newArgs = assign({}, entry.args);
  //           // delete obsolete
  //           _.forEach(
  //             [
  //               "flavor",
  //               "noteExistBehavior",
  //               "filterType",
  //               "value",
  //               "effectType",
  //             ],
  //             (key: string) => {
  //               if (!_.isUndefined(entry.args[key])) {
  //                 delete newArgs[key];
  //               }
  //             }
  //           );

  //           // migrate overrides to new keys
  //           if (!_.isUndefined(entry.args.filterType)) {
  //             newArgs.filterMiddleware = [entry.args.filterType];
  //           }

  //           if (!_.isUndefined(entry.args.value)) {
  //             newArgs.initialValue = entry.args.value;
  //           }

  //           if (!_.isUndefined(entry.args.effectType)) {
  //             if (entry.args.effectType === "multiSelect") {
  //               newArgs.multiSelect = true;
  //             }
  //             if (entry.args.effectType === "copyNoteLink") {
  //               newArgs.copyNoteLink = true;
  //             }
  //           }

  //           newEntry.args = newArgs;
  //           return newEntry;
  //         }
  //       } else if (entry.command === "-dendron.lookup") {
  //         needsMigration = true;
  //         newEntry.command = `-${DENDRON_COMMANDS.LOOKUP_NOTE.key}`;
  //         return newEntry;
  //       }
  //     }
  //     // non-lookup keybinding. return as-is
  //     return entry;
  //   });

  //   if (!needsMigration) return { keybindingConfigPath };

  //   migratedKeybindings = assign(keybindings, migratedKeybindings);
  //   return { keybindingConfigPath, migratedKeybindings };
  // }

  /**
   * For the given pod ID, returns a user-configured shortcut (in VSCode
   * settings) if it exists. Otherwise, returns undefined.
   * @param podId
   * @returns
   */
  static getKeybindingForPodIfExists(podId: string): string | undefined {
    const { keybindingConfigPath } = this.getKeybindingConfigPath();

    if (!fs.existsSync(keybindingConfigPath)) {
      return undefined;
    }

    const keybindings = readJSONWithCommentsSync(keybindingConfigPath);

    if (!KeybindingUtils.checkKeybindingsExist(keybindings)) {
      return undefined;
    }

    const result = keybindings.filter(
      (item) =>
        item.command &&
        item.command === DENDRON_COMMANDS.EXPORT_POD_V2.key &&
        item.args === podId
    );

    if (result.length === 1 && result[0].key) {
      return result[0].key;
    } else if (result.length > 1) {
      throw new DendronError({
        message: KeybindingUtils.MULTIPLE_KEYBINDINGS_MSG_FMT,
      });
    }
    return undefined;
  }

  static MULTIPLE_KEYBINDINGS_MSG_FMT =
    "Multiple keybindings found for pod command shortcut.";
}
