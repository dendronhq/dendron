import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { PreviewProxy } from "../components/views/PreviewProxy";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { InputArgCommand } from "./base";
import {
  ShowPreviewCommandOpts,
  ShowPreviewCommandOutput,
} from "./ShowPreviewInterface";

/**
 * Command to show the preview. If the desire is to programmatically show the
 * preview webview, then prefer to get an instance of {@link PreviewProxy}
 * instead of creating an instance of this command.
 */
export class ShowPreviewCommand extends InputArgCommand<
  ShowPreviewCommandOpts,
  ShowPreviewCommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_PREVIEW.key;

  _panel: PreviewProxy;
  constructor(previewPanel: PreviewProxy) {
    super();
    this._panel = previewPanel;
  }

  async sanityCheck(opts?: ShowPreviewCommandOpts) {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor()) && _.isEmpty(opts)) {
      return "No note currently open, and no note selected to open.";
    }
    return;
  }

  addAnalyticsPayload(opts?: ShowPreviewCommandOpts) {
    return { providedFile: !_.isEmpty(opts) };
  }

  /**
   *
   * @param opts if a Uri is defined through this parameter, then that Uri will
   * be shown in preview. If unspecified, then preview will follow default
   * behavior of showing the contents of the currently in-focus Dendron note.
   */
  async execute(opts?: ShowPreviewCommandOpts) {
    let note: NoteProps | undefined;

    if (opts !== undefined && !_.isEmpty(opts)) {
      // Used a context menu to open preview for a specific note
      note = ExtensionProvider.getWSUtils().getNoteFromPath(opts.fsPath);
    } else {
      // Used the command bar or keyboard shortcut to open preview for active note
      note = ExtensionProvider.getWSUtils().getActiveNote();
    }
    this._panel.show();

    if (note) {
      this._panel.show(note);
      return { note };
    } else if (opts?.fsPath) {
      const fsPath = opts.fsPath;
      // We can't find the note, so this is not in the Dendron workspace.
      // Preview the file anyway if it's a markdown file.
      await this.openFileInPreview(fsPath);
      return { fsPath };
    } else {
      // Not file selected for preview, default to open file
      const editor = VSCodeUtils.getActiveTextEditor();
      if (editor) {
        const fsPath = editor.document.uri.fsPath;
        await this.openFileInPreview(fsPath);
        return { fsPath };
      }
    }
    return undefined;
  }

  /**
   * Show a file in the preview. Only use this for files that are not notes,
   * like a markdown file outside any vault.
   * @param filePath
   * @returns
   */
  private async openFileInPreview(filePath: string) {
    // Only preview markdown files
    if (path.extname(filePath) !== ".md") return;
    const { wsRoot } = ExtensionProvider.getDWorkspace();
    // If the file is already open in an editor, get the text from there to make
    // sure we have an up-to-date view in case changes are not persisted yet
    const openFile =
      ExtensionProvider.getWSUtils().getMatchingTextDocument(filePath);
    const contents =
      openFile && !openFile.isClosed
        ? openFile.getText()
        : await fs.readFile(filePath, { encoding: "utf-8" });
    const dummyFileNote = NoteUtils.createForFile({
      filePath,
      wsRoot,
      contents,
    });

    this._panel.show(dummyFileNote);
  }
}
