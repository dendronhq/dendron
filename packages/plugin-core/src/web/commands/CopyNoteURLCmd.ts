import _ from "lodash";
import { env, window } from "vscode";
import { WSUtilsWeb } from "../utils/WSUtils";
import { SiteUtilsWeb } from "../utils/SiteUtilsWeb";
import { inject, injectable } from "tsyringe";
import { DENDRON_COMMANDS } from "../../constants";
import { type ITelemetryClient } from "../../telemetry/common/ITelemetryClient";

@injectable()
export class CopyNoteURLCmd {
  static key = DENDRON_COMMANDS.COPY_NOTE_URL.key;

  constructor(
    private wsUtils: WSUtilsWeb,
    @inject("ITelemetryClient") private _analytics: ITelemetryClient,
    private siteUtils?: SiteUtilsWeb
  ) {}

  async showFeedback(link: string) {
    window.showInformationMessage(`${link} copied`);
  }

  async run() {
    this._analytics.track(CopyNoteURLCmd.key);

    const maybeTextEditor = this.getActiveTextEditor();

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

  getActiveTextEditor(): any {
    return window.activeTextEditor;
  }
}
