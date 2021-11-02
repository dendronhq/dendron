import { NoteType } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { getExtension } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = {
  type: NoteType;
};

type CommandInput = {
  type: NoteType;
};

/**
 * Command that can create a new noted with the specified user-defined custom
 * note type. This will find the registered {@link CreateTypedNoteCommand}
 * command corresponding to the passed in type and execute it, if the command
 * exists.
 */
export class CreateUserDefinedTypedNote extends BaseCommand<
  CommandOpts,
  CommandOpts,
  CommandInput
> {
  key = DENDRON_COMMANDS.CREATE_USER_DEFINED_NOTE.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const items = getExtension().typeRegistrar.registeredTypes;
    const picked = await vscode.window.showQuickPick(
      items.map((item) => item.id),
      { canPickMany: false }
    );

    if (!picked) {
      return;
    }

    const pickedType = items.find((t) => t.id === picked);

    return { type: pickedType! };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandInput> {
    return {
      type: inputs.type,
    };
  }

  async execute(opts: CommandOpts): Promise<CommandOpts> {
    const cmd = getExtension().typeRegistrar.getRegisteredCommandForType(
      opts.type
    );

    if (!cmd) {
      throw new Error("Unexpected unregistered type");
    }
    await vscode.commands.executeCommand(cmd);

    return opts;
  }
}
