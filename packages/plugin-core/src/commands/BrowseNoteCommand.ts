import { GitUtils } from "@dendronhq/common-server";
import _ from "lodash";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = vscode.Uri | undefined;

export class BrowseNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.BROWSE_NOTE.key;
  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async execute(_opts: CommandOpts) {
    const editor = vscode.window.activeTextEditor;
    if (vscode.workspace.workspaceFolders && editor) {
      const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      if (!folder) {
        return;
      }
      const root = await GitUtils.getGitRoot(folder.uri.fsPath);
      const file = editor.document.fileName.substring(root.length);
      const startLine = editor.selection.start.line;
      const endLine = editor.selection.end.line;
      const uri = vscode.Uri.parse(
        await GitUtils.getGithubFileUrl(
          folder.uri.fsPath,
          file,
          startLine,
          endLine
        )
      );
      vscode.commands.executeCommand("vscode.open", uri);
      return uri;
    }
    return;
  }
}
