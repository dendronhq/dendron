import clipboardy from "@dendronhq/clipboardy";
import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { TextEditor, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { getHeaderFromSelection } from "../utils/editor";
import { getEngine } from "../workspace";
import { BasicCommand } from "./base";
const ogs = require("open-graph-scraper");
type CommandOpts = {};
type CommandOutput = string;

export class PasteLinkCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.PASTE_LINK.key;
  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async showFeedback(link: string) {
    window.showInformationMessage(`${link} copied`);
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const fname = NoteUtilsV2.uri2Fname(editor.document.uri);
    let note: NotePropsV2;

    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    note = NoteUtilsV2.getNoteByFnameV4({
      fname,
      vault,
      notes: getEngine().notes,
    }) as NotePropsV2;
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }
    // read from clipboard
    const url = clipboardy.readSync();

    // use open graph to scrape metadata
    const options = { url: url };
    return this.scrape(options, editor, function (result: string) {
      return result;
    });
  }

  scrape(options, editor, callback) {
    return ogs(options, (error, results, response) => {
      if (error) {
        this.showFeedback("invalid url");
        return callback("error");
      }
      const { ogUrl, ogSiteName, ogTitle, ogDescription, ogImage } = results;
      try {
        const metaData = `[${ogTitle}](${ogUrl})`;
        editor.edit((selectedText) => {
          selectedText.replace(editor.selection, metaData);
        });
        return callback(metaData);
      } catch (err) {
        this.L.error({ err });
        return callback(err);
      }
    });
  }
}
