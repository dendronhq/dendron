import { DendronError, ERROR_STATUS, VaultUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Selection, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { clipboard } from "../utils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandInput = {
  filePath: string;
};

type CommandOpts = CommandInput;

/**
 * fpath: full path to copied file
 */
type CommandOutput = { error?: DendronError; fpath?: string };

const cleanFname = (basename: string) => {
  const { name, ext } = path.parse(basename);
  return _.kebabCase(name) + ext;
};

export class PasteFileCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.PASTE_FILE.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    const maybeFilePath = await clipboard.readText();
    if (!_.isUndefined(maybeFilePath) && fs.existsSync(maybeFilePath)) {
      return { filePath: maybeFilePath };
    }

    // if not in clipboard, prompt for file
    const out = await VSCodeUtils.showInputBox({
      prompt: "Path of file",
      placeHolder: "",
    });
    if (PickerUtilsV2.isInputEmpty(out)) return;
    return { filePath: out };
  }

  async execute(opts: CommandOpts) {
    const { filePath } = opts;

    const editor = VSCodeUtils.getActiveTextEditor();
    if (!editor) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "no active editor",
      });
      Logger.error({ error });
      return { error };
    }

    const uri = editor.document.uri;
    const ext = ExtensionProvider.getExtension();
    const ws = ext.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    if (
      !WorkspaceUtils.isPathInWorkspace({ vaults, wsRoot, fpath: uri.fsPath })
    ) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "not in a vault",
      });
      Logger.error({ error });
      return { error };
    }
    const vault = VaultUtils.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath: uri.fsPath,
    });
    const vpath = vault2Path({ vault, wsRoot });
    const suffix = path.join("assets", cleanFname(path.basename(filePath)));
    const dstPath = path.join(vpath, suffix);

    if (!fs.existsSync(filePath)) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `${filePath} does not exist`,
      });
      Logger.error({ error });
      return { error };
    }

    if (fs.existsSync(dstPath)) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `${dstPath} already exists`,
      });
      Logger.error({ error });
      return { error };
    }

    fs.ensureDirSync(path.dirname(dstPath));
    fs.copyFileSync(filePath, dstPath);
    window.showInformationMessage(`${filePath} moved to ${dstPath}`);

    const pos = editor.selection.active;
    await editor.edit((builder) => {
      const txt = `[${path.basename(dstPath)}](${suffix})`;
      const selection = new Selection(pos, pos);
      builder.replace(selection, txt);
    });
    return {
      fpath: dstPath,
    };
  }
}
