import { DendronError, ERROR_SEVERITY } from "@dendronhq/common-all";
import {
  CommentJSONValue,
  readJSONWithCommentsSync,
} from "@dendronhq/common-server";
import { CommentJSONArray, parse } from "comment-json";
import _md from "markdown-it";
import fs from "fs-extra";
import _ from "lodash";
import {
  DENDRON_COMMANDS,
  isOSType,
  KeybindingConflict,
  KNOWN_KEYBINDING_CONFLICTS,
  KNOWN_CONFLICTING_EXTENSIONS,
} from "./constants";
import { VSCodeUtils } from "./vsCodeUtils";
import * as vscode from "vscode";
import os from "os";
import path from "path";

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
    const defaultKeybindingJSON = defaultKeybindingText
      ? (parse(defaultKeybindingText) as CommentJSONArray<Keybindings>)
      : undefined;

    return defaultKeybindingJSON;
  }

  static async openGlobalKeybindingFileAndGetJSON(opts: { close?: boolean }) {
    await vscode.commands.executeCommand(
      "workbench.action.openGlobalKeybindingsFile"
    );
    const editor = VSCodeUtils.getActiveTextEditor();
    const globalKeybindingText = editor?.document.getText();
    if (opts.close) {
      await VSCodeUtils.closeCurrentFileEditor();
    }
    const globalKeybindingJSON = globalKeybindingText
      ? (parse(globalKeybindingText) as CommentJSONArray<Keybindings>)
      : undefined;

    return globalKeybindingJSON;
  }

  static getInstallStatusForKnownConflictingExtensions() {
    return KNOWN_CONFLICTING_EXTENSIONS.map((extId) => {
      return {
        id: extId,
        installed: VSCodeUtils.isExtensionInstalled(extId),
      };
    });
  }

  static getConflictingKeybindings(opts: {
    knownConflicts: KeybindingConflict[];
  }) {
    const { knownConflicts } = opts;
    const installStatus =
      KeybindingUtils.getInstallStatusForKnownConflictingExtensions();
    const installed = installStatus
      .filter((status) => status.installed)
      .map((status) => status.id);

    const conflicts = knownConflicts.filter((conflict) => {
      const isInstalled = installed.includes(conflict.extensionId);
      const osType = os.type();
      const conflictOSType = conflict.os || ["Darwin", "Linux", "Windows_NT"];
      const matchesOS = isOSType(osType) && conflictOSType.includes(osType);
      return isInstalled && matchesOS;
    });

    // for each of the found conflicts, see if the user has them remapped / disabled  in keybinding.json
    const { keybindingConfigPath } = this.getKeybindingConfigPath();
    const userKeybindingConfigExists = fs.existsSync(keybindingConfigPath);

    // all conflicts are valid
    if (!userKeybindingConfigExists) {
      return conflicts;
    }

    const userKeybindingConfig = readJSONWithCommentsSync(
      keybindingConfigPath
    ) as CommentJSONArray<Keybindings>;

    const alreadyResolved: KeybindingConflict[] = [];

    userKeybindingConfig.forEach((keybinding) => {
      // find remap / disable of conflicting keybindings
      let command = keybinding.command;
      if (command.startsWith("-")) {
        command = command.substring(1);
      }

      const resolvedConflict = conflicts.find(
        (conflict) => conflict.commandId === command
      );
      if (resolvedConflict) {
        alreadyResolved.push(resolvedConflict);
      }

      // find remap / disable of dendron keybindings
      command = keybinding.command;
      if (command.startsWith("-")) {
        command = command.substring(1);
      }
      const resolvedDendronConflict = conflicts.find(
        (conflict) => conflict.conflictsWith === command
      );

      if (resolvedDendronConflict) {
        alreadyResolved.push(resolvedDendronConflict);
      }
    });

    return _.differenceBy(conflicts, alreadyResolved);
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
      await KeybindingUtils.openDefaultKeybindingFileAndGetJSON({
        close: false,
      });
    if (defaultKeybindingJSON === undefined) {
      throw new DendronError({
        message: "Failed reading default keybinding.",
        severity: ERROR_SEVERITY.MINOR,
      });
    }
    await KeybindingUtils.openGlobalKeybindingFileAndGetJSON({
      close: false,
    });
    const keybindingJSONCommandUri = `command:workbench.action.openGlobalKeybindingsFile`;
    const defaultKeybindingJSONCommandUri = `command:workbench.action.openDefaultKeybindingsFile`;
    const contents = [
      "# Known Keybinding Conflicts",
      "",
      "The keybindings listed at the bottom are known to have conflicts with default keybindings for Dendron commands.",
      "",
      "Neither Dendron nor the extension may function properly if the keybinding conflict is not resolved.",
      "",
      "Consider resolving the keybinding conflicts throught the following methods:",
      "",
      "#### 1. Disable conflicting keybindings",
      "If you don't use the listed keybinding, consider disabling it.",
      "",
      `1. Click on the link \`Disable\` next to each conflicting keybinding listed below.`,
      `    - This will copy the necessary keybinding entry to your clipboard.`,
      `1. Open [keybindings.json](${keybindingJSONCommandUri})`,
      `1. Paste the clipboard content to \`keybindings.json\``,
      "",
      "#### 2. Remap conflicting keybindings",
      "If you need to preserve the keybinding that is conflicting, consider remapping either of the conflicting keybindings.",
      `1. Click on the link \`Remap\` next to each conflicting keybinding listed below.`,
      `    - This will copy the necessary keybinding entry to your clipboard.`,
      `1. Open [keybindings.json](${keybindingJSONCommandUri})`,
      `1. Paste the clipboard content to \`keybindings.json\``,
      `1. Set the value of "key" to the desired key combination.`,
      "",
      "For more information on how to set keyboard rules in VSCode, visit [Keyboard Rules](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-rules)",
      "",
      `Use [Default Keybindings](${defaultKeybindingJSONCommandUri}) to reference all default keybindings.`,
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
            `- command: \`${conflict.commandId}\` [Disable](${copyCommandUri({
              text: disableBlock,
            })}) / [Remap](${copyCommandUri({ text: remapConflictBlock })})`,
            `- from: \`${conflict.extensionId}\``,
            `- conflicts with: \`${
              conflict.conflictsWith
            }\` [Remap](${copyCommandUri({ text: remapDendronBlock })})`,
            "",
          ].join("\n");

          return out;
        })
        .filter((line) => line !== undefined)
        .join("\n"),
    ].join("\n");

    const panel = vscode.window.createWebviewPanel(
      "keybindingConflictPreview",
      "Keybinding Conflicts",
      vscode.ViewColumn.Beside,
      {
        enableCommandUris: true,
      }
    );
    panel.webview.html = md.render(contents);
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
    const conflicts = KeybindingUtils.getConflictingKeybindings({
      knownConflicts: KNOWN_KEYBINDING_CONFLICTS,
    });
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

  /**
   * This returns the path of user-level `keybindings.json`.
   * This handles windows, linux and darwin, for both regular vscode and insider as well as portable mode.
   * This does NOT handle the case where vscode is opened through cli with a custom `--user-data-dir` argument.
   *
   * The most reliable way of accessing the path of `keybindings.json` is to execute `workbench.action.openGlobalKeybindingsFile`
   * and fetching the uri of the active editor document, but this requires opening and closing an editor tab in quick succession.
   * This will visually be very unpleasant, thus avoided here.
   *
   * @returns path of user defined `keybindings.json`, and the platform.
   */
  static getKeybindingConfigPath = () => {
    const { userConfigDir, osName } = VSCodeUtils.getCodeUserConfigDir();
    return {
      keybindingConfigPath: path.join(userConfigDir, "keybindings.json"),
      osName,
    };
  };

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
