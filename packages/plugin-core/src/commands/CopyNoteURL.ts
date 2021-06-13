import { getSlugger, isBlockAnchor, NoteProps } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Selection, window } from "vscode";
import { CONFIG, DENDRON_COMMANDS } from "../constants";
import { clipboard, VSCodeUtils } from "../utils";
import { getAnchorAt } from "../utils/editor";
import { DendronWorkspace, getWS, getEngine } from "../workspace";
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

    let note: NoteProps | undefined;
    const engine = getEngine();
    note = _.find(engine.notes, { fname });
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }

    let link = [root, notePrefix, note.id + ".html"].join("/");

    // add the anchor if one is selected and exists
    const { selection, editor } = VSCodeUtils.getSelection();
    if (selection) {
      const anchor = getAnchorAt({
        editor: editor!,
        position: selection.start,
        engine,
      });
      if (anchor) {
        if (!isBlockAnchor(anchor)) {
          link += `#${getSlugger().slug(anchor)}`;
        } else {
          link += `#${anchor}`;
        }
      }
    }

    this.showFeedback(link);
    clipboard.writeText(link);
    return link;
  }
}
