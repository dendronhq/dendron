import {
  DNodeProps,
  DNodeUtils,
  DVault,
  NoteQuickInput,
  NoteUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import _md from "markdown-it";
import { HistoryEvent } from "@dendronhq/engine-server";
import path from "path";
import { ProgressLocation, Uri, ViewColumn, window } from "vscode";
import {
  LookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3";
import {
  NoteLookupProvider,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import { NoteLookupProviderUtils } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { FileWatcher } from "../fileWatcher";
import { VSCodeUtils } from "../utils";
import { getExtension, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { RenameNoteOutputV2a, RenameNoteV2aCommand } from "./RenameNoteV2a";
import {
  MultiSelectBtn,
  Selection2ItemsBtn,
} from "../components/lookup/buttons";

const md = _md();

type CommandOpts = {
  scope?: NoteLookupProviderSuccessResp;
  match: string;
  replace: string;
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

  async promptScope(opts: {
    initialValue: string;
  }): Promise<NoteLookupProviderSuccessResp | undefined> {
    const { initialValue } = opts;
    const lcOpts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: true,
      vaultSelectCanToggle: false,
      extraButtons: [
        Selection2ItemsBtn.create(false),
        MultiSelectBtn.create(false),
      ],
    };
    const controller = LookupControllerV3.create(lcOpts);
    const provider = new NoteLookupProvider(this.key, {
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
        initialValue,
        title: "Scope",
        placeholder: "Query for scope. Press esc. to use all notes.",
        provider,
      });
    });
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    let replace: string | undefined;
    let value: string = "";
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) {
      value = NoteUtils.uri2Fname(editor.document.uri);
    }

    const scope = await this.promptScope({ initialValue: value });

    const match = await VSCodeUtils.showInputBox({
      prompt: "Enter match text. Press esc. to use capture entire file name.",
    });

    if (match) {
      replace = await VSCodeUtils.showInputBox({
        prompt: "Enter replace prefix.",
      });
    }

    if (_.isUndefined(replace) || !match) {
      return;
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

  async execute(opts: CommandOpts): Promise<any> {
    const ctx = "RefactorHierarchy:execute";
    const { scope, match, replace } = opts;

    this.L.info({ ctx, opts, msg: "enter" });
    const ext = getExtension();
    const { engine } = getDWorkspace();
    const { notes, schemas, vaults, wsRoot } = engine;

    const re = new RegExp(_.isUndefined(match) ? "(.*)" : match);

    const capturedEntries: { item: NoteQuickInput; result: RegExpExecArray }[] =
      [];

    const scopedItems = _.isUndefined(scope)
      ? _.toArray(notes).map((note: DNodeProps) => {
          return DNodeUtils.enhancePropForQuickInputV3({
            props: note,
            schemas,
            vaults,
            wsRoot,
          });
        })
      : scope.selectedItems;

    scopedItems.forEach((item) => {
      const result = re.exec(item.fname);
      if (result) {
        capturedEntries.push({ item, result });
      }
    });

    const operations = capturedEntries.map((entry) => {
      const { item } = entry;
      const vault = item.vault;
      const vpath = vault2Path({ wsRoot, vault });
      const rootUri = Uri.file(vpath);
      const source = item.fname;
      const matchRE = new RegExp(`${match}`);
      const dest = item.fname.replace(matchRE, replace);
      return {
        oldUri: VSCodeUtils.joinPath(rootUri, source + ".md"),
        newUri: VSCodeUtils.joinPath(rootUri, dest + ".md"),
        vault,
      };
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
