import {
  // extractNoteChangeEntryCounts,
  NoteChangeEntry,
  NoteProps,
  RefactoringCommandUsedPayload,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import * as vscode from "vscode";
import { EditorUtils } from "../utils/editor";
import {
  // CreateQuickPickOpts,
  ILookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3Interface";
// import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";
import { SelectionExtractBtn } from "../components/lookup/buttons";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";

type CommandInput = {
  dest?: string;
  noConfirm?: boolean;
};

type CommandOpts = {
  sourceNote: NoteProps | undefined;
  destNote: NoteProps | undefined;
  sourceSelections: vscode.Selection[] | undefined;
} & CommandInput;

type CommandOutput = {
  changed: NoteChangeEntry[];
} & CommandOpts;

export class MoveToCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.MOVE_TO.key;
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

  async sanityCheck() {
    const activeTextEditor = VSCodeUtils.getActiveTextEditor();
    const noNoteOpenMessage =
      "You need to have a note open to use this command.";
    const allEmptySelectionMessage =
      "All selections are empty. Please selection the text to move.";
    const someEmptySelectionMessage =
      "There are some empty selections. They will not be moved.";
    const selectionContainsFrontmatterMessage =
      "Selection contains frontmatter. Please only select the body of the note.";

    // needs active text editor
    if (activeTextEditor) {
      const activeNote = this.extension.wsUtils.getNoteFromDocument(
        activeTextEditor?.document
      );

      // needs active note
      if (activeNote === undefined) {
        return noNoteOpenMessage;
      } else {
        const { selections } = activeTextEditor;

        // need at least one non-empty selection
        const numEmpty = selections.filter((selection) => {
          return selection.isEmpty;
        }).length;
        if (numEmpty === selections.length) {
          return allEmptySelectionMessage;
        }
        if (numEmpty > 0 && numEmpty < selections.length) {
          vscode.window.showWarningMessage(someEmptySelectionMessage);
        }

        // selection shouldn't contain frontmatter
        const selectionContainsFrontmatter =
          await EditorUtils.selectionContainsFrontmatter({
            editor: activeTextEditor,
          });
        if (selectionContainsFrontmatter) {
          return selectionContainsFrontmatterMessage;
        }
      }
    } else {
      return noNoteOpenMessage;
    }

    return;
  }

  private createLookupController(): ILookupControllerV3 {
    const opts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: true,
      extraButtons: [
        SelectionExtractBtn.create({ pressed: true, canToggle: false }),
      ],
      title: "Move To...",
    };
    const controller = this.extension.lookupControllerFactory.create(opts);
    return controller;
  }

  private createLookupProvider(opts: { activeNote: NoteProps | undefined }) {
    const { activeNote } = opts;
    return this.extension.noteLookupProviderFactory.create(this.key, {
      allowNewNote: true,
      noHidePickerOnAccept: false,
      preAcceptValidators: [
        // disallow accepting the currently active note from the picker.
        (selectedItems) => {
          const maybeActiveNoteItem = selectedItems.find((item) => {
            return item.id === activeNote?.id;
          });
          if (maybeActiveNoteItem) {
            vscode.window.showErrorMessage(
              "You cannot move selection to the current note."
            );
          }
          return !maybeActiveNoteItem;
        },
      ],
    });
  }

  // TODO: add anayltics
  // private async prepareProxyMetricPayload(opts: {
  //   sourceNote: NoteProps | undefined;
  //   destNote: NoteProps | undefined;
  // }) {
  //   // const ctx = `${this.key}:prepareProxyMetricPayload`;
  //   const { sourceNote, destNote } = opts;
  //   if (sourceNote === undefined || destNote === undefined) {
  //     return;
  //   }
  // }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const lookupCmd = AutoCompletableRegistrar.getNoteLookupCmd();
    const controller = this.createLookupController();
    const activeNote = this.extension.wsUtils.getActiveNote();
    const provider = this.createLookupProvider({ activeNote });
    lookupCmd.controller = controller;
    lookupCmd.provider = provider;
    await lookupCmd.run();

    return { ...opts, changed: [] };
  }

  // TODO: add analytics
  // Currently selectionExtract doesn't correctly emit note change events
  // and note lookup doesn't track note change events at all
  //
  // addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput) {
  //   const noteChangeEntryCounts =
  //     out !== undefined
  //       ? { ...extractNoteChangeEntryCounts(out.changed) }
  //       : {
  //           createdCount: 0,
  //           updatedCount: 0,
  //           deletedCount: 0,
  //         };

  //   try {
  //     this.trackProxyMetrics({ noteChangeEntryCounts });
  //   } catch (error) {
  //     this.L.error({ error });
  //   }

  //   return noteChangeEntryCounts;
  // }

  // trackProxyMetrics({
  //   noteChangeEntryCounts,
  // }: {
  //   noteChangeEntryCounts: {
  //     createdCount: number;
  //     deletedCount: number;
  //     updatedCount: number;
  //   };
  // }) {
  //   if (this._proxyMetricPayload === undefined) {
  //     // something went wrong during prep. don't track.
  //     return;
  //   }
  //   const { extra, ...props } = this._proxyMetricPayload;

  //   ProxyMetricUtils.trackRefactoringProxyMetric({
  //     props,
  //     extra: {
  //       ...extra,
  //       ...noteChangeEntryCounts,
  //     },
  //   });
  // }
}
