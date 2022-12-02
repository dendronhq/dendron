import {
  DVault,
  NoteChangeEntry,
  ReducedDEngine,
  RenameNoteOpts,
  URI,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import _md from "markdown-it";
import {
  commands,
  ProgressLocation,
  TextEditor,
  Uri,
  ViewColumn,
  window,
  workspace,
} from "vscode";
import { inject, injectable } from "tsyringe";
import { MultiSelectBtn } from "../../components/lookup/buttons";
import { DENDRON_COMMANDS } from "../../constants";
import { type ILookupProvider } from "./lookup/ILookupProvider";
import {
  LookupController,
  LookupControllerCreateOpts,
} from "./lookup/LookupController";
import { VaultQuickPick } from "./lookup/VaultQuickPick";
import { Utils } from "vscode-uri";

//const md = _md();

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

  async run() {
    const moveNoteOpts: LookupControllerCreateOpts = {
      provider: this.provider,
      nodeType: "note",
      disableVaultSelection: false,
      vaultSelectCanToggle: false,
      buttons: [MultiSelectBtn.create({ pressed: false })],
      title: "Move note",
      allowCreateNew: false,
      canPickMany: true,
    };
    const data = await this.controller.showLookup(moveNoteOpts);
    if (!data?.items) return "no items selected";

    //const move = getDesiredMoves(data);
    const vaultPicker = new VaultQuickPick(this.engine);
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

    if (isMultiMove(moves)) {
      // During bulk move we will only open a single file that was moved to avoid
      // cluttering user tabs with all moved files.
      await closeCurrentFileOpenMovedFile(this.wsRoot, moves[0], this.vaults);
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

  // private async showMultiMovePreview(moves: RenameNoteOpts[]) {
  //   // All the moves when doing bulk-move will have the same destination vault.
  //   const destVault = moves[0].newLoc.vaultName;

  //   const contentLines = [
  //     "# Move notes preview",
  //     "",
  //     `## The following files will be moved to vault: ${destVault}`,
  //   ];

  //   const necessaryMoves = moves.filter((m) => isMoveNecessary(m));
  //   const movesBySourceVaultName = _.groupBy(
  //     necessaryMoves,
  //     "oldLoc.vaultName"
  //   );

  //   function formatRowFileName(move: RenameNoteOpts) {
  //     return `| ${path.basename(move.oldLoc.fname)} |`;
  //   }

  //   _.forEach(
  //     movesBySourceVaultName,
  //     (moves: RenameNoteOpts[], sourceVault: string) => {
  //       contentLines.push(`| From vault: ${sourceVault} to ${destVault} |`);
  //       contentLines.push(`|------------------------|`);
  //       moves.forEach((move) => {
  //         contentLines.push(formatRowFileName(move));
  //       });
  //       contentLines.push("---");
  //     }
  //   );

  //   // When we are doing multi select move we don't support renaming file name
  //   // functionality hence the files that do not require a move must have
  //   // been attempted to be moved into the vault that they are already are.
  //   const sameVaultMoves = moves.filter((m) => !isMoveNecessary(m));
  //   if (sameVaultMoves.length) {
  //     contentLines.push(`|The following are already in vault: ${destVault}|`);
  //     contentLines.push(`|-----------------------------------------------|`);
  //     sameVaultMoves.forEach((m) => {
  //       contentLines.push(formatRowFileName(m));
  //     });
  //   }

  //   const panel = window.createWebviewPanel(
  //     "noteMovePreview", // Identifies the type of the webview. Used internally
  //     "Move Notes Preview", // Title of the panel displayed to the user
  //     ViewColumn.One, // Editor column to show the new webview panel in.
  //     {} // Webview options. More on these later.
  //   );
  //   panel.webview.html = md.render(contentLines.join("\n"));
  // }
}

async function closeCurrentFileOpenMovedFile(
  wsRoot: URI,
  moveOpts: RenameNoteOpts,
  vaults: DVault[]
) {
  const vault = VaultUtils.getVaultByName({
    vaults,
    vname: moveOpts.newLoc.vaultName!,
  })!;

  const filePath = Utils.joinPath(
    wsRoot,
    VaultUtils.getRelPath(vault),
    moveOpts.newLoc.fname + ".md"
  );

  commands.executeCommand("workbench.action.closeActiveEditor");
  await openFileInEditor(filePath);
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

// async function oldNewLocationHook(data: LookupAcceptPayload) {
//   // setup vars
//   const oldVault = PickerUtilsV2.getVaultForOpenEditor();
//   const newVault = quickpick.vault ? quickpick.vault : oldVault;
//   const engine = ExtensionProvider.getEngine();

//   // get old note
//   const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
//   const oldUri: Uri = editor.document.uri;
//   const oldFname = DNodeUtils.fname(oldUri.fsPath);

//   const selectedItem = selectedItems[0];
//   const fname = PickerUtilsV2.isCreateNewNotePickedForSingle(selectedItem)
//     ? quickpick.value
//     : selectedItem.fname;

//   // get new note
//   const newNote = (await engine.findNotesMeta({ fname, vault: newVault }))[0];
//   const isStub = newNote?.stub;
//   if (newNote && !isStub) {
//     const vaultName = VaultUtils.getName(newVault);
//     const errMsg = `${vaultName}/${quickpick.value} exists`;
//     window.showErrorMessage(errMsg);
//     return {
//       error: new DendronError({ message: errMsg }),
//     };
//   }
//   const data: RenameNoteOpts = {
//     oldLoc: {
//       fname: oldFname,
//       vaultName: VaultUtils.getName(oldVault),
//     },
//     newLoc: {
//       fname: quickpick.value,
//       vaultName: VaultUtils.getName(newVault),
//     },
//   };
//   return { data, error: null };
// }

// async function getDesiredMoves(data: LookupAcceptPayload) {
//   if (data.items.length === 1) {
//     return "";
//   } else if (data.items.length > 1) {
//     return "";
//   } else {
//     return "no items selected";
//   }
// }
