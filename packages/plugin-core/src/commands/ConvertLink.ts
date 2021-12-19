import {
  commands,
  Location,
  Position,
  QuickPickItem,
  Selection,
  TextEditor,
} from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import { getReferenceAtPosition } from "../utils/md";
import { DendronError, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { getDWorkspace } from "../workspace";
import { WSUtils } from "../WSUtils";

type CommandOpts = {
  location: Location;
  text: string;
};

type CommandOutput = void;

export class ConvertLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONVERT_LINK.key;

  async promptConvertOptions() {
    const options: QuickPickItem[] = [
      {
        label: "Alias",
        description: "Convert broken link to alias text.",
        detail: "sdfsdf",
      },
      {
        label: "Hierarchy",
        description: "Convert broken link to hierarchy.",
        detail: "sdf",
      },
      {
        label: "Note name",
        description:
          "Convert broken link to note name excluding hierarchy except the basename.",
        detail: "sdfoijweg",
      },
      {
        label: "Prompt",
        description: "Input plaintext to convert broken link to.",
        detail: "Wefoijweg",
      },
      {
        label: "Create",
        description: "Create new note where the broken link is pointing to.",
        detail: "weofijweg",
      },
      {
        label: "Change destination",
        description:
          "Lookup existing note to link instead of current broken link.",
        detail: "weoifjwef",
      },
    ];
    await VSCodeUtils.showQuickPick(options, {
      title: "Pick how you want to convert the broken link.",
      ignoreFocusOut: true,
      canPickMany: false,
    });
  }

  async gatherInputs(_opts: CommandOpts): Promise<CommandOpts> {
    const { engine } = getDWorkspace();
    const { vaults, wsRoot, notes } = engine;
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const { document, selection } = editor;
    const reference = getReferenceAtPosition(document, selection.start);

    console.log({ reference });

    if (reference === null) {
      throw new DendronError({
        message: `No link at cursor position.`,
      });
    }

    const { ref, vaultName } = reference;
    const targetVault = vaultName
      ? VaultUtils.getVaultByName({ vaults, vname: vaultName })
      : WSUtils.getVaultFromDocument(document);

    if (targetVault === undefined) {
      console.log("this link points to a note in a vault that doesn't exist");
    } else {
      const targetNote = NoteUtils.getNoteByFnameV5({
        fname: ref,
        notes,
        vault: targetVault,
        wsRoot,
      });

      if (targetNote === undefined) {
        console.log("this link points to a note that doesn't exist.");
        await this.promptConvertOptions();
      } else {
        // we can potentially enhance this case to
        // support general link manipulation features
        throw new DendronError({
          message: `Link at cursor position is not a broken link.`,
        });
      }
    }

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
