import {
  asyncLoop,
  extractNoteChangeEntryCounts,
  NoteChangeEntry,
  NoteProps,
  RefactoringCommandUsedPayload,
  StatisticsUtils,
} from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import {
  CreateQuickPickOpts,
  ILookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3Interface";
import {
  ILookupProviderV3,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3Interface";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand, SanityCheckResults } from "./base";
import * as vscode from "vscode";
import _ from "lodash";
import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { LinkUtils } from "@dendronhq/unified";
import { AutoCompleter } from "../utils/autoCompleter";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";

type CommandInput = {
  source?: string;
  dest?: string;
  noConfirm?: boolean;
};

type CommandOpts = {
  sourceNote: NoteProps | undefined;
  destNote: NoteProps | undefined;
} & CommandInput;

type CommandOutput = {
  changed: NoteChangeEntry[];
} & CommandOpts;

export class MergeNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.MERGE_NOTE.key;
  _proxyMetricPayload:
    | (RefactoringCommandUsedPayload & {
        extra: {
          [key: string]: any;
        };
      })
    | undefined;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  private createLookupController(): ILookupControllerV3 {
    const opts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: true,
    };
    const controller = this.extension.lookupControllerFactory.create(opts);
    return controller;
  }

  private createLookupProvider(opts: { activeNote: NoteProps | undefined }) {
    const { activeNote } = opts;
    return this.extension.noteLookupProviderFactory.create(this.key, {
      allowNewNote: false,
      noHidePickerOnAccept: false,
      preAcceptValidators: [
        // disallow accepting the currently active note from the picker.
        (selectedItems) => {
          const maybeActiveNoteItem = selectedItems.find((item) => {
            return item.id === activeNote?.id;
          });
          if (maybeActiveNoteItem) {
            vscode.window.showErrorMessage(
              "You cannot merge a note to itself."
            );
          }
          return !maybeActiveNoteItem;
        },
      ],
    });
  }

  async sanityCheck(): Promise<SanityCheckResults> {
    const note = await this.extension.wsUtils.getActiveNote();
    if (!note) {
      return "You need to have a note open to merge.";
    }
    return;
  }

  async gatherInputs(opts: CommandOpts): Promise<CommandOpts | undefined> {
    const lc = this.createLookupController();
    const activeNote = await this.extension.wsUtils.getActiveNote();
    const provider = this.createLookupProvider({
      activeNote,
    });
    return new Promise((resolve) => {
      let disposable: vscode.Disposable;
      NoteLookupProviderUtils.subscribe({
        id: this.key,
        controller: lc,
        logger: this.L,
        onDone: async (event: HistoryEvent) => {
          const data: NoteLookupProviderSuccessResp = event.data;
          await this.prepareProxyMetricPayload({
            sourceNote: activeNote,
            destNote: data.selectedItems[0],
          });
          resolve({
            sourceNote: activeNote,
            destNote: data.selectedItems[0],
          });
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
      });
      const showOpts: CreateQuickPickOpts & {
        nonInteractive?: boolean | undefined;
        initialValue?: string | undefined;
        provider: ILookupProviderV3;
      } = {
        title: "Select merge destination note",
        placeholder: "note",
        provider,
      };
      if (opts?.dest) {
        showOpts.initialValue = opts.dest;
      }
      if (opts?.noConfirm) {
        showOpts.nonInteractive = opts.noConfirm;
      }
      lc.show(showOpts);

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

  private async prepareProxyMetricPayload(opts: {
    sourceNote: NoteProps | undefined;
    destNote: NoteProps | undefined;
  }) {
    const ctx = `${this.key}:prepareProxyMetricPayload`;
    const { sourceNote, destNote } = opts;
    if (sourceNote === undefined || destNote === undefined) {
      // source or dest note undefined, this could be from cancellation.
      // just return.
      return;
    }
    const sourceBasicStats = StatisticsUtils.getBasicStatsFromNotes([
      sourceNote,
    ]);
    const destBasicStats = StatisticsUtils.getBasicStatsFromNotes([destNote]);
    if (sourceBasicStats === undefined || destBasicStats === undefined) {
      this.L.error({ ctx, message: "failed to get basic stats from notes." });
      return;
    }

    const { numChildren, numLinks, numChars, noteDepth } = sourceBasicStats;
    const {
      numChildren: destNumChildren,
      numLinks: destNumLinks,
      numChars: destNumChars,
      noteDepth: destNoteDepth,
    } = destBasicStats;

    const sourceTraits = sourceNote.traits;
    const destTraits = destNote.traits;

    const engine = this.extension.getEngine();
    this._proxyMetricPayload = {
      command: this.key,
      numVaults: engine.vaults.length,
      numChildren,
      numLinks,
      numChars,
      noteDepth,
      traits: sourceTraits || [],
      extra: {
        destNumChildren,
        destNumLinks,
        destNumChars,
        destNoteDepth,
        destTraits: destTraits || [],
      },
    };
  }

  /**
   * Given a source note and destination note,
   * append the entire body of source note to the destination note.
   * @param sourceNote Source note
   * @param destNote Dest note
   */
  private async appendNote(opts: {
    sourceNote: NoteProps;
    destNote: NoteProps;
  }) {
    const { sourceNote, destNote } = opts;
    // grab body from current active note
    const appendPayload = sourceNote.body;

    // append to end
    const destBody = destNote.body;
    const newBody = `${destBody}\n---\n\n# ${sourceNote.title}\n\n${appendPayload}`;
    destNote.body = newBody;
    const writeResp = await this.extension.getEngine().writeNote(destNote);
    if (!writeResp.error) {
      return writeResp.data || [];
    } else {
      this.L.error(writeResp.error);
      return [];
    }
  }

  /**
   * Helper for {@link updateBacklinks}.
   * Given a note id, source and dest note,
   * Find all links in note with id that points to source
   * and update it to point to dest instead.
   * @param opts
   */
  private async updateLinkInNote(opts: {
    id: string;
    sourceNote: NoteProps;
    destNote: NoteProps;
  }) {
    const ctx = `${this.key}:updateLinkInNote`;
    const { id, sourceNote, destNote } = opts;
    const engine = this.extension.getEngine();
    const getNoteResp = await engine.getNote(id);
    if (getNoteResp.error) {
      throw getNoteResp.error;
    }
    const noteToUpdate = getNoteResp.data;
    if (noteToUpdate !== undefined) {
      const linksToUpdate = noteToUpdate.links
        .filter((link) => link.value === sourceNote.fname)
        .map((link) => LinkUtils.dlink2DNoteLink(link));

      const resp = await LinkUtils.updateLinksInNote({
        linksToUpdate,
        note: noteToUpdate,
        destNote,
        engine,
      });

      if (resp.data) {
        return resp.data;
      } else {
        // We specifically filtered for notes that do have some links to update,
        // so this is very unlikely to be reached.
        // Gracefully handle and log error
        this.L.error({ ctx, message: "No links found to update" });
        return [];
      }
    }
    // Note to update wasn't found
    // this will likely never happen given a sound engine state.
    // Log this as a canary for the engine state, and gracefully return.
    this.L.error({ ctx, message: "No note found" });
    return [];
  }

  /**
   * Given a source note and dest note,
   * Look at all the backlinks source note has, and update them
   * to point to the dest note.
   * @param sourceNote Source note
   * @param destNote Dest note
   */
  private async updateBacklinks(opts: {
    sourceNote: NoteProps;
    destNote: NoteProps;
  }) {
    const ctx = "MergeNoteCommand:updateBacklinks";
    const { sourceNote, destNote } = opts;

    // grab all backlinks from source note
    const sourceBacklinks = sourceNote.links.filter((link) => {
      return link.type === "backlink";
    });

    // scrub through the backlinks and all notes that need to be updated
    const noteIDsToUpdate = Array.from(
      new Set(
        sourceBacklinks
          .map((backlink) => backlink.from.id)
          .filter((ent): ent is string => ent !== undefined)
      )
    );

    // for each note that needs to be updated,
    // find all links that need to be updated from end to front.
    // then update them.
    let noteChangeEntries: NoteChangeEntry[] = [];
    await asyncLoop(noteIDsToUpdate, async (id) => {
      try {
        const changed = await this.updateLinkInNote({
          sourceNote,
          destNote,
          id,
        });
        noteChangeEntries = noteChangeEntries.concat(changed);
      } catch (error) {
        this.L.error({ ctx, error });
      }
    });
    return noteChangeEntries;
  }

  /**
   * Given a source note, delete it
   * @param sourceNote source note
   */
  private async deleteSource(opts: { sourceNote: NoteProps }) {
    const ctx = `${this.key}:deleteSource`;
    const { sourceNote } = opts;
    try {
      const deleteResp = await this.extension
        .getEngine()
        .deleteNote(sourceNote.id);
      if (deleteResp.data) {
        return deleteResp.data;
      } else {
        // This is very unlikely given a sound engine state.
        // log it and gracefully return
        return [];
      }
    } catch (error) {
      this.L.error({ ctx, error });
      return [];
    }
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "MergeNoteCommand";
    this.L.info({ ctx, msg: "execute" });
    const { sourceNote, destNote } = opts;

    if (destNote === undefined) {
      vscode.window.showWarningMessage("Merge destination not selected");
      return {
        ...opts,
        changed: [],
      };
    }

    // opts.notes should always have at most one element since we don't allow multiple destinations.
    if (sourceNote === undefined) {
      return {
        ...opts,
        changed: [],
      };
    }

    const appendNoteChanges = await this.appendNote({ sourceNote, destNote });
    const updateBacklinksChanges = await this.updateBacklinks({
      sourceNote,
      destNote,
    });
    const deleteSourceChanges = await this.deleteSource({ sourceNote });

    const noteChangeEntries = [
      ...appendNoteChanges,
      ...updateBacklinksChanges,
      ...deleteSourceChanges,
    ];

    // close the source note
    await VSCodeUtils.closeCurrentFileEditor();

    // open the destination note
    await this.extension.wsUtils.openNote(destNote);

    return {
      ...opts,
      changed: noteChangeEntries,
    };
  }

  addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput) {
    const noteChangeEntryCounts =
      out !== undefined
        ? { ...extractNoteChangeEntryCounts(out.changed) }
        : {
            createdCount: 0,
            updatedCount: 0,
            deletedCount: 0,
          };
    try {
      this.trackProxyMetrics({ noteChangeEntryCounts });
    } catch (error) {
      this.L.error({ error });
    }

    return noteChangeEntryCounts;
  }

  trackProxyMetrics({
    noteChangeEntryCounts,
  }: {
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
      },
    });
  }
}
