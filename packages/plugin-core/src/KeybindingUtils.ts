import { DendronError, ERROR_STATUS, RespV3 } from "@dendronhq/common-all";
import {
  CommentJSONValue,
  readJSONWithCommentsSync,
} from "@dendronhq/common-server";
import { CommentJSONArray, parse } from "comment-json";
import _md from "markdown-it";
import fs from "fs-extra";
import _, { assign } from "lodash";
import {
  DENDRON_COMMANDS,
  isOSType,
  KeybindingConflict,
  KNOWN_KEYBINDING_CONFLICTS,
  KWOWN_CONFLICTING_EXTENSIONS,
} from "./constants";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";
import * as vscode from "vscode";
import os from "os";

type Keybindings = Record<string, string>;
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
    return defaultKeybindingJSON;
  }

  static getConflictingKeybindings() {
    const installStatus = KWOWN_CONFLICTING_EXTENSIONS.map((extId) => {
      return {
        id: extId,
        installed: VSCodeUtils.isExtensionInstalled(extId),
      };
    });

    const installed = installStatus
      .filter((status) => status.installed)
      .map((status) => status.id);

    const conflicts = KNOWN_KEYBINDING_CONFLICTS.filter((conflict) => {
      const isInstalled = installed.includes(conflict.extensionId);
      const osType = os.type();
      const conflictOSType = conflict.os || ["Darwin", "Linux", "Windows_NT"];
      const matchesOS = isOSType(osType) && conflictOSType.includes(osType);
      return isInstalled && matchesOS;
    });

    // for each of the found conflicts, see if the user has them remapped in keybinding.json
    const { keybindingConfigPath } = this.getKeybindingConfigPath();
    const userKeybindingConfigExists = fs.existsSync(keybindingConfigPath);

    // all conflicts are valid
    if (!userKeybindingConfigExists) {
      return conflicts;
    }

    const userKeybindingConfig = readJSONWithCommentsSync(keybindingConfigPath);

    // TODO: check for existing user keybinding items
    return conflicts;
  }

  static generateKeybindingBlockForCopy(opts: {
    entry: Keybindings;
    disable?: boolean;
  }) {
    const { entry, disable } = opts;
    const whenClause = entry.when ? `  "when": "${entry.when}",` : undefined;

    const args = entry.args
      ? `  "args": ${JSON.stringify(entry.args)},`
      : undefined;

    const block = [
      "{",
      `  "key": "${disable ? entry.key : ""}",`,
      `  "command": "${disable ? "-" : ""}${entry.command}",`,
      whenClause,
      args,
      "}",
      "",
    ]
      .filter((line) => line !== undefined)
      .join("\n");
    return block;
  }

  static async showKeybindingConflictPreview(opts: {
    conflicts: KeybindingConflict[];
  }) {
    const md = _md();
    const { conflicts } = opts;
    const defaultKeybindingJSON =
      (await KeybindingUtils.openDefaultKeybindingFileAndGetJSON({
        close: false,
      })) as CommentJSONArray<Keybindings>;
    const keybindingJSONCommandUri = `command:workbench.action.openGlobalKeybindingsFile`;
    const contents = [
      "# Known Keybinding Conflicts",
      "",
      "The keybindings listed below are known to have conflicts with default keybindings for Dendron commands.",
      "",
      "Neither Dendron nor the extension may function properly if the keybinding conflict is not resolved.",
      "",
      "Consider resolving the keybinding conflicts throught the following methods:",
      "",
      "#### 1. Disable conflicting keybindings",
      "If you don't use the listed keybinding, consider disabling it.",
      "",
      `1. Open [keybinding.json](${keybindingJSONCommandUri})`,
      `1. Click on the link "Disable Conflicting Keybinding" in each conflicting keybinding listed below. This will copy the necessary keybinding entry to your clipboard.`,
      `1. Paste the clipboard content to \`keybinding.json\``,
      "",
      "#### 2. Remap conflicting keybindings",
      "If you need to preserve the keybinding that is conflicting, consider remapping either of the conflicting keybindings.",
      `1. Open [keybinding.json](${keybindingJSONCommandUri})`,
      `1. Click on the link "Remap Dendron Keybinding" or "Remap Conflicting Keybinding" in each conflicting keybinding listed below. This will copy the necessary keybinding entry to your clipboard.`,
      `1. Paste the clipboard content to \`keybinding.json\``,
      `1. Set the value of "key" to the desired key combination.`,
      "",
      "For more information on how to set keyboard rules in VSCode, visit [Keyboard Rules](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-rules)",
      "",
      "The exhaustive list of default keybindings is opened in the `Default Keybindings` tab for reference.",
      "",
      "***",
      "## List of Keybinding Conflicts",
      conflicts
        .map((conflict) => {
          const conflictKeybindingEntry = defaultKeybindingJSON.find(
            (keybinding) => {
              return keybinding.command === conflict.commandId;
            }
          );
          const dendronKeybindingEntry = defaultKeybindingJSON.find(
            (keybinding) => {
              return keybinding.command === conflict.conflictsWith;
            }
          );
          if (conflictKeybindingEntry === undefined) {
            return undefined;
          }
          if (dendronKeybindingEntry === undefined) {
            return undefined;
          }

          const disableBlock = KeybindingUtils.generateKeybindingBlockForCopy({
            entry: conflictKeybindingEntry,
            disable: true,
          });

          const remapDendronBlock =
            KeybindingUtils.generateKeybindingBlockForCopy({
              entry: dendronKeybindingEntry,
              disable: false,
            });

          const remapConflictBlock =
            KeybindingUtils.generateKeybindingBlockForCopy({
              entry: conflictKeybindingEntry,
              disable: false,
            });

          const copyCommandUri = (args: { text: string }) =>
            `command:dendron.copyToClipboard?${encodeURIComponent(
              JSON.stringify(args)
            )}`;

          const out = [
            `### \`${conflict.commandId}\``,
            `- key: \`${conflictKeybindingEntry.key}\``,
            `- from: \`${conflict.extensionId}\``,
            `- conflicts with: \`${conflict.conflictsWith}\``,
            "",
            `[Disable ${conflict.commandId}](${copyCommandUri({
              text: disableBlock,
            })})`,
            "",
            `[Remap ${conflict.commandId}](${copyCommandUri({
              text: remapConflictBlock,
            })})`,
            "",
            `[Remap ${conflict.conflictsWith}](${copyCommandUri({
              text: remapDendronBlock,
            })})`,
          ].join("\n");

          return out;
        })
        .filter((line) => line !== undefined)
        .join("\n"),
    ].join("\n");

    const panel = vscode.window.createWebviewPanel(
      "keybindingConflictPreview",
      "Keybinding Conflicts",
      vscode.ViewColumn.One,
      {
        enableCommandUris: true,
      }
    );
    panel.webview.html = md.render(contents);
    // AnalyticsUtils.track(
    //   ExtensionEvents.IncompatibleExtensionsPreviewDisplayed
    // );
    // return { installStatus, contents };
  }

  static async showKeybindingConflictConfirmationMessage(opts: {
    conflicts: KeybindingConflict[];
  }) {
    const message =
      "We noticed some extensions that have known keybinding conflicts with Dendron. Would you like to view a list of keybinding conflicts?";
    const action = "Show Conflicts";
    await vscode.window
      .showWarningMessage(message, action)
      .then(async (resp) => {
        if (resp === action) {
          await this.showKeybindingConflictPreview(opts);
        }
      });
  }

  static async maybePromptKeybindingConflict() {
    const conflicts = KeybindingUtils.getConflictingKeybindings();
    if (conflicts.length > 0) {
      await KeybindingUtils.showKeybindingConflictConfirmationMessage({
        conflicts,
      });
    }
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
