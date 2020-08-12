import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import { Uri, ViewColumn, window } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { RenameNoteOutput, RenameNoteV2Command } from "./RenameNoteV2";
import { DNodeUtils } from "@dendronhq/common-all";

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

export class RefactorHierarchyCommand extends BasicCommand<
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

  async execute(opts: CommandOpts): Promise<any> {
    const { match, replace } = _.defaults(opts);
    this.L.info(opts);
    const ws = DendronWorkspace.instance();
    const notes = ws.engine.notes;
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
    window.showInformationMessage("refactoring...");
    const renameCmd = new RenameNoteV2Command();
    const out = await _.reduce<typeof operations[0], Promise<RenameNoteOutput>>(
      operations,
      async (resp, op) => {
        const acc = await resp;
        this.L.info({ orig: op.oldUri.fsPath, replace: op.newUri.fsPath });
        const resp2 = await renameCmd.execute({ files: [op], silent: true });
        acc.refsUpdated += resp2.refsUpdated;
        acc.pathsUpdated = acc.pathsUpdated.concat(resp2.pathsUpdated);
        return acc;
      },
      Promise.resolve({
        refsUpdated: 0,
        pathsUpdated: [],
      })
    );
    return {
      refsUpdated: out.refsUpdated,
      pathsUpdated: _.sortedUniq(_.sortBy(out.pathsUpdated)),
    };
  }

  async showResponse(res: CommandOutput) {
    const { pathsUpdated, refsUpdated } = res;
    window.showInformationMessage("done refactoring");
    if (pathsUpdated.length > 0) {
      window.showInformationMessage(
        `Dendron updated ${refsUpdated} link${
          refsUpdated === 0 || refsUpdated === 1 ? "" : "s"
        } in ${pathsUpdated.length} file${
          pathsUpdated.length === 0 || pathsUpdated.length === 1 ? "" : "s"
        }`
      );
    }
  }
}
