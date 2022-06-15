import { CONSTANTS, DendronError } from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { UserDefinedTraitV1 } from "../traits/UserDefinedTraitV1";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = { traitId: string };

type CommandOutput = {} | undefined;

const noteTraitTemplate = `
/**
 * Define your custom trait behavior in this file by modifying the functions in
 * 'module.exports' below. See
 * https://wiki.dendron.so/notes/EQoaBI8A0ZcswKQC3UMpO/ for examples and
 * documentation.
 *
 * NOTE: This is an alpha feature, so this API may have breaking changes in
 * future releases.
 */

/**
 * @typedef OnCreateContext Properties that can be utilized during note creation
 * @type {object}
 * @property {string} currentNoteName The name of the currently opened Dendron
 * note, or the specified name of the note about to be created
 * @property {string} selectedText Any currently selected text in the editor
 * @property {number} clipboard The current contents of the clipboard
 */

/**
 * @typedef SetNameModifierReturnType Properties that can be utilized during
 * note creation
 * @type {object}
 * @property {string} name The name to use for the note
 * @property {boolean} promptUserForModification if true, the modified name will
 * appear in a lookup control to allow the user to further edit the note name
 * before confirming.
 */

/**
 * lodash module is available. See https://lodash.com/docs for documentation.
 */
const _ = module.require("lodash");

/**
 * luxon is available for Date functions. See
 * https://moment.github.io/luxon/api-docs/index.html for documentation
 */
const luxon = module.require("luxon");

module.exports = {
  OnWillCreate: {
    /**
     * Specify behavior to modify the name of the note.
     * @param {OnCreateContext} props
     * @returns {SetNameModifierReturnType} the name to use for the note. If
     * promptUserForModification is true, the modified name will appear in a
     * lookup control to allow the user to further edit the note name before
     * confirming.
     */
    setNameModifier(props) {
      // This example sets a prefix of 'my-hierarchy', and then adds a date
      // hierarchy using the luxon module. PromptUserForModification is set to
      // true so that the user has the option to alter the title name before
      // creating the note.
      return {
        name: "my-hierarchy." + luxon.DateTime.local().toFormat("yyyy.MM.dd"),
        promptUserForModification: true,
      };
    },
  },
  OnCreate: {
    /**
     * Specify behavior for altering the title of the note when it is created.
     * @param {OnCreateContext} props
     * @returns {string} the title to set for the note
     */
    setTitle(props) {
      // This example will use the currentNoteName property, extract the
      // yyyy.MM.dd date portion of the note name, and then reformat it with
      // dashes.
      return props.currentNoteName.split(".").slice(-3).join("-");
    },
    /**
     * Set a note template to be applied. This method is optional, if you don't
     * want to apply a template, simply delete this 'setTemplate' property.
     * @returns the name of the desired template note from this function
     */
    setTemplate: () => {
      return "root";
    },
  },
};
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

    const engine = ExtensionProvider.getEngine();
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
    ExtensionProvider.getExtension().traitRegistrar.registerTrait(newNoteTrait);

    await VSCodeUtils.openFileInEditor(vscode.Uri.file(scriptPath));
    return;
  }
}
