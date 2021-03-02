import _ from "lodash";
import ogs from "open-graph-scraper";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { clipboard, getOpenGraphMetadata, VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

// Command based on copying CopyNoteRef.ts
export class PasteLinkCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.PASTE_LINK.key;
  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async showFeedback(formattedLink: string) {
    window.showInformationMessage(`Wrote ${formattedLink} to note`);
  }

  getFormattedLinkFromOpenGraphResult(
    result: ogs.SuccessResult["result"],
    url: string
  ) {
    // Check whichever field has non falsy info
    const title =
      (result.ogTitle ?? result.twitterTitle ?? result.dcTitle) || url;
    return title ? `[${title}](${url})` : `<${url}>`;
  }

  async execute(_opts: CommandOpts) {
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (maybeTextEditor === undefined) return "";

    const textEditor = maybeTextEditor;

    // First, get web address from clipboard
    let url = "";
    try {
      url = await clipboard.readText().then((r) => r.trim());
    } catch (err) {
      this.L.error({ err, url });
      throw err;
    }

    // Second: get metadata + put into a markdown string.
    let formattedLink = `<${url}>`;
    try {
      const data = await getOpenGraphMetadata({ url });
      // Third: combine metadata with markdown
      if (!data.error) {
        formattedLink = this.getFormattedLinkFromOpenGraphResult(
          data.result,
          url
        );
      }
    } catch (err) {
      this.L.debug(
        "Your clipboard did not contain a valid web address, or your internet connection may not be working"
      );
      this.L.error({ err });
    }

    // Fourth: write string back out to VScode
    // Get current Position: https://github.com/microsoft/vscode/issues/111
    // Write text to document with Edit Builder: https://github.com/Microsoft/vscode-extension-samples/tree/main/document-editing-sample
    const position = textEditor.selection.active;
    textEditor.edit((eb) => {
      eb.insert(position, formattedLink);
    });

    this.showFeedback(formattedLink);

    // The return is used for testing, but not by the main app.
    return formattedLink;
  }
}
