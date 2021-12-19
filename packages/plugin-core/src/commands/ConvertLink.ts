import {
  commands,
  Location,
  Position,
  QuickPickItem,
  Selection,
  TextDocument,
  TextEditor,
} from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import {
  getReferenceAtPosition,
  getReferenceAtPositionResp,
} from "../utils/md";
import { DendronError, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { getDWorkspace } from "../workspace";
import { WSUtils } from "../WSUtils";
import { LinkUtils } from "@dendronhq/engine-server";
import _ from "lodash";

type CommandOpts = {
  document: TextDocument;
  selection: Selection;
  option?: QuickPickItem;
};

type CommandOutput = void;

export class ConvertLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONVERT_LINK.key;

  async promptConvertOptions(reference: getReferenceAtPositionResp) {
    const parsedLink = LinkUtils.parseLinkV2({
      linkString: reference.refText,
      explicitAlias: true,
    });
    const aliasOption: QuickPickItem = {
      label: "Alias",
      description: parsedLink?.alias,
      detail: "Convert broken link to alias text.",
    };
    const hierarchyOption: QuickPickItem = {
      label: "Hierarchy",
      description: parsedLink?.value,
      detail: "Convert broken link to hierarchy.",
    };
    const noteNameOption: QuickPickItem = {
      label: "Note name",
      description: _.last(parsedLink?.value?.split(".")),
      detail:
        "Convert broken link to note name excluding hierarchy except the basename.",
    };
    const promptOption: QuickPickItem = {
      label: "Prompt",
      detail: "Input plaintext to convert broken link to.",
    };
    const createOption: QuickPickItem = {
      label: "Create",
      detail: "Create new note where the broken link is pointing to.",
    };
    const changeDestinationOption: QuickPickItem = {
      label: "Change destination",
      detail: "Lookup existing note to link instead of current broken link.",
    };

    const options: QuickPickItem[] = [
      hierarchyOption,
      noteNameOption,
      promptOption,
      createOption,
      changeDestinationOption,
    ];

    if (parsedLink?.alias) {
      options.unshift(aliasOption);
    }

    const option = await VSCodeUtils.showQuickPick(options, {
      title: "Pick how you want to convert the broken link.",
      ignoreFocusOut: true,
      canPickMany: false,
    });
    return option;
  }

  async gatherInputs(): Promise<CommandOpts> {
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

    let option;
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
        option = await this.promptConvertOptions(reference);
      } else {
        // we can potentially enhance this case to
        // support general link manipulation features
        throw new DendronError({
          message: `Link at cursor position is not a broken link.`,
        });
      }
    }

    return {
      document,
      selection,
      option,
    };
  }

  async execute(opts: CommandOpts) {
    const { document, selection, option } = opts;
    console.log({ document, selection, option });
    // const { location, text } = _opts;
    // await commands.executeCommand("vscode.open", location.uri);
    // const editor = VSCodeUtils.getActiveTextEditor()!;
    // const selection = editor.document.getText(location.range);
    // const preConversionOffset = selection.indexOf(text);
    // const convertedSelection = selection.replace(text, `[[${text}]]`);
    // await editor.edit((editBuilder) => {
    //   editBuilder.replace(location.range, convertedSelection);
    // });
    // const postConversionSelectionRange = new Selection(
    //   new Position(
    //     location.range.start.line,
    //     location.range.start.character + preConversionOffset
    //   ),
    //   new Position(
    //     location.range.end.line,
    //     location.range.start.character + preConversionOffset + text.length + 4
    //   )
    // );
    // editor.selection = postConversionSelectionRange;
    return;
  }
}
