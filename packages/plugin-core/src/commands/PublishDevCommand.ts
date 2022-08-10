import * as vscode from "vscode";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOutput = {};

export class PublishDevCommand extends BasicCommand<CommandOutput> {
  key = DENDRON_COMMANDS.PUBLISH_DEV.key;

  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute() {
    const ctx = "PublishDevCommand";
    this.L.info({ ctx, msg: "enter" });
    window
      .showWarningMessage(
        "The Dendron: Publish Dev command is now deprecated. Please use Dendron CLI to publish your notes.",
        ...["Open docs"]
      )
      .then((resp) => {
        if (resp === "Open docs") {
          vscode.commands.executeCommand(
            "vscode.open",
            "https://wiki.dendron.so/notes/2340KhiZJWUy31Nrn37Fd/"
          );
        }
      });
  }
}
