import {
  DendronError,
  DEngineClient,
  extractNoteChangeEntryCounts,
  NoteChangeEntry,
  NoteProps,
  RefactoringCommandUsedPayload,
  RenameNoteOpts,
  StatisticsUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryEvent } from "@dendronhq/engine-server";
import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import { Disposable, ProgressLocation, Uri, ViewColumn, window } from "vscode";
import { MultiSelectBtn } from "../components/lookup/buttons";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3Interface";
import {
  OldNewLocation,
  ProviderAcceptHooks,
} from "../components/lookup/utils";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { FileItem } from "../external/fileutils/FileItem";
import { UNKNOWN_ERROR_MSG } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { ProceedCancel, QuickPickUtil } from "../utils/quickPick";
import { BasicCommand } from "./base";
import { ExtensionProvider } from "../ExtensionProvider";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";
import { IDendronExtension } from "../dendronExtensionInterface";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { AutoCompleter } from "../utils/autoCompleter";

type CommandInput = any;

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

export class MoveNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.MOVE_NOTE.key;
  private extension: IDendronExtension;
  _proxyMetricPayload:
    | (RefactoringCommandUsedPayload & {
        extra: {
          [key: string]: any;
        };
      })
    | undefined;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandInput | undefined> {
    const extension = ExtensionProvider.getExtension();
    const engine = extension.getEngine();
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
      // allow users to select multiple notes to move
      extraButtons: [MultiSelectBtn.create({ pressed: false })],
    };
    if (vault) {
      lookupCreateOpts.buttons = [];
    }
    const lc = await extension.lookupControllerFactory.create(lookupCreateOpts);

    const provider = extension.noteLookupProviderFactory.create("move", {
      allowNewNote: true,
      forceAsIsPickerValueUsage: true,
    });
    provider.registerOnAcceptHook(ProviderAcceptHooks.oldNewLocationHook);
    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md"
    );

    return new Promise((resolve) => {
      let disposable: Disposable;

      NoteLookupProviderUtils.subscribe({
        id: "move",
        controller: lc,
        logger: this.L,
        onDone: async (event: HistoryEvent) => {
          const data =
            event.data as NoteLookupProviderSuccessResp<OldNewLocation>;
          if (data.cancel) {
            resolve(undefined);
            return;
          }
          await this.prepareProxyMetricPayload(data);
          const opts: CommandOpts = {
            moves: this.getDesiredMoves(data),
          };
          resolve(opts);

          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
        onError: (event: HistoryEvent) => {
          const error = event.data.error as DendronError;
          window.showErrorMessage(error.message);
          resolve(undefined);
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
      });
      lc.show({
        title: opts?.title || "Move note",
        placeholder: "foo",
        provider,
        initialValue: opts?.initialValue || initialValue,
        nonInteractive: opts?.nonInteractive,
      });

      VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

      disposable = AutoCompletableRegistrar.OnAutoComplete(() => {
        if (lc.quickPick) {
          lc.quickPick.value = AutoCompleter.getAutoCompletedValue(
            lc.quickPick
          );

          lc.provider.onUpdatePickerItems({
            picker: lc.quickPick,
          });
        }
      });
    });
  }

  private async prepareProxyMetricPayload(
    data: NoteLookupProviderSuccessResp<OldNewLocation>
  ) {
    const ctx = `${this.key}:prepareProxyMetricPayload`;
    const engine = ExtensionProvider.getEngine();
    let items: NoteProps[];
    if (data.selectedItems.length === 1) {
      // single move. find note from resp
      const { oldLoc } = data.onAcceptHookResp[0];
      const { fname, vaultName: vname } = oldLoc;
      if (fname !== undefined && vname !== undefined) {
        const vault = VaultUtils.getVaultByName({
          vaults: engine.vaults,
          vname,
        });
        const note = (await engine.findNotes({ fname, vault }))[0];
        items = [note];
      } else {
        items = [];
      }
    } else {
      const noteIds = data.selectedItems.map((item) => item.id);
      const resp = await engine.bulkGetNotes(noteIds);
      if (resp.error) {
        this.L.error({ ctx, error: resp.error });
        return;
      }
      items = resp.data;
    }

    const basicStats = StatisticsUtils.getBasicStatsFromNotes(items);
    if (basicStats === undefined) {
      this.L.error({ ctx, message: "failed to get basic stats from notes." });
      return;
    }

    const { numChildren, numLinks, numChars, noteDepth, ...rest } = basicStats;

    const traitsAcc = items.flatMap((item) =>
      item.traits && item.traits.length > 0 ? item.traits : []
    );
    const traitsSet = new Set(traitsAcc);

    this._proxyMetricPayload = {
      command: this.key,
      numVaults: engine.vaults.length,
      traits: [...traitsSet],
      numChildren,
      numLinks,
      numChars,
      noteDepth,
      extra: {
        numProcessed: items.length,
        ...rest,
      },
    };
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

    const { engine, wsRoot } = this.extension.getDWorkspace();

    if (this.extension.fileWatcher && !opts.noPauseWatcher) {
      this.extension.fileWatcher.pause = true;
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
        await closeCurrentFileOpenMovedFile(engine, opts.moves[0], wsRoot);
      }
      return { changed };
    } finally {
      if (this.extension.fileWatcher && !opts.noPauseWatcher) {
        setTimeout(() => {
          if (this.extension.fileWatcher) {
            this.extension.fileWatcher.pause = false;
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

  trackProxyMetrics({
    opts,
    noteChangeEntryCounts,
  }: {
    opts: CommandOpts;
    noteChangeEntryCounts: {
      createdCount: number;
      deletedCount: number;
      updatedCount: number;
    };
  }) {
    if (this._proxyMetricPayload === undefined) {
      // something went wrong during prep. don't track.
      return;
    }
    const { extra, ...props } = this._proxyMetricPayload;

    ProxyMetricUtils.trackRefactoringProxyMetric({
      props,
      extra: {
        ...extra,
        ...noteChangeEntryCounts,
        isMultiMove: isMultiMove(opts.moves),
      },
    });
  }

  addAnalyticsPayload(opts: CommandOpts, out: CommandOutput) {
    const noteChangeEntryCounts =
      out !== undefined
        ? { ...extractNoteChangeEntryCounts(out.changed) }
        : {
            createdCount: 0,
            updatedCount: 0,
            deletedCount: 0,
          };
    try {
      this.trackProxyMetrics({ opts, noteChangeEntryCounts });
    } catch (error) {
      this.L.error({ error });
    }

    return noteChangeEntryCounts;
  }
}

async function closeCurrentFileOpenMovedFile(
  engine: DEngineClient,
  moveOpts: RenameNoteOpts,
  wsRoot: string
) {
  const vault = VaultUtils.getVaultByName({
    vaults: engine.vaults,
    vname: moveOpts.newLoc.vaultName!,
  })!;

  const vpath = vault2Path({ wsRoot, vault });
  const newUri = Uri.file(path.join(vpath, moveOpts.newLoc.fname + ".md"));
  await VSCodeUtils.closeCurrentFileEditor();
  await VSCodeUtils.openFileInEditor(new FileItem(newUri));
}
