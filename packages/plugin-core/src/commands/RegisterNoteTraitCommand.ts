import { CONSTANTS, DendronError } from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { UserDefinedTraitV1 } from "../traits/UserDefinedTraitV1";
import { VSCodeUtils } from "../utils";
import { getEngine, getExtension } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = { typeId: string };

type CommandOutput = {} | undefined;

const noteTraitTemplate = `
/**
 * Note: you must reload your window after each file change for it to take into
 * effect. We are working to improve this behavior.
 */
module.exports = {
  /**
   * Specify behavior to modify the name of the note. If
   * promptUserForModification is true, the modified name will appear in a
   * lookup control to allow the user to further edit the note name before
   * confirming.
   */
  OnWillCreate: {
    setNameModifier(props) {
      return {
        name: [props.currentNoteName, props.selectedText, props.clipboard].join(','),
        promptUserForModification: true
      };
    }
  },
  /**
   * Specify behavior for altering the title of the note when it is created.
   */
  OnCreate: {
    setTitle(props) {
      return [props.currentNoteName, props.selectedText, props.clipboard].join(',');
    }
  }
}
`;

/**
 * Command for a user to register a new note type with custom functionality
 */
export class RegisterNoteTraitCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.REGISTER_NOTE_TYPE.key;

  async gatherInputs() {
    const typeId = await VSCodeUtils.showInputBox({
      placeHolder: "name of type",
    });
    if (!typeId) {
      return undefined;
    }

    return { typeId };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    vscode.window.showInformationMessage("Enter Your Type Functionality");

    const engine = getEngine();
    const { wsRoot } = engine;
    const scriptPath = path.join(
      wsRoot,
      CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE,
      opts.typeId + ".js"
    );

    fs.ensureDirSync(path.dirname(scriptPath));
    if (fs.existsSync(scriptPath)) {
      const error = DendronError.createPlainError({
        message: `${scriptPath} exists`,
      });
      this.L.error({ error });
      return { error };
    }
    fs.writeFileSync(scriptPath, noteTraitTemplate);

    const newNoteType = new UserDefinedTraitV1(opts.typeId, scriptPath);
    getExtension().typeRegistrar.registerTrait(newNoteType);

    await VSCodeUtils.openFileInEditor(vscode.Uri.file(scriptPath));
    return;
  }
}
