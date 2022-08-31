import { GitUtils } from "@dendronhq/common-server";
import _ from "lodash";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { clipboard } from "../utils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string | undefined;

export class CopyCodespaceURL extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.COPY_CODESPACE_URL.key;
  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }
  async showFeedback(link: string) {
    const uri = vscode.Uri.parse(link);
    vscode.window
      .showInformationMessage(`${link} copied`, ...["Open Codespace"])
      .then((resp) => {
        if (resp === "Open Codespace") {
          vscode.commands.executeCommand("vscode.open", uri);
        }
      });
  }

  async execute(_opts: CommandOpts) {
    const editor = vscode.window.activeTextEditor;

    if (vscode.workspace.workspaceFolders && editor) {
      const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);

      if (!folder) {
        return;
      }

      const root = (await GitUtils.getGitRoot(folder.uri.fsPath)) || "";
      // get just the file
      const file = editor.document.fileName.substring(root.length);
      const link = await GitUtils.getCodeSpacesURL(
        folder.uri.fsPath,
        file.replace(/\\/g, "/")
      );
      this.showFeedback(link);
      clipboard.writeText(link);
      return link;
    }
    return;
  }
}
