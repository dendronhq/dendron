// import { WebViewPanelFactory } from "./SeedBrowseCommand";
// import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import * as vscode from "vscode";
import { VisualizationFactory } from "../components/views/VisualizationFactory";
// import {
//   DendronEditorViewKey,
//   getWebEditorViewEntry,
// } from "@dendronhq/common-all";
// import { ExtensionProvider } from "../ExtensionProvider";
// import { WebViewUtils } from "../views/utils";

type CommandOpts = {};

type CommandOutput = void;

export class ShowVisualizationCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static requireActiveWorkspace: boolean = true;

  key = DENDRON_COMMANDS.SHOW_VISUALIZATION.key;

  private _panel;

  /* Get the panel on which to display visualization */
  constructor(panel: vscode.WebviewPanel) {
    super();
    this._panel = panel;
  }

  async execute() {
    console.log(this._panel);
    // const panel = await VisualizationFactory.create();
    // panel.webview.html = getWebviewContent();
  }
}

// function getWebviewContent() {
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Cat Coding</title>
// </head>
// <body>
//     <h1>Hello World</h1>
// </body>
// </html>`;
// }
