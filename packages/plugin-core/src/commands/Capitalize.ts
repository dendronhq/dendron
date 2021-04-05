import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

export class CapitalizeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.CAPITALIZE.key;
  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async execute() {
    const { editor, selection, text } = VSCodeUtils.getSelection();
    if (!editor || !selection || !text) return "";

    const capitalized = text.replace(
      // For every word, capture the first letter and the remaining letters (if any)
      /(\w)(\w*)/g,
      // Capitalize the first letters, keep the rest unchanged
      (_match, head, tail) => head.toLocaleUpperCase() + tail
    );
    //const capitalized = selectedText.toLocaleUpperCase();
    editor.edit((editBuilder) => {
      editBuilder.replace(selection, capitalized);
    });

    return capitalized;
  }
}
