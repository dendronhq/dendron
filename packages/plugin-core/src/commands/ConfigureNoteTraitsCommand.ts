import { CONSTANTS, DendronError } from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import { RegisterNoteTraitCommand } from "./RegisterNoteTraitCommand";

type CommandOpts = { traitId: string };

type CommandOutput = {} | undefined;

/**
 * Command for a user to register a new note type with custom functionality
 */
export class ConfigureNoteTraitsCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONFIGURE_NOTE_TRAITS.key;
  private readonly createNewOption = "Create New";

  async gatherInputs() {
    const registeredTraits =
      ExtensionProvider.getExtension().traitRegistrar.registeredTraits;

    const items: string[] = Array.from(registeredTraits.keys());

    items.unshift(this.createNewOption);

    const picked = await vscode.window.showQuickPick(items, {
      canPickMany: false,
      title: "Select which Note Trait to Configure",
    });

    if (
      (!picked || !registeredTraits.get(picked)) &&
      picked !== this.createNewOption
    ) {
      return;
    }

    return { traitId: picked };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    if (opts.traitId === this.createNewOption) {
      new RegisterNoteTraitCommand().run();
      return;
    }

    const engine = ExtensionProvider.getEngine();
    const { wsRoot } = engine;
    const scriptPath = path.join(
      wsRoot,
      CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE,
      opts.traitId + ".js"
    );

    if (await fs.pathExists(scriptPath)) {
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(scriptPath));
    } else {
      const error = DendronError.createPlainError({
        message: `${scriptPath} doesn't exist.`,
      });
      this.L.error({ error });
      return { error };
    }

    return;
  }
}
