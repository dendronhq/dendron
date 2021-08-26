import * as vscode from "vscode";
import { Logger } from "./logger";
import { DWorkspace } from "./workspacev2";

export function activate(context: vscode.ExtensionContext) {
  Logger.configure(context, "debug");
  require("./_extension").activate(context); // eslint-disable-line global-require
  return {
    DWorkspace,
    Logger,
  };
}

export function deactivate() {
  require("./_extension").deactivate(); // eslint-disable-line global-require
}
