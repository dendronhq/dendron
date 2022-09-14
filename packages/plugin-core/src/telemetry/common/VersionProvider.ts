import * as vscode from "vscode";

export class VersionProvider {
  private _version: string;
  constructor(context: vscode.ExtensionContext) {
    this._version = context.extension.packageJSON.version ?? "0.0.0";
  }

  /**
   * The current version of the plugin.
   */
  public get version() {
    return this._version;
  }
}
