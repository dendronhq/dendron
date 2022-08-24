import * as _ from "lodash";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import { URI } from "vscode-uri";
import { TogglePreviewCommandOpts } from "../../commands/ShowPreviewInterface";
import { type PreviewProxy } from "../../components/views/PreviewProxy";
import { DENDRON_COMMANDS } from "../../constants";
import { WSUtilsWeb } from "../utils/WSUtils";

/**
 * Command to show the preview. If the desire is to programmatically show the
 * preview webview, then prefer to get an instance of {@link PreviewProxy}
 * instead of creating an instance of this command.
 */
@injectable()
export class TogglePreviewCmd {
  key = DENDRON_COMMANDS.TOGGLE_PREVIEW.key;
  _panel: PreviewProxy;

  // This class is used for both ShowPreview and TogglePreview commands.
  // Pass true for isShowCommand param to use this class for Show Preview command
  // By default, this class is used for TogglePreview
  constructor(
    @inject("PreviewProxy") previewPanel: PreviewProxy,
    @inject("wsRoot") private wsRoot: URI, // This will be needed later for openFile functionality, don't remove yet.
    private wsUtils: WSUtilsWeb
  ) {
    console.log(this.wsRoot); // TODO: Remove
    this._panel = previewPanel;
  }

  async run() {
    if (!this.shouldShowPreview()) {
      return;
    }

    // let note: NoteProps | undefined;

    // Hide (dispose) the previwe panel when it's already visible
    if (this._panel.isVisible()) {
      this._panel.hide();
      return undefined;
    }

    const note = await this.wsUtils.getActiveNote();

    await this._panel.show();

    if (note) {
      await this._panel.show(note);
      return { note };
      // } else if (opts?.fsPath) {
      //   const fsPath = opts.fsPath;
      //   // We can't find the note, so this is not in the Dendron workspace.
      //   // Preview the file anyway if it's a markdown file.
      //   await this.openFileInPreview(fsPath);
      //   return { fsPath };
    }
    // TODO: Add back open file functionality
    // else {
    //   // Not file selected for preview, default to open file
    //   const editor = vscode.window.activeTextEditor;
    //   if (editor) {
    //     const fsPath = editor.document.uri.fsPath;
    //     await this.openFileInPreview(fsPath);
    //     return { fsPath };
    //   }
    // }
    return undefined;
  }

  shouldShowPreview(opts?: TogglePreviewCommandOpts): boolean {
    return !(
      _.isUndefined(vscode.window.activeTextEditor) &&
      _.isEmpty(opts) &&
      !this._panel.isVisible()
    );
  }

  // addAnalyticsPayload(opts?: TogglePreviewCommandOpts) {
  //   return { providedFile: !_.isEmpty(opts) };
  // }

  /**
   *
   * @param opts if a Uri is defined through this parameter, then that Uri will
   * be shown in preview. If unspecified, then preview will follow default
   * behavior of showing the contents of the currently in-focus Dendron note.
   */
  // async execute() {}

  /**
   * Show a file in the preview. Only use this for files that are not notes,
   * like a markdown file outside any vault.
   * @param filePath
   * @returns
   */
  // private async openFileInPreview(filePath: string) {
  //   // Only preview markdown files
  //   if (path.extname(filePath) !== ".md") return;
  //   // const { wsRoot } = ExtensionProvider.getDWorkspace();
  //   // If the file is already open in an editor, get the text from there to make
  //   // sure we have an up-to-date view in case changes are not persisted yet
  //   const openFile =
  //     ExtensionProvider.getWSUtils().getMatchingTextDocument(filePath);
  //   const contents =
  //     openFile && !openFile.isClosed
  //       ? openFile.getText()
  //       : await fs.readFile(filePath, { encoding: "utf-8" });
  //   const dummyFileNote = NoteUtils.createForFile({
  //     filePath,
  //     wsRoot: this.wsRoot,
  //     contents,
  //   });

  //   await this._panel.show(dummyFileNote);
  // }
}
