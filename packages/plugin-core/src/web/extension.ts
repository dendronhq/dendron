import * as vscode from "vscode";
// import { DENDRON_COMMANDS } from "../constants";
import {
  DendronEngineV3Web,
  LookupQuickpickFactory,
} from "@dendronhq/plugin-common";
import { MockEngineAPIService } from "./test/helpers/MockEngineAPIService";
// import { DendronEngineV3Web } from "@dendronhq/plugin-common";
// import { DendronEngineV3Web } from "@dendronhq/engine-server";
// import { ShowHelpCommand } from "../commands/ShowHelp";
// import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
// import { Logger } from "../logger";
// import { DWorkspace } from "../workspacev2";

export function activate(context: vscode.ExtensionContext) {
  // eslint-disable-next-line no-console
  console.log("inside web activate");

  vscode.window.showInformationMessage("Hello World");

  // const activeEditor = vscode.window.activeTextEditor;

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((activeEditor) => {
      console.log("Inside callback");
      vscode.window.showInformationMessage(
        "Inside OnDidChangeActiveTextEditor"
      );
      console.log(`Scheme is ${activeEditor?.document.uri.scheme}`);
    })
  );

  _setupCommands({ context });

  importTest();

  // if (activeEditor) {
  //   console.log("foo");
  // }
  // if (activeEditor?.document.uri.fsPath === event.document.uri.fsPath) {

  // _setupCommands({ context });
}

export function deactivate() {
  // require("./_extension").deactivate(); // eslint-disable-line global-require
}

function importTest() {
  DendronEngineV3Web.foo();
}

async function _setupCommands({
  context,
}: {
  context: vscode.ExtensionContext;
}) {
  const existingCommands = await vscode.commands.getCommands();

  const key = "dendron.lookupNote";

  if (!existingCommands.includes(key))
    context.subscriptions.push(
      vscode.commands.registerCommand(key, async (_args: any) => {
        const factory = new LookupQuickpickFactory(new MockEngineAPIService());
        factory.ShowLookup();
        // qp.show();
      })
      // sentryReportingCallback(async (args: any) => {
      //   await cmd.run(args);
      // })
    );
}
