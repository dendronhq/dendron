import { NoteUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
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
export class ShowReleaseNotesCommand extends InputArgCommand<
  ShowPreviewCommandOpts,
  ShowPreviewCommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_RELEASE_NOTES.key;

  _panel: PreviewProxy;
  constructor(changelogPanel: PreviewProxy) {
    super();
    this._panel = changelogPanel;
  }

  // async sanityCheck(opts?: ShowPreviewCommandOpts) {
  //   if (_.isEmpty(opts)) {
  //     return "No release note selected to open.";
  //   }
  //   return;
  // }

  // addAnalyticsPayload(opts?: ShowPreviewCommandOpts) {
  //   return { providedFile: !_.isEmpty(opts) };
  // }

  /**
   *
   * @param opts if a Uri is defined through this parameter, then that Uri will
   * be shown in preview. If unspecified, then preview will follow default
   * behavior of showing the contents of the currently in-focus Dendron note.
   */
  async execute(opts?: ShowPreviewCommandOpts) {
    let fsPath;
    if (_.isEmpty(opts) || !opts) {
      const uri = VSCodeUtils.joinPath(
        VSCodeUtils.getAssetUri(ExtensionProvider.getExtension().context),
        "dendron-ws",
        "vault",
        "v100.md"
      );

      fsPath = uri.fsPath;
    } else {
      fsPath = opts.fsPath;
    }

    await this.openFileInPreview(fsPath);
    return { fsPath };
  }

  /**
   * Show a file in the preview. Only use this for files that are not notes,
   * like a markdown file outside any vault.
   * @param filePath
   * @returns
   */
  private async openFileInPreview(filePath: string) {
    const { wsRoot } = ExtensionProvider.getDWorkspace();
    const contents = await fs.readFile(filePath, { encoding: "utf-8" });
    const dummyFileNote = NoteUtils.createForFile({
      filePath,
      wsRoot,
      contents,
    });

    await this._panel.show(dummyFileNote);
  }
}
