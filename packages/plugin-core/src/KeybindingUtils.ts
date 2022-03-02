import { DendronError, ERROR_STATUS, RespV3 } from "@dendronhq/common-all";
import {
  CommentJSONValue,
  readJSONWithCommentsSync,
} from "@dendronhq/common-server";
import { CommentJSONArray, parse } from "comment-json";
import _md from "markdown-it";
import fs from "fs-extra";
import _, { assign } from "lodash";
import { DENDRON_COMMANDS, KEYBINDING_CONFLICT_EXTENSIONS } from "./constants";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";
import * as vscode from "vscode";

type Keybindings = Record<string, string>;
type KeybindingConflictExtensionInstallStatus = {
  id: string;
  installed: boolean;
};
export class KeybindingUtils {
  static async openDefaultKeybindingFileAndGetJSON(opts: { close?: boolean }) {
    await vscode.commands.executeCommand(
      "workbench.action.openDefaultKeybindingsFile"
    );
    const editor = VSCodeUtils.getActiveTextEditor();
    const defaultKeybindingText = editor?.document.getText();
    if (opts.close) {
      await VSCodeUtils.closeCurrentFileEditor();
    }
    const defaultKeybindingJSON = parse(defaultKeybindingText!);
    console.log({ defaultKeybindingJSON });
    return defaultKeybindingJSON;
  }

  static getKeybindingConflictExtensionInstallStatus() {
    return KEYBINDING_CONFLICT_EXTENSIONS.map((extId) => {
      return { id: extId, installed: VSCodeUtils.isExtensionInstalled(extId) };
    });
  }

  static detectConflictingKeybindings(opts: {
    extId: string;
    keybindings: CommentJSONValue;
  }) {
    const { extId } = opts;
    // const dendronKeybindings = keybindings.filter((keybinding) => {
    //   return keybinding.key.startsWith("dendron.");
    // });
    const keybindings = opts.keybindings as CommentJSONArray<Keybindings>;
    const dendronKeybindings = keybindings.filter((keybinding) => {
      return keybinding.command.startsWith("dendron.");
    });
    const extKeybindings = keybindings.filter((keybindings) => {
      return keybindings.command.startsWith("extension.vim_");
    });

    const extKeybindingsMap = new Map(
      extKeybindings.map((i) => [i.key, { command: i.command, when: i.when }])
    );

    const conflicts: object[] = [];
    dendronKeybindings.forEach((dendronKeybinding) => {
      const key = dendronKeybinding.key;
      // find from extKeybindings that have the same key as a dendron keybinding.
      const maybeConflict = extKeybindingsMap.get(key);
      if (maybeConflict) {
        conflicts.push({
          extId,
          command: maybeConflict.command,
          key,
        });
      }
    });

    console.log({ extId, conflicts });
  }

  static async showKeybindingConflictPreview(opts: {
    installStatus: KeybindingConflictExtensionInstallStatus[];
  }) {
    const md = _md();
    const { installStatus } = opts;
    const defaultKeybindingJSON =
      await KeybindingUtils.openDefaultKeybindingFileAndGetJSON({
        close: true,
      });
    const commandUri = vscode.Uri.parse(
      `command:workbench.action.openGlobalKeybindings`
    );
    KeybindingUtils.detectConflictingKeybindings({
      extId: "vscodevim.vim",
      keybindings: defaultKeybindingJSON,
    });
    const contents = [
      "# Extensions that have keybinding conflicts with Dendron.",
      "",
      "The extensions listed below are known to have default keybindings that conflict with Dendron.",
      "",
      "Neither Dendron nor the extension may function properly if the keybinding conflict exists.",
      "",
      "Consider resolving the keybinding conflicts throught the following methods:",
      "",
      "//todo",
      "",
      `[open keybinding editor](${commandUri})`,
      // installStatus.map((status) => {
      //   const commandUri = vscode.Uri.parse(
      //     `command:toSide:workbench.action.openGlobalKeybindings`
      //   );
      //   const message = status.installed ? `[copy]`
      // }),
    ].join("\n");

    const panel = vscode.window.createWebviewPanel(
      "incompatibleExtensionsPreview",
      "Incompatible Extensions",
      vscode.ViewColumn.One,
      {
        enableCommandUris: true,
      }
    );
    panel.webview.html = md.render(contents);
    // AnalyticsUtils.track(
    //   ExtensionEvents.IncompatibleExtensionsPreviewDisplayed
    // );
    return { installStatus, contents };
  }

  static async showKeybindingConflictConfirmationMessage(opts: {
    installStatus: KeybindingConflictExtensionInstallStatus[];
  }) {
    const message =
      "We noticed some extensions that have known keybinding conflicts with Dendron. Would you like to view a list of keybinding conflicts?";
    const action = "Show Conflicts";
    console.log("foo");
    await vscode.window
      .showWarningMessage(message, action)
      .then(async (resp) => {
        if (resp === action) {
          console.log("bar");
          await this.showKeybindingConflictPreview(opts);
        }
      });
  }

  static async maybePromptKeybindingConflict() {
    // if EXTENSIONS_WITH_KEYBINDING_CONFLICT is installed,
    const installStatus =
      KeybindingUtils.getKeybindingConflictExtensionInstallStatus();
    console.log({ installStatus });
    // if (installStatus.some((status) => status.installed)) {
    await KeybindingUtils.showKeybindingConflictConfirmationMessage({
      installStatus,
    });
    // }
  }

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
