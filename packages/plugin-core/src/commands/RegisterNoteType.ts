import { CONSTANTS, DendronError } from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { UserDefinedTypeV1 } from "../noteTypes/userDefinedTypeV1";
import { VSCodeUtils } from "../utils";
import { getEngine, getExtension } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = { typeId: string };

type CommandOutput = {} | undefined;

const noteTypeTemplate = `
module.exports = {
  onWillCreate: {
    setNameModifier(props) {
      return {
        name: [props.currentNoteName, props.selectedText, props.clipboard].join(','),
        promptUserForModification: true
      };
    }
  },
  onCreate: {
    setTitle(props) {
      return [props.currentNoteName, props.selectedText, props.clipboard].join(',');
    }
  }
}
`;

/**
 * Command for a user to register a new note type with custom functionality
 */
export class RegisterNoteTypeCommand extends BasicCommand<
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
      CONSTANTS.DENDRON_USER_NOTE_TYPES_BASE,
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
    fs.writeFileSync(scriptPath, noteTypeTemplate);

    const newNoteType = new UserDefinedTypeV1(opts.typeId, scriptPath);
    getExtension().typeRegistrar.registerType(newNoteType);

    await VSCodeUtils.openFileInEditor(vscode.Uri.file(scriptPath));
    return;
  }
}
