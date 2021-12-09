import { CONSTANTS, DendronError } from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { UserDefinedTraitV1 } from "../traits/UserDefinedTraitV1";
import { VSCodeUtils } from "../vsCodeUtils";
import { getEngine, getExtension } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = { traitId: string };

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
  key = DENDRON_COMMANDS.REGISTER_NOTE_TRAIT.key;

  async gatherInputs() {
    const traitId = await VSCodeUtils.showInputBox({
      placeHolder: "name of trait",
    });
    if (!traitId) {
      return undefined;
    }

    return { traitId };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    vscode.window.showInformationMessage("Enter Your Trait Functionality");

    const engine = getEngine();
    const { wsRoot } = engine;
    const scriptPath = path.join(
      wsRoot,
      CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE,
      opts.traitId + ".js"
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

    const newNoteTrait = new UserDefinedTraitV1(opts.traitId, scriptPath);
    getExtension().traitRegistrar.registerTrait(newNoteTrait);

    await VSCodeUtils.openFileInEditor(vscode.Uri.file(scriptPath));
    return;
  }
}
