import { commands, Location, Position, Selection } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  location: Location;
  text: string;
};

type CommandOutput = void;

export class ConvertCandidateLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONVERT_CANDIDATE_LINK.key;

  async gatherInputs(_opts: CommandOpts): Promise<CommandOpts> {
    return _opts;
  }

  async execute(_opts: CommandOpts) {
    const { location, text } = _opts;
    await commands.executeCommand("vscode.open", location.uri);
    const editor = VSCodeUtils.getActiveTextEditor()!;
    const selection = editor.document.getText(location.range);
    const preConversionOffset = selection.indexOf(text);
    const convertedSelection = selection.replace(text, `[[${text}]]`);
    await editor.edit((editBuilder) => {
      editBuilder.replace(location.range, convertedSelection);
    });
    const postConversionSelectionRange = new Selection(
      new Position(
        location.range.start.line,
        location.range.start.character + preConversionOffset
      ),
      new Position(
        location.range.end.line,
        location.range.start.character + preConversionOffset + text.length + 4
      )
    );
    editor.selection = postConversionSelectionRange;
    return;
  }
}
