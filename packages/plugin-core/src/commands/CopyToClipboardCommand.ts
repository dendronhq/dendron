import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { clipboard } from "../utils";
import { InputArgCommand } from "./base";

export type CopyToClipboardCommandOpts = {
  text: string;
  source: CopyToClipboardSourceEnum;
  message?: string;
};

export enum CopyToClipboardSourceEnum {
  keybindingConflictPreview = "keybindingConflictPreview",
}

/**
 * This command is not accessible through the VSCode UI,
 * and only intended to be used as a proxy for copying arbitrary
 * text from the webview.
 *
 * e.g.)
 *
 * // you can use this in a markdown link to invoke commands
 * const commandUri = `command:dendron.copyToClipboard?${encodeURIComponent({
 *   text: "some text",
 *   message: "copied!"
 * })}`
 *
 * ...
 *
 * content = `[click this](${commandUri})`
 *
 */
export class CopyToClipboardCommand extends InputArgCommand<
  CopyToClipboardCommandOpts,
  void
> {
  key = DENDRON_COMMANDS.COPY_TO_CLIPBOARD.key;

  addAnalyticsPayload(opts: CopyToClipboardCommandOpts) {
    return { source: opts.source };
  }

  async execute(opts: CopyToClipboardCommandOpts) {
    const ctx = "execute";
    this.L.info({ ctx, opts });
    const { text, message } = opts;
    clipboard.writeText(text);
    window.showInformationMessage(message || "Text copied to clipboard");
  }
}
