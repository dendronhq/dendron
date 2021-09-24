import {
  DendronError,
  DEngineClient,
  ErrorFactory,
  NoteChangeEntry,
  RenameNoteOpts,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import { ProgressLocation, Uri, ViewColumn, window } from "vscode";
import { MultiSelectBtn } from "../components/lookup/buttons";
import {
  LookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3";
import {
  NoteLookupProvider,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import {
  OldNewLocation,
  ProviderAcceptHooks,
} from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { FileItem } from "../external/fileutils/FileItem";
import { UNKNOWN_ERROR_MSG } from "../logger";
import { VSCodeUtils } from "../utils";
import { ProceedCancel, QuickPickUtil } from "../utils/quickPick";
import { getDWorkspace, getExtension } from "../workspace";
import { BasicCommand } from "./base";

type CommandInput = any;

const md = _md();

type CommandOpts = {
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
  useSameVault?: boolean;
  /** Defaults to true. */
  allowMultiselect?: boolean;
};

type CommandOutput = {
  changed: NoteChangeEntry[];
};

function isMultiMove(moves: RenameNoteOpts[]) {
  return moves.length > 1;
}

function isMoveNecessary(move: RenameNoteOpts) {
  return (
    move.oldLoc.vaultName !== move.newLoc.vaultName ||
    move.oldLoc.fname !== move.newLoc.fname
  );
}

export class MoveNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.MOVE_NOTE.key;

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandInput | undefined> {
    const engine = getDWorkspace().engine;
    const vault = opts?.vaultName
      ? VaultUtils.getVaultByName({
          vaults: engine.vaults,
          vname: opts.vaultName,
        })
      : undefined;

    const lookupCreateOpts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: opts?.useSameVault,
      // If vault selection is enabled we alwaysPrompt selection mode,
      // hence disable toggling.
      vaultSelectCanToggle: false,
      extraButtons: [MultiSelectBtn.create(false)],
    };
    if (vault) {
      lookupCreateOpts.buttons = [];
    }
    const lc = LookupControllerV3.create(lookupCreateOpts);

    const provider = new NoteLookupProvider("move", {
      allowNewNote: true,
      forceAsIsPickerValueUsage: true,
    });
    provider.registerOnAcceptHook(ProviderAcceptHooks.oldNewLocationHook);
    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md"
    );
    lc.show({
      title: "Move note",
      placeholder: "foo",
      provider,
      initialValue: opts?.initialValue || initialValue,
      nonInteractive: opts?.nonInteractive,
    });
    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id: "move",
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove("move", "lookupProvider");
            const data =
              event.data as NoteLookupProviderSuccessResp<OldNewLocation>;
            if (data.cancel) {
              resolve(undefined);
              return;
            }
            const opts: CommandOpts = {
              moves: this.getDesiredMoves(data),
            };
            resolve(opts);
            lc.onHide();
          } else if (event.action === "error") {
            const error = event.data.error as DendronError;
            lc.onHide();
            window.showErrorMessage(error.message);
            resolve(undefined);
          } else if (
            event.data &&
            event.action === "changeState" &&
            event.data.action === "hide"
          ) {
            // This changeState/hide will be triggered after the user has picked a file.
            this.L.info({
              ctx: `MoveNoteCommand`,
              msg: `changeState.hide event received.`,
            });
          } else {
            throw ErrorFactory.createUnexpectedEventError({ event });
          }
        },
      });
    });
  }

  private getDesiredMoves(
    data: NoteLookupProviderSuccessResp<OldNewLocation>
  ): RenameNoteOpts[] {
    if (data.selectedItems.length === 1) {
      // If there is only a single element that we are working on then we can allow
      // for the file name to be renamed as part of the move, hence we need to
      // use onAcceptHookResp since it contains the destination file name.
      return data.onAcceptHookResp;
    } else if (data.selectedItems.length > 1) {
      // If there are multiple elements selected then we are aren't doing multi rename
      // in multi note move and therefore we will use selected items to get
      // all the files that the user has selected.

      const newVaultName = data.onAcceptHookResp[0].newLoc.vaultName;

      return data.selectedItems.map((item) => {
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
    } else {
      throw new DendronError({
        message: `MoveNoteCommand: No items are selected. ${UNKNOWN_ERROR_MSG}`,
      });
    }
  }

  async execute(opts: CommandOpts): Promise<{ changed: NoteChangeEntry[] }> {
    const ctx = "MoveNoteCommand:execute";

    opts = _.defaults(opts, {
      closeAndOpenFile: true,
      allowMultiselect: true,
    });

    const { engine } = getDWorkspace();
    const ext = getExtension();

    if (ext.fileWatcher && !opts.noPauseWatcher) {
      ext.fileWatcher.pause = true;
    }
    try {
      this.L.info({ ctx, opts });

      if (isMultiMove(opts.moves)) {
        await this.showMultiMovePreview(opts.moves);
        const result = await QuickPickUtil.showProceedCancel();

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
          const allChanges = await this.moveNotes(engine, opts.moves);
          return allChanges;
        }
      );

      if (opts.closeAndOpenFile) {
        // During bulk move we will only open a single file that was moved to avoid
        // cluttering user tabs with all moved files.
        await closeCurrentFileOpenMovedFile(engine, opts.moves[0]);
      }
      return { changed };
    } finally {
      getExtension().dendronTreeView?.treeProvider.refresh();
      if (ext.fileWatcher && !opts.noPauseWatcher) {
        setTimeout(() => {
          if (ext.fileWatcher) {
            ext.fileWatcher.pause = false;
          }
          this.L.info({ ctx, msg: "exit" });
        }, 3000);
      }
    }
  }

  /** Performs the actual move of the notes. */
  private async moveNotes(
    engine: DEngineClient,
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
  engine: DEngineClient,
  moveOpts: RenameNoteOpts
) {
  const wsRoot = getDWorkspace().wsRoot;

  const vault = VaultUtils.getVaultByName({
    vaults: engine.vaults,
    vname: moveOpts.newLoc.vaultName!,
  })!;

  const vpath = vault2Path({ wsRoot, vault });
  const newUri = Uri.file(path.join(vpath, moveOpts.newLoc.fname + ".md"));
  await VSCodeUtils.closeCurrentFileEditor();
  await VSCodeUtils.openFileInEditor(new FileItem(newUri));
}
