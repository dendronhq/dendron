import { RefactoringCommandUsedPayload } from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import * as vscode from "vscode";

type CommandInput = {};
type CommandOpts = {};
type CommandOutput = {};

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
    // TODO: needs to have an active note open and a non-empty selection present
    const activeTextEditor = VSCodeUtils.getActiveTextEditor();
    const noNoteOpenMessage =
      "You need to have a note open to use this command.";
    const allEmptySelectionMessage =
      "All selections are empty. Please selection the text to move.";
    const someEmptySelectionMessage =
      "There are some empty selections. They will not be moved.";
    if (activeTextEditor) {
      const activeNote = this.extension.wsUtils.getNoteFromDocument(
        activeTextEditor?.document
      );
      if (activeNote === undefined) {
        return noNoteOpenMessage;
      } else {
        const { selections } = activeTextEditor;
        // count empty selections and warn appropriately
        const numEmpty = selections.filter((selection) => {
          return selection.isEmpty;
        }).length;
        if (numEmpty === selections.length) {
          return allEmptySelectionMessage;
        }
        if (numEmpty > 0 && numEmpty < selections.length) {
          vscode.window.showWarningMessage(someEmptySelectionMessage);
        }

        // make sure selection doesn't contain part of the frontmatter
      }
    } else {
      return noNoteOpenMessage;
    }

    return;
  }

  async gatherInputs(_opts?: CommandOpts): Promise<CommandInput | undefined> {
    // create a lookup that lets you select where to move the selection
    return;
  }

  // private async prepareProxyMetricPayload() {}

  async execute(_opts: CommandOpts): Promise<CommandOutput> {
    const ctx = `${this.key}:execute`;
    console.log({ ctx });
    return {};
  }

  // trackProxyMetrics() {}

  // addAnalyticsPayload(opts: CommandOpts, out: CommandOutput) {

  // }
}
