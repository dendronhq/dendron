import * as vscode from "vscode";
// import { ShowHelpCommand } from "../commands/ShowHelp";
// import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
// import { Logger } from "../logger";
// import { DWorkspace } from "../workspacev2";

export function activate(context: vscode.ExtensionContext) {
  // eslint-disable-next-line no-console
  console.log("inside web activate");

  vscode.window.showInformationMessage("Hello World");
  // Logger.configure(context, "debug");
  // require("../_extension").activate(context); // eslint-disable-line global-require
  // return {
  //   DWorkspace,
  //   Logger,
  // };

  _setupCommands({ context });
}

export function deactivate() {
  // require("./_extension").deactivate(); // eslint-disable-line global-require
}

async function _setupCommands({
  context,
}: {
  context: vscode.ExtensionContext;
}) {
  const existingCommands = await vscode.commands.getCommands();

  const COMMANDS: any[] = [];
  // const COMMANDS = [ShowHelpCommand];

  // add all commands
  COMMANDS.map((Cmd) => {
    const cmd = new Cmd();

    if (!existingCommands.includes(cmd.key))
      context.subscriptions.push(
        vscode.commands.registerCommand(cmd.key, async (args: any) => {
          await cmd.run(args);
        })
        // sentryReportingCallback(async (args: any) => {
        //   await cmd.run(args);
        // })
      );
  });
}
