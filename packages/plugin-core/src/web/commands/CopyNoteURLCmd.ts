import _ from "lodash";
import { env, window, workspace } from "vscode";
import { injectable, inject } from "tsyringe";
import { WSUtilsWeb } from "../utils/WSUtils";

@injectable()
export class CopyNoteURLCmd {
  constructor(
    private wsUtils: WSUtilsWeb,
    @inject("siteUrl") private siteUrl?: string
  ) {}

  static key = "dendron.copyNoteURL";

  async showFeedback(link: string) {
    window.showInformationMessage(`${link} copied`);
  }

  async run() {
    const urlRoot =
      this.siteUrl ||
      workspace.getConfiguration().get("dendron.copyNoteUrlRoot");
    const maybeTextEditor = window.activeTextEditor;

    if (_.isUndefined(maybeTextEditor)) {
      window.showErrorMessage("no active document found");
      return;
    }
    const vault = this.wsUtils.getVaultFromDocument(maybeTextEditor.document);
    const notes = await this.wsUtils.getNoteFromDocument(
      maybeTextEditor.document
    );
    if (!notes || notes.length !== 1) {
      window.showErrorMessage("You need to be in a note to use this command");
      return;
    }
    const link = this.wsUtils.getNoteUrl({
      note: notes[0],
      vault,
      urlRoot,
    });

    this.showFeedback(link);
    env.clipboard.writeText(link);
    return link;
  }
}
