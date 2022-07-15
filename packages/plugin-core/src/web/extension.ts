import * as vscode from "vscode";
// import { Logger } from "../logger";
// import { DWorkspace } from "./workspacev2";

export function activate(_context: vscode.ExtensionContext) {
  console.log("inside web activate");

  vscode.window.showInformationMessage("Hello World");
  // Logger.configure(context, "debug");
  // require("./_extension").activate(context); // eslint-disable-line global-require
  // return {
  //   DWorkspace,
  //   Logger,
  // };
}

export function deactivate() {
  // require("./_extension").deactivate(); // eslint-disable-line global-require
}
