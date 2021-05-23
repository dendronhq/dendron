import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Selection, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { clipboard, VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";

type CommandInput = {
  filePath: string;
};

type CommandOpts = CommandInput;

type CommandOutput = { error?: DendronError };

export class PasteFileCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.PASTE_FILE.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    const maybeFilePath = await clipboard.readText();
    if (!_.isUndefined(maybeFilePath) && fs.existsSync(maybeFilePath)) {
      return { filePath: maybeFilePath };
    }

    // if not in clipboard, prompt for file
    let out = await VSCodeUtils.showInputBox({
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
    const ws = getWS();
    if (!ws.workspaceService?.isPathInWorkspace(uri.fsPath)) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "not in a vault",
      });
      Logger.error({ error });
      return { error };
    }

    const vault = ws.workspaceService.getVaultForPath(uri.fsPath);
    const vpath = vault2Path({ vault, wsRoot: DendronWorkspace.wsRoot() });
    const suffix = path.join("assets", path.basename(filePath));
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
    return {};
  }
}
