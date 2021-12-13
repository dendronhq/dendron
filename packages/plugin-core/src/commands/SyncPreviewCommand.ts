import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { VSCodeUtils } from "../vsCodeUtils";
import * as vscode from "vscode";
import { TextEditor } from "vscode";
import { Logger } from "../logger";
import { UI_SHOW_PREVIEW_CMD } from "./ShowPreview";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

const ctx = `SyncPreviewCommand`;

export class ScrollSyncUtil {
  // https://regex101.com/r/zI1Qdy/1
  static headerDetectorRegEx = new RegExp("^##* ");

  // https://regex101.com/r/wjwqXm/1
  static listStarDetectorRegEx = new RegExp("^\\s*\\*\\s");

  static replaceTextForMatch(text: string): string {
    if (this.headerDetectorRegEx.test(text)) {
      // Example '# header-val'. We want to take value after the space
      return text.substring(text.indexOf(" ") + 1);
    } else if (this.listStarDetectorRegEx.test(text)) {
      // We want the space after the star to be our starting point
      return text.substring(text.indexOf("*") + 2);
    }
    return text;
  }
}

export class EditorToPreviewSyncer {
  static async sync(editor: TextEditor) {
    if (UI_SHOW_PREVIEW_CMD === undefined) return;

    Logger.info({ ctx, msg: `Activated editor to Preview sync.` });

    const currentCursor = editor.selection.active;

    const cursorLine = editor.document.lineAt(currentCursor.line);
    const textRange = new vscode.Range(
      cursorLine.range.start,
      cursorLine.range.end
    );
    const cleanedText = ScrollSyncUtil.replaceTextForMatch(
      editor.document.getText(textRange)
    );

    // We should find our element at least once which would increment the offset to 0
    let elementOffset = -1;
    for (let i = 0; i <= currentCursor.line; i += 1) {
      // Find out how many matches for the given text content exist in
      // in the document so we can figure out which of the element to
      // take within the HTML preview.
      const textLine = editor.document.lineAt(i);

      if (textLine.text.includes(cleanedText)) {
        elementOffset += 1;
      }
    }

    if (elementOffset === -1) {
      Logger.warn({
        msg: `'cleanText' must have not matched up with original element setting offset to '0'`,
      });
      elementOffset = 0;
    }

    console.log(
      `Scroll sync activated text: '${cleanedText}', offset: '${elementOffset}'`
    );

    await UI_SHOW_PREVIEW_CMD.syncEditorToPreviewPlacement(
      cleanedText,
      elementOffset
    );
  }
}

export class SyncPreviewCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SYNC_PREVIEW.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute() {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor !== undefined) {
      await EditorToPreviewSyncer.sync(editor);
    }
  }
}
