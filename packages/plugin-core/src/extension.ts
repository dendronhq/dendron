import * as vscode from "vscode";
import { Logger } from "./logger";

export function activate(context: vscode.ExtensionContext) {
  Logger.configure(context, "debug");
  require("./_extension").activate(context);
}

export function deactivate() {
  require("./_extension").deactivate();
}
