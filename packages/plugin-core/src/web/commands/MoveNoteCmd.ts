import {
  DVault,
  NoteChangeEntry,
  ReducedDEngine,
  RenameNoteOpts,
  URI,
  VaultUtils,
} from "@dendronhq/common-all";
//import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import {
  commands,
  ProgressLocation,
  TextEditor,
  Uri,
  ViewColumn,
  window,
  workspace,
} from "vscode";
//import { FileItem } from "../external/fileutils/FileItem";
import { inject, injectable } from "tsyringe";
import { MultiSelectBtn } from "../../components/lookup/buttons";
import { DENDRON_COMMANDS } from "../../constants";
import { type ILookupProvider } from "./lookup/ILookupProvider";
import {
  LookupController,
  LookupControllerCreateOpts,
} from "./lookup/LookupController";
import { VaultQuickPick } from "./lookup/VaultQuickPick";

const md = _md();

export type CommandOpts = {
  moves: RenameNoteOpts[];
  /**
   * Show notification message
   */
  silent?: boolean;
  /**
   * Close and open current file
   */
  closeAndOpenFile?: boolean;
  /**
   * Pause all watchers
   */
  noPauseWatcher?: boolean;
  nonInteractive?: boolean;
  initialValue?: string;
  vaultName?: string;
  /**
   * If set to true, don't allow toggling vaults
   * Used in RenameNoteCommand
   */
  useSameVault?: boolean;
  /** Defaults to true. */
  allowMultiselect?: boolean;
  /** set a custom title for the quick input. Used for rename note */
  title?: string;
};

export type CommandOutput = {
  changed: NoteChangeEntry[];
};

function isMultiMove(moves: RenameNoteOpts[]) {
  return moves.length > 1;
}

function isMoveNecessary(move: RenameNoteOpts) {
  return (
    move.oldLoc.vaultName !== move.newLoc.vaultName ||
    move.oldLoc.fname.toLowerCase() !== move.newLoc.fname.toLowerCase()
  );
}

@injectable()
export class MoveNoteCmd {
  static key = DENDRON_COMMANDS.MOVE_NOTE.key;

  constructor(
    @inject("vaults") private vaults: DVault[],
    @inject("NoteProvider") private provider: ILookupProvider,
    @inject("ReducedDEngine")
    private engine: ReducedDEngine,
    private controller: LookupController,
    @inject("wsRoot") private wsRoot: URI
  ) {}

  // async gatherInputs(opts?: CommandOpts): Promise<CommandInput | undefined> {

  //   //provider.registerOnAcceptHook(ProviderAcceptHooks.oldNewLocationHook);

  //   // return new Promise((resolve) => {
  //   //   let disposable: Disposable;

  //     // NoteLookupProviderUtils.subscribe({
  //     //   id: "move",
  //     //   controller: lc,
  //     //   logger: this.L,
  //     //   onDone: async (event: HistoryEvent) => {
  //     //     const data =
  //     //       event.data as NoteLookupProviderSuccessResp<OldNewLocation>;
  //     //     if (data.cancel) {
  //     //       resolve(undefined);
  //     //       return;
  //     //     }
  //     //     const opts: CommandOpts = {
  //     //       moves: this.getDesiredMoves(data),
  //     //     };
  //     //     resolve(opts);

  //     //     disposable?.dispose();
  //     //     VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
  //     //   },
  //     //   onError: (event: HistoryEvent) => {
  //     //     const error = event.data.error as DendronError;
  //     //     window.showErrorMessage(error.message);
  //     //     resolve(undefined);
  //     //     disposable?.dispose();
  //     //     VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
  //     //   },
  //     // });

  //   });
  // }

  // private getDesiredMoves(
  //   data: NoteLookupProviderSuccessResp<OldNewLocation>
  // ): RenameNoteOpts[] {
  //   if (data.selectedItems.length === 1) {
  //     // If there is only a single element that we are working on then we can allow
  //     // for the file name to be renamed as part of the move, hence we need to
  //     // use onAcceptHookResp since it contains the destination file name.
  //     return data.onAcceptHookResp;
  //   } else if (data.selectedItems.length > 1) {
  //     // If there are multiple elements selected then we are aren't doing multi rename
  //     // in multi note move and therefore we will use selected items to get
  //     // all the files that the user has selected.

  //     const newVaultName = data.onAcceptHookResp[0].newLoc.vaultName;

  //     return data.selectedItems.map((item) => {
  //       const renameOpt: RenameNoteOpts = {
  //         oldLoc: {
  //           fname: item.fname,
  //           vaultName: VaultUtils.getName(item.vault),
  //         },
  //         newLoc: {
  //           fname: item.fname,
  //           vaultName: newVaultName,
  //         },
  //       };
  //       return renameOpt;
  //     });
  //   } else {
  //     throw new DendronError({
  //       message: `MoveNoteCommand: No items are selected. ${UNKNOWN_ERROR_MSG}`,
  //     });
  //   }
  // }

  async run(_opts?: CommandOpts) {
    if (_.isUndefined(window.activeTextEditor)) {
      return "No document open";
    }
    const lookupCreateOpts: LookupControllerCreateOpts = {
      provider: this.provider,
      nodeType: "note",
      // rename note opt
      disableVaultSelection: _opts?.useSameVault,
      // If vault selection is enabled we alwaysPrompt selection mode,
      // hence disable toggling.
      vaultSelectCanToggle: false,
      // allow users to select multiple notes to move
      buttons: [MultiSelectBtn.create({ pressed: false })],
      title: "Move note",
      initialValue: _opts?.initialValue,
      allowCreateNew: false,
    };
    const data = await this.controller.showLookup(lookupCreateOpts);

    const vaultPicker = new VaultQuickPick(this.engine);
    if (!data?.items) return "no items selected";
    const vaultSuggestions = await vaultPicker.getVaultRecommendations({
      vault: data.items[0].vault,
      vaults: this.vaults,
      fname: data.items[0].fname,
    });
    const newLocation = await vaultPicker.promptVault(vaultSuggestions);
    if (!newLocation) return "no vault selected";
    const moves: RenameNoteOpts[] = [
      {
        oldLoc: {
          fname: data.items[0].fname,
          vaultName: VaultUtils.getName(data.items[0].vault),
        },
        newLoc: {
          fname: data.items[0].fname,
          vaultName: VaultUtils.getName(newLocation),
        },
      },
    ];

    const opts = _.defaults(_opts, {
      closeAndOpenFile: true,
      allowMultiselect: true,
    });

    // if (isMultiMove(opts.moves)) {
    //   await this.showMultiMovePreview(opts.moves);
    //   const result = await QuickPickUtils.showProceedCancel();

    //   if (result !== ProceedCancel.PROCEED) {
    //     window.showInformationMessage("cancelled");
    //     return { changed: [] };
    //   }
    // }

    const changed = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Refactoring...",
        cancellable: false,
      },
      async () => {
        const allChanges = await this.moveNotes(this.engine, moves);
        return allChanges;
      }
    );

    if (opts.closeAndOpenFile) {
      // During bulk move we will only open a single file that was moved to avoid
      // cluttering user tabs with all moved files.
      await closeCurrentFileOpenMovedFile(
        this.wsRoot.fsPath,
        moves[0],
        this.vaults
      );
    }
    return { changed };
  }

  /** Performs the actual move of the notes. */
  private async moveNotes(
    engine: ReducedDEngine,
    moves: RenameNoteOpts[]
  ): Promise<NoteChangeEntry[]> {
    const necessaryMoves = moves.filter((move) => isMoveNecessary(move));

    const allChanges: NoteChangeEntry[] = [];

    for (const move of necessaryMoves) {
      // We need to wait for a rename to finish before triggering another rename
      // eslint-disable-next-line no-await-in-loop
      const changes = await engine.renameNote(move);

      allChanges.push(...(changes.data as NoteChangeEntry[]));
    }

    return allChanges;
  }

  private async showMultiMovePreview(moves: RenameNoteOpts[]) {
    // All the moves when doing bulk-move will have the same destination vault.
    const destVault = moves[0].newLoc.vaultName;

    const contentLines = [
      "# Move notes preview",
      "",
      `## The following files will be moved to vault: ${destVault}`,
    ];

    const necessaryMoves = moves.filter((m) => isMoveNecessary(m));
    const movesBySourceVaultName = _.groupBy(
      necessaryMoves,
      "oldLoc.vaultName"
    );

    function formatRowFileName(move: RenameNoteOpts) {
      return `| ${path.basename(move.oldLoc.fname)} |`;
    }

    _.forEach(
      movesBySourceVaultName,
      (moves: RenameNoteOpts[], sourceVault: string) => {
        contentLines.push(`| From vault: ${sourceVault} to ${destVault} |`);
        contentLines.push(`|------------------------|`);
        moves.forEach((move) => {
          contentLines.push(formatRowFileName(move));
        });
        contentLines.push("---");
      }
    );

    // When we are doing multi select move we don't support renaming file name
    // functionality hence the files that do not require a move must have
    // been attempted to be moved into the vault that they are already are.
    const sameVaultMoves = moves.filter((m) => !isMoveNecessary(m));
    if (sameVaultMoves.length) {
      contentLines.push(`|The following are already in vault: ${destVault}|`);
      contentLines.push(`|-----------------------------------------------|`);
      sameVaultMoves.forEach((m) => {
        contentLines.push(formatRowFileName(m));
      });
    }

    const panel = window.createWebviewPanel(
      "noteMovePreview", // Identifies the type of the webview. Used internally
      "Move Notes Preview", // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    );
    panel.webview.html = md.render(contentLines.join("\n"));
  }
}

async function closeCurrentFileOpenMovedFile(
  wsRoot: string,
  moveOpts: RenameNoteOpts,
  vaults: DVault[]
) {
  const vault = VaultUtils.getVaultByName({
    vaults,
    vname: moveOpts.newLoc.vaultName!,
  })!;

  const vpath = vault.fsPath;
  const newUri = Uri.file(
    path.join(wsRoot, "notes", vpath, moveOpts.newLoc.fname + ".md")
  );
  commands.executeCommand("workbench.action.closeActiveEditor");
  await openFileInEditor(newUri);
}

async function openFileInEditor(
  file: Uri,
  opts?: Partial<{
    column: ViewColumn;
  }>
): Promise<TextEditor | undefined> {
  const textDocument = await workspace.openTextDocument(file);

  if (!textDocument) {
    throw new Error("Could not open file!");
  }

  const col = opts?.column || ViewColumn.Active;

  const editor = await window.showTextDocument(textDocument, col);
  if (!editor) {
    throw new Error("Could not show document!");
  }

  return editor;
}
