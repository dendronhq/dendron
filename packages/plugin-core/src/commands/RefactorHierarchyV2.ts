import { DNodeUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import { Uri, ViewColumn, window } from "vscode";
import { VaultWatcher } from "../fileWatcher";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { RenameNoteOutputV2a, RenameNoteV2aCommand } from "./RenameNoteV2a";

const md = _md();

type CommandOpts = {
  match: string;
  replace: string;
};

type CommandOutput = any;

type RenameOperation = {
  oldUri: Uri;
  newUri: Uri;
};

export class RefactorHierarchyCommandV2 extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  async gatherInputs(): Promise<CommandOpts | undefined> {
    let match: string | undefined;
    let replace: string | undefined;
    let value: string = "";
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) {
      value = DNodeUtils.uri2Fname(editor.document.uri);
    }
    match = await VSCodeUtils.showInputBox({
      prompt: "Enter match text",
      value,
    });
    if (match) {
      replace = await VSCodeUtils.showInputBox({
        prompt: "Enter replace prefix",
      });
    }
    if (_.isUndefined(replace) || !match) {
      return;
    }
    return {
      match,
      replace,
    };
  }

  async showPreview(operations: RenameOperation[]) {
    const content = [
      "# Refactor Preview",
      "",
      "### The following files will be renamed",
    ]
      .concat(
        operations.map(({ oldUri, newUri }) => {
          return `- ${path.basename(oldUri.fsPath)} --> ${path.basename(
            newUri.fsPath
          )}`;
        })
      )
      .join("\n");
    const panel = window.createWebviewPanel(
      "refactorPreview", // Identifies the type of the webview. Used internally
      "Refactor Preview", // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    );
    panel.webview.html = md.render(content);
  }

  async showError(operations: RenameOperation[]) {
    const content = [
      "# Error - Refactoring would overwrite files",
      "",
      "### The following files woudl be overwritten",
    ]
      .concat(
        operations.map(({ oldUri, newUri }) => {
          return `- ${path.basename(oldUri.fsPath)} --> ${path.basename(
            newUri.fsPath
          )}`;
        })
      )
      .join("\n");
    const panel = window.createWebviewPanel(
      "refactorPreview", // Identifies the type of the webview. Used internally
      "Refactor Preview", // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    );
    panel.webview.html = md.render(content);
  }

  async execute(opts: CommandOpts): Promise<any> {
    const ctx = "RefactorHierarchy:execute";
    const { match, replace } = _.defaults(opts);
    this.L.info({ ctx, opts, msg: "enter" });
    const ws = DendronWorkspace.instance();
    const notes = ws.getEngine().notes;
    const re = new RegExp(`(.*)(${match})(.*)`);
    const candidates = _.map(notes, (n) => {
      if (n.stub) {
        return false;
      }
      return re.exec(n.fname);
    }).filter(Boolean);
    const operations = candidates.map((matchObj) => {
      // @ts-ignore
      let [
        src,
        prefix,
        // @ts-ignore
        _replace,
        suffix,
        // @ts-ignore
        ..._rest
      ] = matchObj as RegExpExecArray;
      const dst = [prefix, replace, suffix]
        .filter((ent) => !_.isEmpty(ent))
        .join("");

      const rootUri = ws.rootWorkspace.uri;
      const oldUri = Uri.joinPath(rootUri, src + ".md");
      const newUri = Uri.joinPath(rootUri, dst + ".md");
      return { oldUri, newUri };
    });
    // NOTE: async version doesn't work, not sure why
    const filesThatExist: RenameOperation[] = _.filter(operations, (op) => {
      return fs.pathExistsSync(op.newUri.fsPath);
    });
    if (!_.isEmpty(filesThatExist)) {
      await this.showError(filesThatExist);
      window.showErrorMessage(
        "refactored files would overwrite existing files"
      );
      return;
    }
    await this.showPreview(operations);
    const options = ["proceed", "cancel"];
    const shouldProceed = await VSCodeUtils.showQuickPick(options, {
      placeHolder: "proceed",
      ignoreFocusOut: true,
    });
    if (shouldProceed !== "proceed") {
      window.showInformationMessage("cancelled");
      return;
    }
    try {
      window.showInformationMessage("refactoring...");
      if (ws.vaultWatcher) {
        ws.vaultWatcher.pause = true;
      }
      const renameCmd = new RenameNoteV2aCommand();
      const out = await _.reduce<
        typeof operations[0],
        Promise<RenameNoteOutputV2a>
      >(
        operations,
        async (resp, op) => {
          let acc = await resp;
          this.L.info({ orig: op.oldUri.fsPath, replace: op.newUri.fsPath });
          const resp2 = await renameCmd.execute({
            files: [op],
            silent: true,
            closeCurrentFile: false,
            openNewFile: false,
            noModifyWatcher: true,
          });
          acc.changed = resp2.changed.concat(acc.changed);
          return acc;
        },
        Promise.resolve({
          changed: [],
        })
      );
      return { changed: _.uniqBy(out.changed, (ent) => ent.note.fname) };
    } finally {
      if (ws.vaultWatcher) {
        setTimeout(() => {
          if (ws.vaultWatcher) {
            ws.vaultWatcher.pause = false;
            VaultWatcher.refreshTree();
          }
          this.L.info({ ctx, msg: "exit" });
        }, 3000);
      }
    }
  }

  async showResponse(res: CommandOutput) {
    window.showInformationMessage("done refactoring");
    const { changed } = res;
    if (changed.length > 0) {
      window.showInformationMessage(`Dendron updated ${changed.length} files`);
    }
  }
}
