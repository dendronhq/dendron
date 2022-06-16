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
 * Command to show the Release Notes webview
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

  /**
   *
   * @param opts if a Uri is defined through this parameter, then that Uri will
   * be shown in preview. Otherwise, show the hard-coded release notes markdown
   * file. (This can be cleaned up later)
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

  private async openFileInPreview(filePath: string) {
    const { wsRoot } = ExtensionProvider.getDWorkspace();
    const contents = await fs.readFile(filePath, { encoding: "utf-8" });
    const dummyFileNote = NoteUtils.createForFile({
      filePath,
      wsRoot,
      contents,
    });

    // Tmp Override
    dummyFileNote.title = "Release Notes 0.100.0";

    await this._panel.show(dummyFileNote);
  }
}
