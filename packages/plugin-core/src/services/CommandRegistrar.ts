import { NoteType } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { CreateTypedNoteCommand } from "../commands/CreateTypedNoteCommand";

/**
 * Manages registration of new VS Code commands. This service is intended for
 * use of dynamically created (and registered) commands. Static commands that
 * are registered onActivate() should not use this class
 */
export class CommandRegistrar {
  private context: vscode.ExtensionContext;

  private CUSTOM_COMMAND_PREFIX = "dendron.customCommand.";

  readonly registeredCommands: {
    [typeId: string]: string;
  };

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.registeredCommands = {};
  }

  registerCommandForType(type: NoteType): void {
    const commandId = type.id;
    const cmd = new CreateTypedNoteCommand(commandId, type);

    const registeredCmdName = this.CUSTOM_COMMAND_PREFIX + commandId;
    this.registeredCommands[commandId] = registeredCmdName;
    const disp = vscode.commands.registerCommand(
      registeredCmdName,
      () => cmd.run(),
      this
    );
    this.context.subscriptions.push(disp);
  }

  unregisterType(type: NoteType): void {
    if (type.id in this.registeredCommands) {
      delete this.registeredCommands[type.id];
    }
  }
}
