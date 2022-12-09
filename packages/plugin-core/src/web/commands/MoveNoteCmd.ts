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
  LookupAcceptPayload,
  LookupController,
  LookupControllerCreateOpts,
} from "./lookup/LookupController";
import { VaultQuickPick } from "./lookup/VaultQuickPick";
import { Utils } from "vscode-uri";
import { ProceedCancel, QuickPickUtils } from "./lookup/QuickPickUtils";
import path from "path";

const md = _md();

export type CommandOutput = {
  changed: NoteChangeEntry[];
};

export type MoveNoteOpts = {
  closeAndOpenFile: boolean;
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

  async run(opts?: MoveNoteOpts): Promise<{ changed: NoteChangeEntry[] }> {
    opts = _.defaults(opts, { closeAndOpenFile: true });
    const moveNoteOpts: LookupControllerCreateOpts = {
      provider: this.provider,
      disableVaultSelection: false,
      vaultSelectCanToggle: false,
      buttons: [MultiSelectBtn.create({ pressed: false })],
      title: "Move note",
      allowCreateNew: false,
      canPickMany: true,
    };
    const data = await this.controller.showLookup(moveNoteOpts);
    if (!data?.items) {
      window.showWarningMessage(
        "Move note cancelled. No note selected to move."
      );
      return { changed: [] };
    }

    const vaultPicker = new VaultQuickPick(this.engine);
    const vaultSuggestions = await vaultPicker.getVaultRecommendations({
      vault: data.items[0].vault,
      vaults: this.vaults,
      fname: data.items[0].fname,
    });
    if (vaultSuggestions.length === 0) {
      window.showErrorMessage(
        `No available vaults for moving note. Each vault already has a note with filename ${data.items[0].fname}`
      );
      return { changed: [] };
    }
    const newVault = await vaultPicker.promptVault(vaultSuggestions);
    if (!newVault) {
      window.showErrorMessage("Move note cancelled. No vault selected");
      return { changed: [] };
    }
    const moves = this.getDesiredMoves(data, newVault);

    if (isMultiMove(moves)) {
      await this.showMultiMovePreview(moves);
      const result = await QuickPickUtils.showProceedCancel();

      if (result !== ProceedCancel.PROCEED) {
        window.showInformationMessage("cancelled");
        return { changed: [] };
      }
    }

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

    // During bulk move we will only open a single file that was moved to avoid
    // cluttering user tabs with all moved files.
    if (opts?.closeAndOpenFile)
      await closeCurrentFileOpenMovedFile(this.wsRoot, moves[0], this.vaults);

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
      if (changes.error) {
        window.showErrorMessage(changes.error.message);
      } else {
        allChanges.push(...(changes.data as NoteChangeEntry[]));
      }
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

  getDesiredMoves(
    data: LookupAcceptPayload,
    newLocation: DVault
  ): RenameNoteOpts[] {
    const newVaultName = VaultUtils.getName(newLocation);

    return data.items.map((item) => {
      const renameOpt: RenameNoteOpts = {
        oldLoc: {
          fname: item.fname,
          vaultName: VaultUtils.getName(item.vault),
        },
        newLoc: {
          fname: item.fname,
          vaultName: newVaultName,
        },
      };
      return renameOpt;
    });
  }
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
