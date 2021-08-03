import _ from "lodash";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import path from "path";
import { Selection, window } from "vscode";
import { CONFIG, DENDRON_COMMANDS } from "../constants";
import { clipboard, VSCodeUtils } from "../utils";
import { getAnchorAt } from "../utils/editor";
import { DendronWorkspace, getEngine, getWS } from "../workspace";
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
    const config = getWS().config;
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

    const maybeNote = VSCodeUtils.getNoteFromDocument(
      maybeTextEditor.document
    );

    const fname = path.basename(maybeTextEditor.document.uri.fsPath, ".md");
    const engine = getEngine();
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
      maybeNote,
      anchor,
    });

    this.showFeedback(link);
    clipboard.writeText(link);
    return link;
  }
}
