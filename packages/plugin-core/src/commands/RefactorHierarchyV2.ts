import {
  DEngineClient,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DVault,
  NoteUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import _md from "markdown-it";
import { HistoryEvent, LinkUtils } from "@dendronhq/engine-server";
import path from "path";
import { ProgressLocation, Uri, ViewColumn, window } from "vscode";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3Interface";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { DENDRON_COMMANDS } from "../constants";
import { FileWatcher } from "../fileWatcher";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtils } from "../WSUtils";
import { getExtension, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { RenameNoteOutputV2a, RenameNoteV2aCommand } from "./RenameNoteV2a";
import {
  MultiSelectBtn,
  Selection2ItemsBtn,
} from "../components/lookup/buttons";
import { ExtensionProvider } from "../ExtensionProvider";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";

const md = _md();

type CommandOpts = {
  scope?: NoteLookupProviderSuccessResp;
  match: string;
  replace: string;
  noConfirm?: boolean;
};

type CommandOutput = any;

type RenameOperation = {
  vault: DVault;
  oldUri: Uri;
  newUri: Uri;
};

export class RefactorHierarchyCommandV2 extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.REFACTOR_HIERARCHY.key;

  entireWorkspaceQuickPickItem = {
    label: "Entire Workspace",
    detail: "Scope refactor to entire workspace",
    alwaysShow: true,
  } as DNodePropsQuickInputV2;

  async promptScope(): Promise<NoteLookupProviderSuccessResp | undefined> {
    // see if we have a selection that contains wikilinks
    const { text } = VSCodeUtils.getSelection();
    const wikiLinks = text ? LinkUtils.extractWikiLinks(text) : [];
    const shouldUseSelection = wikiLinks.length > 0;

    // if we have a selection w/ wikilinks, selection2Items
    if (!shouldUseSelection) {
      return {
        selectedItems: [this.entireWorkspaceQuickPickItem],
        onAcceptHookResp: [],
      };
    }

    const lcOpts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: true,
      vaultSelectCanToggle: false,
      extraButtons: [
        Selection2ItemsBtn.create({ pressed: true, canToggle: false }),
        MultiSelectBtn.create({ pressed: true, canToggle: false }),
      ],
    };
    const extension = ExtensionProvider.getExtension();
    const controller = extension.lookupControllerFactory.create(lcOpts);

    const provider = extension.noteLookupProviderFactory.create(this.key, {
      allowNewNote: false,
      noHidePickerOnAccept: false,
    });
    return new Promise((resolve) => {
      NoteLookupProviderUtils.subscribe({
        id: this.key,
        controller,
        logger: this.L,
        onDone: (event: HistoryEvent) => {
          const data = event.data as NoteLookupProviderSuccessResp;
          if (data.cancel) {
            resolve(undefined);
          }
          resolve(data);
        },
        onHide: () => {
          resolve(undefined);
        },
      });
      controller.show({
        title: "Decide the scope of refactor",
        placeholder: "Query for scope.",
        provider,
        selectAll: true,
      });
    });
  }

  async promptMatchText() {
    const editor = VSCodeUtils.getActiveTextEditor();
    const value = editor?.document
      ? WSUtils.getNoteFromDocument(editor.document)?.fname
      : "";
    const match = await VSCodeUtils.showInputBox({
      title: "Enter match text",
      prompt:
        "The matched portion of the file name will be the part that gets modified. The rest will remain unchanged. This supports full range of regular expression. Leave blank to capture entire file name",
      value,
    });

    if (match === undefined) {
      // immediately return if user cancels.
      return;
    } else if (match.trim() === "") {
      return "(.*)";
    }
    return match;
  }

  async promptReplaceText() {
    let done = false;
    let replace: string | undefined;
    do {
      // eslint-disable-next-line no-await-in-loop
      replace = await VSCodeUtils.showInputBox({
        title: "Enter replace text",
        prompt:
          "This will replace the matched portion of the file name. If the matched text from previous step has named / unnamed captured groups, they are available here.",
      });

      if (replace === undefined) {
        return;
      } else if (replace.trim() === "") {
        window.showWarningMessage("Please provide a replace text.");
      } else {
        done = true;
      }
    } while (!done);

    return replace;
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const scope = await this.promptScope();
    if (_.isUndefined(scope)) {
      window.showInformationMessage("No scope provided.");
      return;
    } else if (
      scope.selectedItems &&
      scope.selectedItems[0] === this.entireWorkspaceQuickPickItem
    ) {
      window.showInformationMessage("Refactor scoped to all notes.");
    } else {
      window.showInformationMessage(
        `Refactor scoped to ${scope.selectedItems.length} selected note(s).`
      );
    }

    const match = await this.promptMatchText();
    if (_.isUndefined(match)) {
      window.showErrorMessage("No match text provided.");
      return;
    } else {
      window.showInformationMessage(`Matching: ${match}`);
    }

    const replace = await this.promptReplaceText();
    if (_.isUndefined(replace) || replace.trim() === "") {
      window.showErrorMessage("No replace text provided.");
      return;
    } else {
      window.showInformationMessage(`Replacing with: ${replace}`);
    }

    return {
      scope,
      match,
      replace,
    };
  }

  async showPreview(operations: RenameOperation[]) {
    let content = [
      "# Refactor Preview",
      "",
      "## The following files will be renamed",
    ];
    content = content.concat(
      _.map(
        _.groupBy(operations, "vault.fsPath"),
        (ops: RenameOperation[], k: string) => {
          const out = [`${k}`].concat("\n||||\n|-|-|-|"); //create table of changes
          return out
            .concat(
              ops.map(({ oldUri, newUri }) => {
                return `| ${path.basename(oldUri.fsPath)} |-->| ${path.basename(
                  newUri.fsPath
                )} |`;
              })
            )
            .join("\n");
        }
      )
    );
    const panel = window.createWebviewPanel(
      "refactorPreview", // Identifies the type of the webview. Used internally
      "Refactor Preview", // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    );
    panel.webview.html = md.render(content.join("\n"));
  }

  async showError(operations: RenameOperation[]) {
    const content = [
      "# Error - Refactoring would overwrite files",
      "",
      "### The following files would be overwritten",
    ]
      .concat("\n||||\n|-|-|-|")
      .concat(
        operations.map(({ oldUri, newUri }) => {
          return `| ${path.basename(oldUri.fsPath)} |-->| ${path.basename(
            newUri.fsPath
          )} |`;
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

  getCapturedNotes(opts: {
    scope: NoteLookupProviderSuccessResp | undefined;
    matchRE: RegExp;
    engine: DEngineClient;
  }) {
    const { scope, matchRE, engine } = opts;
    const { notes } = engine;

    const scopedItems =
      _.isUndefined(scope) ||
      scope.selectedItems[0] === this.entireWorkspaceQuickPickItem
        ? _.toArray(notes)
        : scope.selectedItems.map(
            (item) =>
              _.omit(item, ["label", "detail", "alwaysShow"]) as DNodeProps
          );

    const capturedNotes: DNodeProps[] = scopedItems.filter((item) => {
      const result = matchRE.exec(item.fname);
      return result && !DNodeUtils.isRoot(item);
    });

    // filter out notes that are not in fs (virtual stub notes)
    return capturedNotes.filter((note) => {
      if (note.stub) {
        // if a stub is captured, see if it actually exists in the file system.
        // if it is in the file system, we should include it should be part of the refactor
        // otherwise, this should be omitted.
        // as the virtual stubs will automatically be handled by the rename operation.
        const notePath = NoteUtils.getFullPath({ wsRoot: engine.wsRoot, note });
        const existsInFileSystem = fs.existsSync(notePath);
        return existsInFileSystem;
      } else {
        return true;
      }
    });
  }

  getRenameOperations(opts: {
    capturedNotes: DNodeProps[];
    matchRE: RegExp;
    replace: string;
    wsRoot: string;
  }) {
    const { capturedNotes, matchRE, replace, wsRoot } = opts;
    const operations = capturedNotes.map((note) => {
      const vault = note.vault;
      const vpath = vault2Path({ wsRoot, vault });
      const rootUri = Uri.file(vpath);
      const source = note.fname;
      const dest = note.fname.replace(matchRE, replace);
      return {
        oldUri: VSCodeUtils.joinPath(rootUri, source + ".md"),
        newUri: VSCodeUtils.joinPath(rootUri, dest + ".md"),
        vault,
      };
    });
    return operations;
  }

  async hasExistingFiles(opts: { operations: RenameOperation[] }) {
    const { operations } = opts;
    const filesThatExist: RenameOperation[] = _.filter(operations, (op) => {
      return fs.pathExistsSync(op.newUri.fsPath);
    });
    if (!_.isEmpty(filesThatExist)) {
      await this.showError(filesThatExist);
      window.showErrorMessage(
        "refactored files would overwrite existing files"
      );
      return true;
    }
    return false;
  }

  async runOperations(opts: {
    operations: RenameOperation[];
    renameCmd: RenameNoteV2aCommand;
  }) {
    const { operations, renameCmd } = opts;
    const ctx = "RefactorHierarchy:runOperations";
    const out = await _.reduce<
      typeof operations[0],
      Promise<RenameNoteOutputV2a>
    >(
      operations,
      async (resp, op) => {
        const acc = await resp;
        this.L.info({
          ctx,
          orig: op.oldUri.fsPath,
          replace: op.newUri.fsPath,
        });
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
    return out;
  }

  async promptConfirmation(noConfirm?: boolean) {
    if (noConfirm) return true;
    const options = ["Proceed", "Cancel"];
    const resp = await VSCodeUtils.showQuickPick(options, {
      placeHolder: "Proceed",
      ignoreFocusOut: true,
    });
    return resp === "Proceed";
  }

  async execute(opts: CommandOpts): Promise<any> {
    const ctx = "RefactorHierarchy:execute";
    const { scope, match, replace, noConfirm } = opts;
    this.L.info({ ctx, opts, msg: "enter" });
    const ext = getExtension();
    const { engine } = getDWorkspace();
    const matchRE = new RegExp(match);
    const capturedNotes = this.getCapturedNotes({
      scope,
      matchRE,
      engine,
    });

    const operations = this.getRenameOperations({
      capturedNotes,
      matchRE,
      replace,
      wsRoot: engine.wsRoot,
    });

    if (await this.hasExistingFiles({ operations })) {
      return;
    }

    await this.showPreview(operations);

    const shouldProceed = await this.promptConfirmation(noConfirm);
    if (!shouldProceed) {
      window.showInformationMessage("Cancelled");
      return;
    }

    try {
      if (ext.fileWatcher) {
        ext.fileWatcher.pause = true;
      }
      const renameCmd = new RenameNoteV2aCommand();
      const out = await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: "Refactoring...",
          cancellable: false,
        },
        async () => {
          const out = await this.runOperations({ operations, renameCmd });
          return out;
        }
      );
      return { changed: _.uniqBy(out.changed, (ent) => ent.note.fname) };
    } finally {
      if (ext.fileWatcher) {
        setTimeout(() => {
          if (ext.fileWatcher) {
            ext.fileWatcher.pause = false;
            FileWatcher.refreshTree();
          }
          this.L.info({ ctx, msg: "exit" });
        }, 3000);
      }
    }
  }

  async showResponse(res: CommandOutput) {
    if (_.isUndefined(res)) {
      window.showInformationMessage("No note refactored.");
      return;
    }
    window.showInformationMessage("Done refactoring.");
    const { changed } = res;
    if (changed.length > 0) {
      window.showInformationMessage(`Dendron updated ${changed.length} files`);
    }
  }
}
