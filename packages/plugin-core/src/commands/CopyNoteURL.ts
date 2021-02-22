import { getSlugger, NotePropsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Selection, window } from "vscode";
import { CONFIG, DENDRON_COMMANDS } from "../constants";
import { clipboard, VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = string | undefined;

export class CopyNoteURLCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.COPY_NOTE_URL.key;
  async gatherInputs(): Promise<any> {
    return {};
  }

  async showFeedback(link: string) {
    window.showInformationMessage(`${link} copied`);
  }

  isHeader(text: string, selection: Selection) {
    return text.startsWith("#") && selection.start.line === selection.end.line;
  }

  async execute() {
    const urlRoot =
      getWS().config?.site?.siteUrl ||
      DendronWorkspace.configuration().get<string>(
        CONFIG.COPY_NOTE_URL_ROOT.key
      );

    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (_.isUndefined(maybeTextEditor)) {
      window.showErrorMessage("no active document found");
      return;
    }
    let root = "";
    if (!_.isUndefined(urlRoot)) {
      root = urlRoot;
    } else {
      // assume github
      throw Error("not implemented");
    }
    const notePrefix = "notes";
    const fname = path.basename(maybeTextEditor.document.uri.fsPath, ".md");

    let note: NotePropsV2 | undefined;
    note = _.find(DendronWorkspace.instance().getEngine().notes, { fname });
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }

    let link = [root, notePrefix, note.id + ".html"].join("/");
    // check if selection is present
    const { text, selection } = VSCodeUtils.getSelection();
    if (!_.isUndefined(text) && !_.isEmpty(text)) {
      if (this.isHeader(text, selection as Selection)) {
        const slugger = getSlugger();
        const headerText = _.trim(text, " #");
        const slug = slugger.slug(headerText);
        link += `#${slug}`;
      }
    }
    this.showFeedback(link);
    clipboard.writeText(link);
    return link;
  }
}
