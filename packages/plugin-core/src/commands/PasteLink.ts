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
    var meta = "";
    ogs(options)
      .then((data) => {
        const { error, result } = data;
        const { ogUrl, ogSiteName, ogTitle, ogDescription, ogImage } = result;

        // format text and replace formatted text with selected text/line
        try {
          // window.showInformationMessage(`${link} copied`);
          // const metaData = `Link: ${ogUrl}\n\nSite Name: ${ogSiteName}\n\nTitle: ${ogTitle}\n\nDecription: ${ogDescription}`
          const metaData = `[${ogTitle}](${ogUrl})`;
          // changed selected text
          editor.edit((selectedText) => {
            selectedText.replace(editor.selection, metaData);
          });
          // catch potential errors
        } catch (err) {
          this.L.error({ err });
          throw err;
        }
      })
      .then(undefined, (err) => {
        // catch errors with open graph
        this.showFeedback("Error: Invalid URL");
        console.error("Not valid url");
      });

    return "success";
  }
}
