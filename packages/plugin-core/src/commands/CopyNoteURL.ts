import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { Selection, window } from "vscode";
import { CONFIG, DENDRON_COMMANDS } from "../constants";
import { clipboard, VSCodeUtils } from "../utils";
import { getAnchorAt } from "../utils/editor";
import { DendronWorkspace, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = string | undefined;

export class CopyNoteURLCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.COPY_NOTE_URL.key;
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
    const config = getDWorkspace().config;
    const urlRoot =
      config?.site?.siteUrl ||
      DendronWorkspace.configuration().get<string>(
        CONFIG.COPY_NOTE_URL_ROOT.key
      );
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();

    if (_.isUndefined(maybeTextEditor)) {
      window.showErrorMessage("no active document found");
      return;
    }
    const vault = VSCodeUtils.getVaultFromDocument(maybeTextEditor.document);

    const maybeNote = VSCodeUtils.getNoteFromDocument(maybeTextEditor.document);
    if (_.isUndefined(maybeNote)) {
      window.showErrorMessage("You need to be in a note to use this command");
      return;
    }
    const fname = path.basename(maybeTextEditor.document.uri.fsPath, ".md");
    const engine = getDWorkspace().engine;
    const note = _.find(engine.notes, { fname });
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }

    // add the anchor if one is selected and exists
    const { selection, editor } = VSCodeUtils.getSelection();
    let anchor;
    if (selection) {
      anchor = getAnchorAt({
        editor: editor!,
        position: selection.start,
        engine,
      });
    }

    const link = WorkspaceUtils.getNoteUrl({
      config,
      note,
      vault,
      urlRoot,
      anchor,
    });

    this.showFeedback(link);
    clipboard.writeText(link);
    return link;
  }
}
