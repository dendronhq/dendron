import { DendronError, NoteTrait } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { BaseCommand } from "./base";

type CommandOpts = {
  trait: NoteTrait;
};

type CommandInput = {
  trait: NoteTrait;
};

/**
 * Command that can create a new noted with the specified user-defined custom
 * note traits. This will find the registered {@link CreateNoteWithTraitCommand}
 * command corresponding to the passed in type and execute it, if the command
 * exists.
 */
export class CreateNoteWithUserDefinedTrait extends BaseCommand<
  CommandOpts,
  CommandOpts,
  CommandInput
> {
  key = DENDRON_COMMANDS.CREATE_USER_DEFINED_NOTE.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const registeredTraits =
      ExtensionProvider.getExtension().traitRegistrar.registeredTraits;
    const items = registeredTraits.keys();
    const picked = await vscode.window.showQuickPick(Array.from(items), {
      canPickMany: false,
    });

    if (!picked || !registeredTraits.get(picked)) {
      return;
    }

    return { trait: registeredTraits.get(picked)! };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandInput> {
    return {
      trait: inputs.trait,
    };
  }

  async execute(opts: CommandOpts): Promise<CommandOpts> {
    const cmd =
      ExtensionProvider.getExtension().traitRegistrar.getRegisteredCommandForTrait(
        opts.trait
      );

    if (!cmd) {
      throw new DendronError({ message: "Unexpected unregistered type" });
    }
    await vscode.commands.executeCommand(cmd);

    return opts;
  }
}
