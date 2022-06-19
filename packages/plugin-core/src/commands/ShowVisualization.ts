import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import * as vscode from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { getVisualizationContent } from "@dendronhq/dendron-viz";

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
    const ext = ExtensionProvider.getExtension();
    const engine = ext.getEngine();
    const { wsRoot } = engine;

    const visualizations = await getVisualizationContent({ engine, wsRoot });
    const thirdVault = Object.values(visualizations)[3];
    this._panel.webview.html = createHTML(thirdVault);
  }
}

function createHTML(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    ${content}
</body>
</html>`;
}
