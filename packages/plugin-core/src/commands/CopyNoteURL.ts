import {
  DNodeUtils,
  getSlugger,
  isBlockAnchor,
  NoteProps,
} from "@dendronhq/common-all";
import _ from "lodash";
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
    const config = getWS().config;
    let urlRoot =
      config?.site?.siteUrl ||
      DendronWorkspace.configuration().get<string>(
        CONFIG.COPY_NOTE_URL_ROOT.key
      );
    /**
     * set to true if index node, don't append id at the end
     */
    let isIndex: boolean = false;

    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (_.isUndefined(maybeTextEditor)) {
      window.showErrorMessage("no active document found");
      return;
    }
    // check for url from seed
    const vault = VSCodeUtils.getVaultFromDocument(maybeTextEditor.document);
    if (vault.seed) {
      if (config.seeds && config.seeds[vault.seed]) {
        const maybeSite = config.seeds[vault.seed]?.site;
        if (maybeSite) {
          urlRoot = maybeSite.url;
          const maybeNote = VSCodeUtils.getNoteFromDocument(
            maybeTextEditor.document
          );
          if (!_.isUndefined(maybeNote)) {
            // if custom index is set, match against that, otherwise `root` is default index
            isIndex = maybeSite.index
              ? maybeNote.fname === maybeSite.index
              : DNodeUtils.isRoot(maybeNote);
          }
        }
      }
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

    let link = isIndex ? root : [root, notePrefix, note.id + ".html"].join("/");

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
