import {
  NoteProps,
  RefactoringCommandUsedPayload,
  StatisticsUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import * as vscode from "vscode";
import { EditorUtils } from "../utils/editor";
import {
  ILookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3Interface";
import { SelectionExtractBtn } from "../components/lookup/buttons";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { RemarkUtils } from "@dendronhq/unified";
import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";

type CommandInput = {
  dest?: string;
  noConfirm?: boolean;
};

type CommandOpts = {} & CommandInput;

type CommandOutput = {} & CommandOpts;

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

  private async prepareProxyMetricPayload(opts: {
    sourceNote: NoteProps | undefined;
    selection: vscode.Selection | undefined;
    selectionText: string | undefined;
  }) {
    const ctx = `${this.key}:prepareProxyMetricPayload`;
    const engine = this.extension.getEngine();
    const { sourceNote, selection, selectionText } = opts;
    if (
      sourceNote === undefined ||
      selection === undefined ||
      selectionText === undefined
    ) {
      return;
    }

    const basicStats = StatisticsUtils.getBasicStatsFromNotes([sourceNote]);
    if (basicStats === undefined) {
      this.L.error({ ctx, message: "failed to get basic states from note" });
      return;
    }

    const { numChildren, numLinks, numChars, noteDepth } = basicStats;

    this._proxyMetricPayload = {
      command: this.key,
      numVaults: engine.vaults.length,
      traits: sourceNote.traits || [],
      numChildren,
      numLinks,
      numChars,
      noteDepth,
      extra: {
        numSelectionChars: selectionText.length,
        numSelectionAnchors: RemarkUtils.findAnchors(selectionText).length,
      },
    };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const lookupCmd = AutoCompletableRegistrar.getNoteLookupCmd();
    const controller = this.createLookupController();
    const activeNote = this.extension.wsUtils.getActiveNote();
    const { selection, text: selectionText } = VSCodeUtils.getSelection();
    await this.prepareProxyMetricPayload({
      sourceNote: activeNote,
      selection,
      selectionText,
    });
    this.trackProxyMetrics();
    const provider = this.createLookupProvider({ activeNote });
    lookupCmd.controller = controller;
    lookupCmd.provider = provider;
    await lookupCmd.run();

    return opts;
  }

  trackProxyMetrics() {
    if (this._proxyMetricPayload === undefined) {
      // something went wrong during prep. don't track.
      return;
    }
    const { extra, ...props } = this._proxyMetricPayload;

    ProxyMetricUtils.trackRefactoringProxyMetric({
      props,
      extra: {
        ...extra,
      },
    });
  }
}
