import _ from "lodash";
import { env, window } from "vscode";
import { WSUtilsWeb } from "../utils/WSUtils";
import { SiteUtilsWeb } from "../utils/site";
import { injectable } from "tsyringe";

@injectable()
export class CopyNoteURLCmd {
  constructor(private wsUtils: WSUtilsWeb, private siteUtils?: SiteUtilsWeb) {}

  static key = "dendron.copyNoteURL";

  async showFeedback(link: string) {
    window.showInformationMessage(`${link} copied`);
  }

  async run() {
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
    const link = this.siteUtils?.getNoteUrl({
      note: notes[0],
      vault,
    });
    if (link) {
      this.showFeedback(link);
      env.clipboard.writeText(link);
    }
    return link;
  }
}
